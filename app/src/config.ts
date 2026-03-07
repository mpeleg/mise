// For dev: reads from .env via babel transform or fallback
// Move to Supabase Edge Function for production
export const ANTHROPIC_API_KEY =
  process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '';
