CREATE OR REPLACE FUNCTION limit_persona_results_per_user()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.persona_results
  WHERE user_id = NEW.user_id
    AND id NOT IN (
      SELECT id FROM public.persona_results
      WHERE user_id = NEW.user_id
      ORDER BY created_at DESC
      LIMIT 100
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_limit_persona_results
  AFTER INSERT ON public.persona_results
  FOR EACH ROW
  EXECUTE FUNCTION limit_persona_results_per_user();
