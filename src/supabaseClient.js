import { createClient } from '@supabase/supabase-js';

// 1. Your unique database location URL endpoint
const supabaseUrl = 'https:dbbctrmjnbqvshdlkjld.supabase.co';

// 2. Your public browser access key (The long one starting with sb_publishable...)
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiYmN0cm1qbmJxdnNoZGxramxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MDMzMTAsImV4cCI6MjA5NjQ3OTMxMH0.rv9-5IPvD1WZnCb3wPw8vraa3fRPXHDiLe369lVtpFk'; 

// 3. Initialize and export the secure communication connection
export const supabase = createClient(supabaseUrl, supabaseAnonKey);