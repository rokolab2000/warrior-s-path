-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar TEXT NOT NULL, -- Warrior animal type
  availability TEXT NOT NULL, -- daily schedule availability
  gems INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create missions table
CREATE TABLE public.missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL, -- 'start', 'exercise', 'reward', 'boss'
  exercise_type TEXT, -- movement type for camera detection
  position INTEGER NOT NULL, -- order in the map
  gem_reward INTEGER DEFAULT 25,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (missions are public readable, admin writable)
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view missions"
  ON public.missions FOR SELECT
  USING (true);

-- Create user_missions table to track progress
CREATE TABLE public.user_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  unlocked BOOLEAN DEFAULT false,
  completed BOOLEAN DEFAULT false,
  scheduled_for DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, mission_id)
);

-- Enable RLS
ALTER TABLE public.user_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mission progress"
  ON public.user_missions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own mission progress"
  ON public.user_missions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mission progress"
  ON public.user_missions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create results table for analytics
CREATE TABLE public.results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT true,
  duration_seconds INTEGER,
  gems_earned INTEGER DEFAULT 25,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own results"
  ON public.results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own results"
  ON public.results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create function for updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add trigger to profiles
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar, availability)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Guerrero'),
    COALESCE(NEW.raw_user_meta_data->>'avatar', '🦅'),
    COALESCE(NEW.raw_user_meta_data->>'availability', 'daily')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert sample missions
INSERT INTO public.missions (title, description, type, exercise_type, position, gem_reward) VALUES
('Primer Paso del Guerrero', 'Tu primera misión: levanta los brazos al cielo como un cóndor desplegando sus alas.', 'start', 'arm_raise', 1, 25),
('Ala del Cóndor', 'Extiende tus brazos y mantén el equilibrio. ¡Vuela alto!', 'exercise', 'arm_extension', 2, 30),
('Cofre Sorpresa', 'Un pequeño desafío de equilibrio te espera. ¡Mantén la postura!', 'reward', 'balance', 3, 40),
('Paso de la Llama', 'Camina con fuerza y determinación. Cada paso cuenta.', 'exercise', 'leg_movement', 4, 30),
('Bandera Final', 'La misión final de la semana. ¡Demuestra todo lo que has aprendido!', 'boss', 'full_body', 5, 50);