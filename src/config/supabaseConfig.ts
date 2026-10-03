/**
 * Supabase Configuration for AgriRoute
 * Replace the placeholder SUPABASE_URL and SUPABASE_ANON_KEY with your project credentials.
 * You can find them in your Supabase Dashboard under Project Settings -> API.
 */

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://YOUR_PROJECT_ID.supabase.co';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
