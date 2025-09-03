-- Create profiles table for lawyers and judges
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  title TEXT, -- e.g., "District Judge", "Defense Attorney", "Prosecutor"
  organization TEXT, -- Law firm, court, etc.
  license_number TEXT, -- Bar license number
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create transcriptions table to store all transcribed content
CREATE TABLE public.transcriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- Full transcription text
  case_number TEXT, -- Optional case reference
  hearing_type TEXT, -- e.g., "Deposition", "Trial", "Hearing"
  audio_duration INTEGER, -- Duration in seconds
  speaker_count INTEGER DEFAULT 0,
  confidence_score DECIMAL(3,2), -- Average confidence score
  file_name TEXT, -- Original audio/video filename
  file_size INTEGER, -- File size in bytes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create transcription segments table for detailed breakdown
CREATE TABLE public.transcription_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transcription_id UUID REFERENCES public.transcriptions(id) ON DELETE CASCADE NOT NULL,
  speaker_label TEXT NOT NULL, -- e.g., "Judge", "Attorney", "Witness"
  text_content TEXT NOT NULL,
  start_time DECIMAL(10,3), -- Start time in seconds
  end_time DECIMAL(10,3), -- End time in seconds
  confidence_score DECIMAL(3,2), -- Confidence for this segment
  segment_order INTEGER NOT NULL, -- Order within the transcription
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcription_segments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for transcriptions
CREATE POLICY "Users can view their own transcriptions" 
ON public.transcriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transcriptions" 
ON public.transcriptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transcriptions" 
ON public.transcriptions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transcriptions" 
ON public.transcriptions 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for transcription segments
CREATE POLICY "Users can view segments of their transcriptions" 
ON public.transcription_segments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.transcriptions 
    WHERE transcriptions.id = transcription_segments.transcription_id 
    AND transcriptions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create segments for their transcriptions" 
ON public.transcription_segments 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.transcriptions 
    WHERE transcriptions.id = transcription_segments.transcription_id 
    AND transcriptions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update segments of their transcriptions" 
ON public.transcription_segments 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.transcriptions 
    WHERE transcriptions.id = transcription_segments.transcription_id 
    AND transcriptions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete segments of their transcriptions" 
ON public.transcription_segments 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.transcriptions 
    WHERE transcriptions.id = transcription_segments.transcription_id 
    AND transcriptions.user_id = auth.uid()
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transcriptions_updated_at
  BEFORE UPDATE ON public.transcriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, title)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Legal Professional'),
    COALESCE(NEW.raw_user_meta_data ->> 'title', 'Attorney')
  );
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_transcriptions_user_id ON public.transcriptions(user_id);
CREATE INDEX idx_transcriptions_created_at ON public.transcriptions(created_at DESC);
CREATE INDEX idx_transcription_segments_transcription_id ON public.transcription_segments(transcription_id);
CREATE INDEX idx_transcription_segments_order ON public.transcription_segments(transcription_id, segment_order);