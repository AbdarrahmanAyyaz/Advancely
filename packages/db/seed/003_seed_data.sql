-- ============================================================
-- Development Seed Data
-- 1 test user with vision, goals, habits, tasks, journal, points
-- ============================================================

-- Use a fixed UUID for the test user so we can reference it
-- NOTE: This user is inserted directly (not via auth.users trigger)
-- for local development purposes only.
DO $$
DECLARE
  test_user_id uuid := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  test_vision_id uuid := 'b1c2d3e4-f5a6-7890-bcde-fa1234567890';
  goal_skills_id uuid := 'c1d2e3f4-a5b6-7890-cdef-ab1234567890';
  goal_wealth_id uuid := 'd1e2f3a4-b5c6-7890-defa-bc1234567890';
  goal_health_id uuid := 'e1f2a3b4-c5d6-7890-efab-cd1234567890';
  habit_code_id uuid := 'f1a2b3c4-d5e6-7890-fabc-de1234567890';
  habit_exercise_id uuid := 'a2b3c4d5-e6f7-8901-abcd-ef2345678901';
  habit_read_id uuid := 'b2c3d4e5-f6a7-8901-bcde-fa2345678901';
  today date := CURRENT_DATE;
  yesterday date := CURRENT_DATE - 1;
BEGIN
  -- Clean up existing seed data if re-running
  DELETE FROM public.users WHERE id = test_user_id;

  -- 1. Create test user
  INSERT INTO public.users (id, email, display_name, tier, total_points, current_level, timezone, onboarding_completed_at)
  VALUES (
    test_user_id,
    'test@advancely.ai',
    'Alex',
    'free',
    340,
    2,
    'America/New_York',
    now() - interval '14 days'
  );

  -- 2. Create vision
  INSERT INTO public.visions (id, user_id, statement, version, is_active)
  VALUES (
    test_vision_id,
    test_user_id,
    'In 5 years, I run a profitable SaaS business generating $20K+/mo, maintain peak physical fitness with sub-10% body fat, and have the technical skills to build any product idea I envision.',
    2,
    true
  );

  -- 3. Create goals (3 goals across categories)
  INSERT INTO public.goals (id, user_id, vision_id, title, category, description, progress, status, milestones) VALUES
  (
    goal_skills_id,
    test_user_id,
    test_vision_id,
    'Master full-stack development',
    'skills',
    'Become proficient enough to build and ship production apps independently.',
    45,
    'active',
    '[{"year": 1, "target": "Ship 2 side projects and contribute to 1 open source project", "completed": false}]'::jsonb
  ),
  (
    goal_wealth_id,
    test_user_id,
    test_vision_id,
    'Launch SaaS to $20K MRR',
    'wealth',
    'Build and grow a B2B SaaS product to $20K monthly recurring revenue.',
    15,
    'active',
    '[{"year": 1, "target": "Launch MVP and get 10 paying customers", "completed": false}]'::jsonb
  ),
  (
    goal_health_id,
    test_user_id,
    test_vision_id,
    'Reach peak physical fitness',
    'health',
    'Build a consistent fitness habit and reach sub-10% body fat.',
    30,
    'active',
    '[{"year": 1, "target": "Work out 5x/week consistently for 6 months, lose 15 lbs", "completed": false}]'::jsonb
  );

  -- 4. Create habits (3 habits linked to goals)
  INSERT INTO public.habits (id, user_id, goal_id, name, category, is_active, sort_order) VALUES
  (habit_code_id, test_user_id, goal_skills_id, 'Code for 30 minutes', 'skills', true, 0),
  (habit_exercise_id, test_user_id, goal_health_id, 'Exercise 30 minutes', 'health', true, 1),
  (habit_read_id, test_user_id, goal_skills_id, 'Read 15 minutes', 'skills', true, 2);

  -- 5. Create habit logs for the past week (simulating a streak)
  INSERT INTO public.habit_logs (user_id, habit_id, log_date, is_completed) VALUES
  -- Code habit: 6 day streak
  (test_user_id, habit_code_id, today - 6, true),
  (test_user_id, habit_code_id, today - 5, true),
  (test_user_id, habit_code_id, today - 4, true),
  (test_user_id, habit_code_id, today - 3, true),
  (test_user_id, habit_code_id, today - 2, true),
  (test_user_id, habit_code_id, yesterday, true),
  -- Exercise habit: 4 day streak
  (test_user_id, habit_exercise_id, today - 3, true),
  (test_user_id, habit_exercise_id, today - 2, true),
  (test_user_id, habit_exercise_id, yesterday, true),
  (test_user_id, habit_exercise_id, today - 4, true),
  -- Read habit: sporadic
  (test_user_id, habit_read_id, today - 5, true),
  (test_user_id, habit_read_id, today - 3, true),
  (test_user_id, habit_read_id, yesterday, true);

  -- 6. Create daily tasks for today
  INSERT INTO public.daily_tasks (user_id, goal_id, title, is_completed, task_date, source, sort_order) VALUES
  (test_user_id, goal_skills_id, 'Review React Server Components documentation', false, today, 'ai', 0),
  (test_user_id, goal_wealth_id, 'Research 3 SaaS ideas in the AI tools niche', false, today, 'ai', 1),
  (test_user_id, goal_health_id, 'Complete upper body workout', false, today, 'ai', 2),
  (test_user_id, goal_skills_id, 'Finish TypeScript generics tutorial', false, today, 'ai', 3),
  (test_user_id, NULL, 'Buy groceries for the week', false, today, 'manual', 4);

  -- 7. Create yesterday's tasks (some completed)
  INSERT INTO public.daily_tasks (user_id, goal_id, title, is_completed, task_date, source, sort_order, completed_at) VALUES
  (test_user_id, goal_skills_id, 'Watch Next.js caching lecture', true, yesterday, 'ai', 0, yesterday + time '14:30'),
  (test_user_id, goal_wealth_id, 'Draft SaaS feature comparison table', true, yesterday, 'ai', 1, yesterday + time '16:00'),
  (test_user_id, goal_health_id, 'Run 3 miles', true, yesterday, 'ai', 2, yesterday + time '07:30'),
  (test_user_id, goal_skills_id, 'Practice SQL window functions', false, yesterday, 'ai', 3, NULL);

  -- 8. Create a journal entry for yesterday
  INSERT INTO public.journal_entries (user_id, entry_date, wins, challenges, gratitude, tomorrow_focus, mood) VALUES
  (
    test_user_id,
    yesterday,
    '["Completed 3 out of 4 tasks", "Hit a 5-day coding streak", "Great workout this morning"]'::jsonb,
    'Got distracted in the afternoon and didn''t finish the SQL practice. Need to block social media during deep work hours.',
    '["My health is improving", "Having clear daily tasks keeps me focused", "Great weather for a run"]'::jsonb,
    'Focus on the SaaS research first thing — it''s the most important task for my Wealth goal.',
    4
  );

  -- 9. Create streak snapshots
  INSERT INTO public.streak_snapshots (user_id, habit_id, current_streak, best_streak, snapshot_date) VALUES
  (test_user_id, habit_code_id, 6, 12, yesterday),
  (test_user_id, habit_exercise_id, 4, 8, yesterday),
  (test_user_id, habit_read_id, 1, 5, yesterday);

  -- 10. Create some point events
  INSERT INTO public.point_events (user_id, event_type, points, source_type, created_at) VALUES
  (test_user_id, 'task_complete', 10, 'daily_task', now() - interval '1 day'),
  (test_user_id, 'task_complete', 10, 'daily_task', now() - interval '1 day'),
  (test_user_id, 'task_complete', 10, 'daily_task', now() - interval '1 day'),
  (test_user_id, 'habit_complete', 15, 'habit_log', now() - interval '1 day'),
  (test_user_id, 'habit_complete', 15, 'habit_log', now() - interval '1 day'),
  (test_user_id, 'habit_complete', 15, 'habit_log', now() - interval '1 day'),
  (test_user_id, 'journal_entry', 25, 'journal_entry', now() - interval '1 day'),
  (test_user_id, 'daily_bonus', 50, NULL, now() - interval '2 days'),
  (test_user_id, 'streak_bonus', 100, NULL, now() - interval '5 days');

  RAISE NOTICE 'Seed data inserted successfully for user: %', test_user_id;
END $$;
