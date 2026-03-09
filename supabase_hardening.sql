-- Supabase Hardening Script for Portfolio
-- This script sets up Row Level Security (RLS) for the portfolio_status table.

-- 1. Enable RLS on the table
ALTER TABLE public.portfolio_status ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies (if any) to start fresh
DROP POLICY IF EXISTS "Public read access" ON public.portfolio_status;
DROP POLICY IF EXISTS "Service role write access" ON public.portfolio_status;

-- 3. Create a policy for public READ access (Allow everyone to see the status)
CREATE POLICY "Public read access" 
ON public.portfolio_status 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- 4. Create a policy for SERVICE ROLE ONLY write access
-- This ensures that only the bot (using the service_role key) can update the status, 
-- even if someone has the anon key from the frontend.
CREATE POLICY "Service role write access" 
ON public.portfolio_status 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- NOTE: Ensure that the 'anon' role does NOT have INSERT, UPDATE, or DELETE permissions 
-- without a policy specifically allowing it. By default, ENABLE RLS denies all 
-- operations not explicitly allowed by a policy.
