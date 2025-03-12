
import { createClient } from '@supabase/supabase-js';

// These environment variables are automatically used by the Supabase client
const supabaseUrl = 'https://vinqspzrqzqxawubqcny.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpbnFzcHpycXpxeGF3dWJxY255Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3NjExMjAsImV4cCI6MjA1NzMzNzEyMH0.tOZrkZGizKBYTFMvRvrFSjj0otxl6s0QaIOvgTyBoUE';

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
