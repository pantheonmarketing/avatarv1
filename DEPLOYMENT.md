# Deployment Guide

## Environment Setup

1. Development (localhost:3000)
   - Copy `.env.development` to `.env.local`
   - Run `npm run dev`

2. Production
   - Set environment variables in your hosting platform
   - Run `npm run build && npm run start`

## Environment Variables Required

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

## Supabase Setup

1. Development:
   - Use development database
   - Use development API keys

2. Production:
   - Use production database
   - Use production API keys
   - Ensure RLS policies are properly configured

## Clerk Setup

1. Development:
   - Use development instance
   - Use development API keys

2. Production:
   - Use production instance
   - Use production API keys

## Deployment Steps

1. Set environment variables
2. Run build: `npm run build`
3. Start server: `npm run start` 