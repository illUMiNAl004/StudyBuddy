import { createClient } from 'jsr:@supabase/supabase-js@2';
import { DOMParser } from 'jsr:@b-fuze/deno-dom';

const CURRENT_YEAR = new Date().getFullYear();


function parseDateTime(dateStr, timeStr) {
  const [month, day] = dateStr.split('/');
  const dt = new Date(`${month}/${day}/${CURRENT_YEAR} ${timeStr.trim()}`);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  const hh = String(dt.getHours()).padStart(2, '0');
  const min = String(dt.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:00+00`;
}


function parseCellSessions(cell, dateStr) {
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

    if (!roomDiv || !timeDiv) {
      console.warn('  WARNING: Could not find room or time div in session, skipping.');
      continue;
    }

    const room = roomDiv.textContent?.trim() ?? '';
    const timeText = (timeDiv.textContent ?? '').split(/\s+/).join(' ').trim();

    const timeParts = timeText.split(' - ');
    if (timeParts.length !== 2) {
      console.warn(`  WARNING: Unexpected time format '${timeText}', skipping.`);
      continue;
    }

    const [startStr, endStr] = timeParts;
    const startTime = parseDateTime(dateStr, startStr);
    const endTime = parseDateTime(dateStr, endStr);
    sessions.push({ room, startTime, endTime });
  }

  return sessions;
}


Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { course, user_id } = await req.json();
    if (!course) {
      return new Response(JSON.stringify({ error: 'Missing required field: course' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (!user_id) {
      return new Response(JSON.stringify({ error: 'Missing required field: user_id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    );

    const res = await fetch('https://www.umass.edu/lrc/si-sessions-schedule');
    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch LRC page' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const tables = doc.querySelectorAll('table');
    const rowsToInsert = [];

    console.log(`Found ${tables.length} tables. Processing for course: ${course}`);

    for (const table of tables) {
      let headers = [...table.querySelectorAll('th')].map(
        th => th.textContent?.trim() ?? ''
      );

      const rows = [...table.querySelectorAll('tr')];
      let dataRows;
      if (headers.length === 0 && rows.length > 0) {
        headers = [...rows[0].querySelectorAll('td')].map(
          td => td.textContent?.trim() ?? ''
        );
        dataRows = rows.slice(1);
      } else {
        dataRows = rows.slice(1);
      }

      for (const row of dataRows) {
        const cells = [...row.querySelectorAll('td, th')];
        if (cells.length < 2) continue;

        const courseName = cells[0].textContent?.trim() ?? '';
        if (!courseName || courseName.toLowerCase() === 'course') continue;
        if (courseName.toLowerCase() !== course.toLowerCase()) continue;

        for (let i = 1; i < cells.length; i++) {
          const dayLabel = i < headers.length ? headers[i] : `Col_${i}`;
          const dateStr = dayLabel.slice(-5);
          if (!dateStr.includes('/')) continue;

          const sessions = parseCellSessions(cells[i], dateStr);
          for (const { room, startTime, endTime } of sessions) {
            rowsToInsert.push({
              id: crypto.randomUUID(),
              user_id: user_id,
              start_time: startTime,
              end_time: endTime,
              location: room,
            });
          }
        }
      }
    }

    if (rowsToInsert.length === 0) {
      return new Response(JSON.stringify({ inserted: 0, message: 'No sessions found for that course.' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const { error } = await supabase.from('calendar_event').insert(rowsToInsert);
    if (error) {
      console.error('Supabase insert error:', error.message);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    return new Response(JSON.stringify({ inserted: rowsToInsert.length }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});