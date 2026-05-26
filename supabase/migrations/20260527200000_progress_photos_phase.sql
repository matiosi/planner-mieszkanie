ALTER TABLE public.progress_photos
  ADD COLUMN IF NOT EXISTS phase text NOT NULL DEFAULT 'DURING';

COMMENT ON COLUMN public.progress_photos.phase IS 'BEFORE | DURING | AFTER';
