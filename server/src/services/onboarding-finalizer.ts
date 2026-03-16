/**
 * Onboarding Finalizer
 *
 * Takes the structured JSON output from the onboarding AI conversation
 * and creates the vision, goals, and habits in the database.
 * Also generates the user's first set of daily tasks.
 */

import { eq, and } from 'drizzle-orm';
import { visions, goals, habits, dailyTasks } from '@advancely/db';
import type { Database } from '@advancely/db';

interface OnboardingGoal {
  title: string;
  category: 'skills' | 'wealth' | 'health' | 'impact';
  description: string;
  year1_milestone: string;
}

interface OnboardingSuggestedHabit {
  name: string;
  category: 'skills' | 'wealth' | 'health' | 'impact';
  linked_goal_title: string;
  reason: string;
}

export interface OnboardingPlan {
  vision_statement: string;
  goals: OnboardingGoal[];
  suggested_habits: OnboardingSuggestedHabit[];
}

/**
 * Attempts to extract a JSON plan from the AI's response.
 * The AI wraps JSON in ```json ... ``` code fences.
 * Returns null if no valid JSON is found.
 */
export function extractOnboardingPlan(
  aiResponse: string,
): OnboardingPlan | null {
  // Try to find JSON in code fences first
  const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)```/);
  if (jsonMatch?.[1]) {
    try {
      const parsed = JSON.parse(jsonMatch[1]) as OnboardingPlan;
      if (parsed.vision_statement && Array.isArray(parsed.goals)) {
        return parsed;
      }
    } catch {
      // Fall through to other attempts
    }
  }

  // Try to find raw JSON object in the response
  const rawJsonMatch = aiResponse.match(
    /\{[\s\S]*"vision_statement"[\s\S]*"goals"[\s\S]*\}/,
  );
  if (rawJsonMatch?.[0]) {
    try {
      const parsed = JSON.parse(rawJsonMatch[0]) as OnboardingPlan;
      if (parsed.vision_statement && Array.isArray(parsed.goals)) {
        return parsed;
      }
    } catch {
      // No valid JSON found
    }
  }

  return null;
}

/**
 * Creates the vision, goals, habits, and first-day tasks
 * from the AI-generated onboarding plan.
 */
export async function finalizeOnboardingPlan(
  db: Database,
  userId: string,
  plan: OnboardingPlan,
): Promise<{
  visionId: string;
  goalIds: string[];
  habitIds: string[];
  taskIds: string[];
}> {
  // 1. Deactivate any existing visions (shouldn't exist for new user, but safety)
  await db
    .update(visions)
    .set({ isActive: false })
    .where(and(eq(visions.userId, userId), eq(visions.isActive, true)));

  // 2. Create the vision
  const [newVision] = await db
    .insert(visions)
    .values({
      userId,
      statement: plan.vision_statement,
      version: 1,
      isActive: true,
    })
    .returning();

  if (!newVision) {
    throw new Error('Failed to create vision');
  }

  // 3. Create goals (max 3 per spec)
  const goalsToCreate = plan.goals.slice(0, 3);
  const createdGoals = await db
    .insert(goals)
    .values(
      goalsToCreate.map((g) => ({
        userId,
        visionId: newVision.id,
        title: g.title,
        category: g.category,
        description: g.description,
        progress: 0,
        status: 'active',
        milestones: [
          { year: 1, target: g.year1_milestone, completed: false },
        ],
      })),
    )
    .returning();

  // 4. Create habits (max 5 per spec), linking to goals by title match
  const goalTitleToId = new Map(createdGoals.map((g) => [g.title, g.id]));
  const habitsToCreate = (plan.suggested_habits ?? []).slice(0, 5);
  const createdHabits =
    habitsToCreate.length > 0
      ? await db
          .insert(habits)
          .values(
            habitsToCreate.map((h, i) => ({
              userId,
              goalId: goalTitleToId.get(h.linked_goal_title) ?? null,
              name: h.name,
              category: h.category,
              isActive: true,
              sortOrder: i,
            })),
          )
          .returning()
      : [];

  // 5. Generate first-day tasks from goals (one actionable task per goal)
  const today = new Date().toISOString().split('T')[0] as string;
  const firstTasks = createdGoals.map((g, i) => ({
    userId,
    goalId: g.id,
    title: `Start working on: ${g.title}`,
    taskDate: today,
    source: 'ai' as const,
    sortOrder: i,
    isCompleted: false,
  }));

  const createdTasks =
    firstTasks.length > 0
      ? await db.insert(dailyTasks).values(firstTasks).returning()
      : [];

  return {
    visionId: newVision.id,
    goalIds: createdGoals.map((g) => g.id),
    habitIds: createdHabits.map((h) => h.id),
    taskIds: createdTasks.map((t) => t.id),
  };
}
