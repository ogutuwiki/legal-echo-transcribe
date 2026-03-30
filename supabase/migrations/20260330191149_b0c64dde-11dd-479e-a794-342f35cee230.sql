
-- Add referral_code column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Create referrals table
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_user_id UUID NOT NULL,
  referral_code TEXT NOT NULL,
  referrer_credits_awarded INTEGER NOT NULL DEFAULT 0,
  referred_credits_awarded INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own referrals as referrer"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view their own referral as referred"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referred_user_id);

CREATE POLICY "Admins can view all referrals"
  ON public.referrals FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to generate unique referral code for a user
CREATE OR REPLACE FUNCTION public.generate_referral_code(_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  code TEXT;
  profile_name TEXT;
BEGIN
  -- Check if user already has a code
  SELECT referral_code INTO code FROM profiles WHERE user_id = _user_id;
  IF code IS NOT NULL THEN
    RETURN code;
  END IF;
  
  -- Generate code from name initials + random chars
  SELECT UPPER(LEFT(REPLACE(full_name, ' ', ''), 3)) INTO profile_name FROM profiles WHERE user_id = _user_id;
  code := COALESCE(profile_name, 'REF') || UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 5));
  
  UPDATE profiles SET referral_code = code WHERE user_id = _user_id;
  RETURN code;
END;
$$;

-- Function to process referral on signup
CREATE OR REPLACE FUNCTION public.process_referral(_referred_user_id UUID, _referral_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _referrer_id UUID;
  referrer_bonus INTEGER := 5;
  referred_bonus INTEGER := 3;
BEGIN
  -- Find the referrer by code
  SELECT user_id INTO _referrer_id FROM profiles WHERE referral_code = _referral_code;
  
  IF _referrer_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Don't allow self-referral
  IF _referrer_id = _referred_user_id THEN
    RETURN FALSE;
  END IF;
  
  -- Check if already referred
  IF EXISTS (SELECT 1 FROM referrals WHERE referred_user_id = _referred_user_id) THEN
    RETURN FALSE;
  END IF;
  
  -- Award credits to referrer
  UPDATE credits SET 
    remaining_credits = remaining_credits + referrer_bonus,
    total_credits = total_credits + referrer_bonus
  WHERE user_id = _referrer_id;
  
  -- Award credits to referred user
  UPDATE credits SET 
    remaining_credits = remaining_credits + referred_bonus,
    total_credits = total_credits + referred_bonus
  WHERE user_id = _referred_user_id;
  
  -- Record the referral
  INSERT INTO referrals (referrer_id, referred_user_id, referral_code, referrer_credits_awarded, referred_credits_awarded)
  VALUES (_referrer_id, _referred_user_id, _referral_code, referrer_bonus, referred_bonus);
  
  RETURN TRUE;
END;
$$;
