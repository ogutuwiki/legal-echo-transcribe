-- Fix RLS security issues

-- Enable RLS on hearings table
ALTER TABLE public.hearings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for hearings table
CREATE POLICY "Users can view their own hearings" 
ON public.hearings 
FOR SELECT 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own hearings" 
ON public.hearings 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own hearings" 
ON public.hearings 
FOR UPDATE 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own hearings" 
ON public.hearings 
FOR DELETE 
USING (auth.uid()::text = user_id);

-- Enable RLS on projects table
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for projects table
CREATE POLICY "Users can view their own projects" 
ON public.projects 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" 
ON public.projects 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" 
ON public.projects 
FOR DELETE 
USING (auth.uid() = user_id);