-- ============================================================
-- Row Level Security (RLS) Policies
-- Enable RLS on ALL tables and create user-scoped policies
-- ============================================================

-- Enable RLS on every table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streak_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users table: special case — uses `id` not `user_id`
CREATE POLICY "Users can access own profile" ON public.users
  FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Visions
CREATE POLICY "Users can only access own visions" ON public.visions
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Goals
CREATE POLICY "Users can only access own goals" ON public.goals
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Daily Tasks
CREATE POLICY "Users can only access own tasks" ON public.daily_tasks
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Habits
CREATE POLICY "Users can only access own habits" ON public.habits
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Habit Logs
CREATE POLICY "Users can only access own habit logs" ON public.habit_logs
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Journal Entries
CREATE POLICY "Users can only access own journal entries" ON public.journal_entries
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- AI Conversations
CREATE POLICY "Users can only access own conversations" ON public.ai_conversations
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Point Events
CREATE POLICY "Users can only access own point events" ON public.point_events
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Streak Snapshots
CREATE POLICY "Users can only access own streak snapshots" ON public.streak_snapshots
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Subscriptions
CREATE POLICY "Users can only access own subscription" ON public.subscriptions
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
