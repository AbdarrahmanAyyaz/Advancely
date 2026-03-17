/**
 * Onboarding Finalizer
 *
 * Takes the structured JSON output from the onboarding AI conversation
 * and creates the vision, goals, and habits in the database.
 * Also generates the user's first set of daily tasks via AI.
 */

import { eq, and } from 'drizzle-orm';
import { visions, goals, habits, dailyTasks } from '@advancely/db';
import type { Database } from '@advancely/db';
import { routeAiTask } from './ai/router';

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
  tasks: Array<{ id: string; title: string; category: string }>;
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

  // 5. Generate first-day tasks via AI (with fallback)
  const today = new Date().toISOString().split('T')[0] as string;
  let aiTasks: Array<{ title: string; category: string }> = [];

  try {
    const goalsDescription = createdGoals
      .map((g) => `- ${g.title} (${g.category}): ${plan.goals.find((pg) => pg.title === g.title)?.description ?? ''}`)
      .join('\n');

    const taskGenResult = await routeAiTask({
      taskType: 'onboarding',
      systemPrompt: `You generate actionable first-day tasks for a personal development app user. Return ONLY a JSON array, no other text.

Each task must be:
- Specific and completable today (not vague like "start working on X")
- Under 15 minutes to complete
- Connected to one of the user's goals

Return exactly this JSON format:
[
  { "title": "Task description here", "category": "skills|wealth|health|impact" },
  ...
]

Generate 3-4 tasks total, at least one per goal.`,
      messages: [
        {
          role: 'user',
          content: `My goals:\n${goalsDescription}\n\nGenerate my first-day tasks.`,
        },
      ],
      userId,
    });

    // Parse AI tasks
    const jsonMatch = taskGenResult.content.match(/\[[\s\S]*\]/);
    if (jsonMatch?.[0]) {
      const parsed = JSON.parse(jsonMatch[0]) as Array<{
        title: string;
        category: string;
      }>;
      if (Array.isArray(parsed) && parsed.length > 0) {
        aiTasks = parsed.slice(0, 5);
      }
    }
  } catch {
    // AI task generation failed — use fallback below
  }

  // Fallback if AI didn't generate tasks
  if (aiTasks.length === 0) {
    aiTasks = createdGoals.map((g) => ({
      title: `Take 10 minutes to outline your first step for: ${g.title}`,
      category: g.category,
    }));
  }

  // Map categories to goal IDs for linking
  const categoryToGoalId = new Map(
    createdGoals.map((g) => [g.category, g.id]),
  );

  const firstTasks = aiTasks.map((t, i) => ({
    userId,
    goalId: categoryToGoalId.get(t.category) ?? createdGoals[0]?.id ?? null,
    title: t.title,
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
    // Include task details for the first-mission screen
    tasks: createdTasks.map((t) => ({
      id: t.id,
      title: t.title,
      category: createdGoals.find((g) => g.id === t.goalId)?.category ?? 'skills',
    })),
  };
}
