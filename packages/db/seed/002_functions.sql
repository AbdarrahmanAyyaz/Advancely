-- ============================================================
-- Database Functions & Triggers
-- ============================================================

-- 1. Auto-create user profile on Supabase Auth signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to make this idempotent
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. Award points atomically
-- ============================================================
-- Inserts into point_events and updates users.total_points + current_level
-- in a single transaction. SECURITY DEFINER so it bypasses RLS.
CREATE OR REPLACE FUNCTION public.award_points(
  p_user_id uuid,
  p_event_type varchar,
  p_points int,
  p_source_id uuid DEFAULT NULL,
  p_source_type varchar DEFAULT NULL
) RETURNS void AS $$
BEGIN
  -- Insert point event record
  INSERT INTO public.point_events (id, user_id, event_type, points, source_id, source_type)
  VALUES (gen_random_uuid(), p_user_id, p_event_type, p_points, p_source_id, p_source_type);

  -- Update cached total and recalculate level
  UPDATE public.users SET
    total_points = total_points + p_points,
    current_level = CASE
      WHEN total_points + p_points >= 25000 THEN 10
      WHEN total_points + p_points >= 15000 THEN 9
      WHEN total_points + p_points >= 10000 THEN 8
      WHEN total_points + p_points >= 7000  THEN 7
      WHEN total_points + p_points >= 5000  THEN 6
      WHEN total_points + p_points >= 2500  THEN 5
      WHEN total_points + p_points >= 1500  THEN 4
      WHEN total_points + p_points >= 750   THEN 3
      WHEN total_points + p_points >= 250   THEN 2
      ELSE 1
    END
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Auto-update updated_at timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables that have updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_visions_updated_at ON public.visions;
CREATE TRIGGER update_visions_updated_at
  BEFORE UPDATE ON public.visions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_journal_entries_updated_at ON public.journal_entries;
CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
