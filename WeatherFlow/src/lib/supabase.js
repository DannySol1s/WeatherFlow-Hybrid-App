import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vhjpzbakqzwupoubkten.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoanB6YmFrcXp3dXBvdWJrdGVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5Mzg5MDYsImV4cCI6MjA4ODUxNDkwNn0.LkFiUG9VD70eM_7f-EpwZJd9JrUL4MP_wr9mi3hpiW4';

export const supabase = createClient(supabaseUrl, supabaseKey);
