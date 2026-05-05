CREATE TABLE public.persona_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  genre TEXT NOT NULL,
  input_data JSONB NOT NULL,
  result_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_persona_results_user_id ON public.persona_results(user_id);
CREATE INDEX idx_persona_results_created_at ON public.persona_results(created_at DESC);

ALTER TABLE public.persona_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own results"
  ON public.persona_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own results"
  ON public.persona_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own results"
  ON public.persona_results FOR DELETE
  USING (auth.uid() = user_id);
