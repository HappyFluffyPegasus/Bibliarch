-- Migration: Add canvas_width and canvas_height columns to canvas_data table
-- Run this in your Supabase SQL Editor

-- Add canvas_width column (default 3000px)
ALTER TABLE public.canvas_data
ADD COLUMN IF NOT EXISTS canvas_width INTEGER DEFAULT 3000;

-- Add canvas_height column (default 2000px)
ALTER TABLE public.canvas_data
ADD COLUMN IF NOT EXISTS canvas_height INTEGER DEFAULT 2000;

-- Update existing rows to have default values
UPDATE public.canvas_data
SET canvas_width = 3000, canvas_height = 2000
WHERE canvas_width IS NULL OR canvas_height IS NULL;
