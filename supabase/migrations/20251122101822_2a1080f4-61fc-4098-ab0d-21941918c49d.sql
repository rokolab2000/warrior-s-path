-- Create role enum
CREATE TYPE public.app_role AS ENUM ('therapist', 'patient');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (true);

-- Create therapist_patients table
CREATE TABLE public.therapist_patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (therapist_id, patient_id)
);

-- Enable RLS
ALTER TABLE public.therapist_patients ENABLE ROW LEVEL SECURITY;

-- RLS policies for therapist_patients
CREATE POLICY "Therapists can view their patients"
ON public.therapist_patients
FOR SELECT
USING (
  auth.uid() = therapist_id 
  AND public.has_role(auth.uid(), 'therapist')
);

CREATE POLICY "Therapists can add patients"
ON public.therapist_patients
FOR INSERT
WITH CHECK (
  auth.uid() = therapist_id 
  AND public.has_role(auth.uid(), 'therapist')
);

-- Update profiles policies to allow therapists to view their patients
CREATE POLICY "Therapists can view their patients profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.therapist_patients
    WHERE therapist_patients.patient_id = profiles.id
      AND therapist_patients.therapist_id = auth.uid()
      AND public.has_role(auth.uid(), 'therapist')
  )
);

-- Update user_missions policies to allow therapists to view patient progress
CREATE POLICY "Therapists can view patient missions"
ON public.user_missions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.therapist_patients
    WHERE therapist_patients.patient_id = user_missions.user_id
      AND therapist_patients.therapist_id = auth.uid()
      AND public.has_role(auth.uid(), 'therapist')
  )
);

-- Update results policies to allow therapists to view patient results
CREATE POLICY "Therapists can view patient results"
ON public.results
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.therapist_patients
    WHERE therapist_patients.patient_id = results.user_id
      AND therapist_patients.therapist_id = auth.uid()
      AND public.has_role(auth.uid(), 'therapist')
  )
);

-- Update handle_new_user function to assign patient role by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, name, avatar, availability)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Guerrero'),
    COALESCE(NEW.raw_user_meta_data->>'avatar', '🦅'),
    COALESCE(NEW.raw_user_meta_data->>'availability', 'daily')
  );
  
  -- Assign patient role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'patient');
  
  RETURN NEW;
END;
$$;