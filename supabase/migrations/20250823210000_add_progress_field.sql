-- Add progress field to MoldAssignment table
ALTER TABLE public."MoldAssignment" 
ADD COLUMN progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);
