import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Signing up...");
  const { data, error } = await supabase.auth.signUp({
    email: 'test' + Math.random() + '@umass.edu',
    password: 'Password123!',
    options: { data: { full_name: 'Test User', major: 'Computer Science', class_year: '2027', si_courses: [] } },
  });
  console.log("DATA:", data);
  console.log("ERROR:", error);
}

test();
