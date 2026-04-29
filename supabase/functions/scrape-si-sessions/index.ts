import { createClient } from 'jsr:@supabase/supabase-js@2';
import { DOMParser } from 'jsr:@b-fuze/deno-dom';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

function parseDateTime(dateStr, timeStr, year) {
  // dateStr is like "4/28" or "12/04"
  const [month, day] = dateStr.split('/');
  // Appending EST fixes the timezone bug where Edge Functions (UTC) incorrectly shifted times!
  const dt = new Date(`${month}/${day}/${year} ${timeStr.trim()} EST`);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  const hh = String(dt.getHours()).padStart(2, '0');
  const min = String(dt.getMinutes()).padStart(2, '0');
  // Formats to valid Postgres TIMESTAMPTZ explicitly declaring it is now properly shifted to UTC time
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:00+00`; 
}

function parseCellSessions(cell, dateStr, year) {
  let sessionDivs = [...cell.children].filter(
    el => el.classList.contains('margin-10px-top')
  );
  if (sessionDivs.length === 0) {
    const wrapper = cell.firstElementChild;
    if (wrapper) {
      sessionDivs = [...wrapper.children].filter(
        el => el.classList.contains('margin-10px-top')
      );
    }
  }
  if (sessionDivs.length === 0) return [];

  const sessions = [];

  for (const div of sessionDivs) {
    const roomDiv = div.querySelector('div.text-white');
    const timeDiv = div.querySelector('div.font-size14');

    if (!roomDiv || !timeDiv) continue;

    const room = roomDiv.textContent?.trim() ?? '';
    const timeText = (timeDiv.textContent ?? '').split(/\s+/).join(' ').trim();
    const timeParts = timeText.split(' - ');
    if (timeParts.length !== 2) continue;

    const [startStr, endStr] = timeParts;
    const startTime = parseDateTime(dateStr, startStr, year);
    const endTime = parseDateTime(dateStr, endStr, year);
    sessions.push({ room, startTime, endTime });
  }

  return sessions;
}

Deno.serve(async (req) => {
  // 1. Fixed: Properly handle CORS for all responses
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { course, group_id, action } = await req.json();
    
    // 2. Fixed Error Handling: Now returns CORS headers on validation errors so frontend can read them
    if (!course) {
      return new Response(JSON.stringify({ error: 'Missing required field: course' }), { status: 400, headers: corsHeaders });
    }
    if (!group_id && action !== 'fetch' && action !== 'get_courses') {
      // CRITICAL FIX: The database calendar_events table uses 'group_id', NOT 'user_id'
      return new Response(JSON.stringify({ error: 'Missing required field: group_id' }), { status: 400, headers: corsHeaders });
    }

    // 3. SECURE AUTHENTICATION
    // Extract the JWT sent by the frontend instead of using SERVICE_ROLE_KEY to enforce Row Level Security
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_ANON_KEY'), // Changed to Anon Key
      { global: { headers: { Authorization: authHeader } } }
    );

    const res = await fetch('https://lrcstaff.umass.edu/htmx_apis/si_schedule/');
    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch LRC page' }), { status: 502, headers: corsHeaders });
    }

    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const tables = doc.querySelectorAll('table');
    const rowsToInsert = [];
    
    // 4. Fixed: Evaluated inside the function so it doesn't get stale if function stays warm into next year
    const CURRENT_YEAR = new Date().getFullYear();

    for (const table of tables) {
      let headers = [...table.querySelectorAll('th')].map(th => th.textContent?.trim() ?? '');
      const rows = [...table.querySelectorAll('tr')];
      
      let dataRows;
      if (headers.length === 0 && rows.length > 0) {
        headers = [...rows[0].querySelectorAll('td')].map(td => td.textContent?.trim() ?? '');
        dataRows = rows.slice(1);
      } else {
        dataRows = rows.slice(1);
      }

      for (const row of dataRows) {
        const cells = [...row.querySelectorAll('td, th')];
        if (cells.length < 2) continue;

        const courseName = cells[0].textContent?.trim() ?? '';
        if (!courseName || courseName.toLowerCase() === 'course') continue;
        
        // If getting list of courses, just add to rowsToInsert and skip the rest
        if (action === 'get_courses') {
          rowsToInsert.push(courseName);
          continue;
        }

        // Support fetching ALL Computer Science courses, or an array of courses, or a single course
        if (course === 'ALL_CS') {
          if (!courseName.toUpperCase().includes('COMPSCI') && !courseName.toUpperCase().includes('CICS')) {
            continue;
          }
        } else if (Array.isArray(course)) {
          if (!course.map(c => c.toLowerCase()).includes(courseName.toLowerCase())) {
            continue;
          }
        } else {
          if (courseName.toLowerCase() !== course.toLowerCase()) continue;
        }

        for (let i = 1; i < cells.length; i++) {
          const dayLabel = i < headers.length ? headers[i] : `Col_${i}`;
          
          // 5. Fixed: Robust Date Regex Parsing instead of fragile slice(-5)
          const dateMatch = dayLabel.match(/\d{1,2}\/\d{1,2}/);
          if (!dateMatch) continue;
          const dateStr = dateMatch[0];

          const sessions = parseCellSessions(cells[i], dateStr, CURRENT_YEAR);
          for (const { room, startTime, endTime } of sessions) {
            rowsToInsert.push({
              id: crypto.randomUUID(),
              group_id: group_id || null, // Will be null if action is 'fetch'
              start_time: startTime,
              end_time: endTime,
              location: `${courseName}: ${room}`,
              is_si_session: true,
              course_name: courseName
            });
          }
        }
      }
    }

    if (action === 'get_courses') {
      const uniqueCourses = [...new Set(rowsToInsert)].sort();
      return new Response(JSON.stringify({ courses: uniqueCourses }), { headers: corsHeaders });
    }

    if (rowsToInsert.length === 0) {
      if (action === 'fetch') return new Response(JSON.stringify({ sessions: [] }), { headers: corsHeaders });
      return new Response(JSON.stringify({ inserted: 0, message: 'No sessions found for that course.' }), { headers: corsHeaders });
    }

    // If action is fetch, return the data instead of inserting it into DB
    if (action === 'fetch') {
      return new Response(JSON.stringify({ sessions: rowsToInsert }), { headers: corsHeaders });
    }

    // 6. Insert runs safely: User's auth JWT proves they are allowed to upload to this group.
    const { error } = await supabase.from('calendar_event').insert(rowsToInsert.map(r => ({
      id: r.id, group_id: r.group_id, start_time: r.start_time, end_time: r.end_time, location: r.location
    })));
    
    if (error) {
      console.error('Supabase insert error:', error.message);
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ inserted: rowsToInsert.length }), { headers: corsHeaders });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: corsHeaders });
  }
});