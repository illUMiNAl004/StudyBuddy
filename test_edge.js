import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Invoking edge function...");
  const { data, error } = await supabase.functions.invoke('Aidan-SI-scrapper', {
    body: { course: 'NONE', action: 'get_courses' }
  });
  console.log("DATA:", data);
  console.log("ERROR:", error);
}

test();
