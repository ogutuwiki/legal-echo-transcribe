-- Update transcriptions table to support different session types
ALTER TABLE public.transcriptions 
RENAME COLUMN hearing_type TO session_type;

-- Add check constraint for valid session types
ALTER TABLE public.transcriptions 
ADD CONSTRAINT valid_session_types 
CHECK (session_type IN ('legal_hearing', 'arbitration', 'meeting', 'class', 'other'));

-- Update existing records to have a default session type
UPDATE public.transcriptions 
SET session_type = 'legal_hearing' 
WHERE session_type IS NULL;