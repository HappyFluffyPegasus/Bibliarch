-- StoryCanvas Database Schema for Supabase
-- Run this in the Supabase SQL editor to set up your database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table that extends auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  username TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create stories table
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  settings JSONB DEFAULT '{}'::jsonb
);

-- Create canvas_data table for storing canvas information
CREATE TABLE IF NOT EXISTS public.canvas_data (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL,
  canvas_type TEXT NOT NULL DEFAULT 'main',
  parent_id UUID REFERENCES public.canvas_data(id) ON DELETE CASCADE,
  nodes JSONB DEFAULT '[]'::jsonb,
  connections JSONB DEFAULT '[]'::jsonb,
  canvas_width INTEGER DEFAULT 3000,
  canvas_height INTEGER DEFAULT 2000,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvas_data ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Create policies for stories
CREATE POLICY "Users can view own stories" 
  ON public.stories FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own stories" 
  ON public.stories FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own stories" 
  ON public.stories FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own stories" 
  ON public.stories FOR DELETE 
  USING (user_id = auth.uid());

-- Create policies for canvas_data
CREATE POLICY "Users can manage own canvas data" 
  ON public.canvas_data FOR ALL 
  USING (story_id IN (
    SELECT id FROM public.stories WHERE user_id = auth.uid()
  ));

-- Create a trigger to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger for stories
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER update_stories_updated_at BEFORE UPDATE ON public.stories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_canvas_data_updated_at BEFORE UPDATE ON public.canvas_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();