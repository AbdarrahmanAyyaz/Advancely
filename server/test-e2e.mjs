/**
 * E2E test script for the full onboarding flow.
 * Run from server/ directory: node test-e2e.mjs
 */
import 'dotenv/config';

const API = 'http://localhost:3000';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const TEST_EMAIL = `test-e2e-${Date.now()}@advancely.app`;
const TEST_PASSWORD = 'TestPass123!';
let TOKEN = '';
let USER_ID = '';
let conversationId = null;
let plan = null;

function log(step, msg) {
  console.log(`\n[${'STEP ' + step}] ${msg}`);
}

function pass(label) {
  console.log(`  ✅ ${label}`);
}

function fail(label, detail) {
  console.log(`  ❌ ${label}: ${detail}`);
}

async function apiCall(path, options = {}) {
  const { method = 'GET', body } = options;
  const headers = {
    Authorization: `Bearer ${TOKEN}`,
  };
  // Only set Content-Type and body when there's actual data to send
  if (body) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  return { status: res.status, data };
}

// ─── Step 1: Sign in & get JWT ───────────────────────────────
async function step1_auth() {
  log(1, 'Authentication — Sign in and get JWT');

  // First, create the user via our server signup
  const signupRes = await fetch(`${API}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });
  const signupData = await signupRes.json();
  if (signupData?.data?.user?.id) {
    pass(`Signed up: ${TEST_EMAIL} (${signupData.data.user.id})`);
  } else {
    fail('Signup', JSON.stringify(signupData));
    process.exit(1);
  }

  // Now sign in via Supabase to get JWT
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    }),
  });
  const data = await res.json();

  if (data.access_token) {
    TOKEN = data.access_token;
    USER_ID = data.user.id;
    pass(`Authenticated as ${USER_ID}`);
  } else {
    fail('Auth', JSON.stringify(data));
    process.exit(1);
  }

  // Test /auth/me
  const meRes = await apiCall('/auth/me');
  if (meRes.data?.data?.id === USER_ID) {
    pass(`GET /auth/me returns user profile`);
  } else {
    fail('GET /auth/me', JSON.stringify(meRes.data));
  }
}

// ─── Step 2: Onboarding AI conversation ──────────────────────
async function step2_onboarding_chat() {
  log(2, 'Onboarding AI conversation');

  // Message 1: Greeting
  const msg1 = await apiCall('/ai/onboarding', {
    method: 'POST',
    body: { message: "Hi, I'm excited to get started!" },
  });
  if (msg1.status === 200 && msg1.data?.data?.message) {
    conversationId = msg1.data.data.conversationId;
    pass(`AI responded (${msg1.data.data.message.length} chars), conversationId: ${conversationId}`);
    console.log(`  AI: "${msg1.data.data.message.substring(0, 100)}..."`);
  } else {
    fail('Message 1', JSON.stringify(msg1.data));
    return;
  }

  // Message 2: Share aspirations
  const msg2 = await apiCall('/ai/onboarding', {
    method: 'POST',
    body: {
      message:
        "I want to become a better software engineer, build wealth through investing, and get healthier by running regularly. My big dream is to start my own tech company within 5 years.",
      conversationId,
    },
  });
  if (msg2.status === 200 && msg2.data?.data?.message) {
    conversationId = msg2.data.data.conversationId;
    pass(`AI responded to goals (${msg2.data.data.message.length} chars)`);
    console.log(`  AI: "${msg2.data.data.message.substring(0, 100)}..."`);
    if (msg2.data.data.plan) {
      plan = msg2.data.data.plan;
      pass('Plan generated in message 2!');
    }
  } else {
    fail('Message 2', JSON.stringify(msg2.data));
  }

  // Message 3: More detail if no plan yet
  if (!plan) {
    const msg3 = await apiCall('/ai/onboarding', {
      method: 'POST',
      body: {
        message:
          "For skills, I want to master system design and get promoted to senior engineer. For wealth, I aim to save $50k in the next year through smart investing. For health, I want to run a half marathon. These are my top priorities.",
        conversationId,
      },
    });
    if (msg3.status === 200 && msg3.data?.data?.message) {
      conversationId = msg3.data.data.conversationId;
      pass(`AI responded to details (${msg3.data.data.message.length} chars)`);
      console.log(`  AI: "${msg3.data.data.message.substring(0, 100)}..."`);
      if (msg3.data.data.plan) {
        plan = msg3.data.data.plan;
        pass('Plan generated in message 3!');
      }
    } else {
      fail('Message 3', JSON.stringify(msg3.data));
    }
  }

  // Message 4: Confirm to trigger plan if still no plan
  if (!plan) {
    const msg4 = await apiCall('/ai/onboarding', {
      method: 'POST',
      body: {
        message:
          "Yes, those are my main goals. I'm ready for you to generate my vision and plan. Please create my personalized plan now.",
        conversationId,
      },
    });
    if (msg4.status === 200 && msg4.data?.data?.message) {
      conversationId = msg4.data.data.conversationId;
      pass(`AI responded (${msg4.data.data.message.length} chars)`);
      if (msg4.data.data.plan) {
        plan = msg4.data.data.plan;
        pass('Plan generated in message 4!');
      }
    } else {
      fail('Message 4', JSON.stringify(msg4.data));
    }
  }

  // Message 5: Last attempt
  if (!plan) {
    const msg5 = await apiCall('/ai/onboarding', {
      method: 'POST',
      body: {
        message: "Please generate my vision, goals, and habits now. I'm ready to see my plan.",
        conversationId,
      },
    });
    if (msg5.status === 200 && msg5.data?.data?.message) {
      if (msg5.data.data.plan) {
        plan = msg5.data.data.plan;
        pass('Plan generated in message 5!');
      }
    }
  }

  if (plan) {
    pass('PLAN RECEIVED');
    console.log(`  Vision: "${plan.vision_statement?.substring(0, 80)}..."`);
    console.log(`  Goals (${plan.goals?.length}): ${plan.goals?.map((g) => g.title).join(', ')}`);
    console.log(
      `  Habits (${plan.suggested_habits?.length}): ${plan.suggested_habits?.map((h) => h.name).join(', ')}`
    );
  } else {
    fail('No plan received after 5 messages', 'AI did not generate structured output');
  }
}

// ─── Step 3: Finalize the plan ───────────────────────────────
async function step3_finalize() {
  log(3, 'Finalize onboarding plan');

  if (!plan) {
    fail('Skipping', 'No plan to finalize');
    return;
  }

  const res = await apiCall('/ai/onboarding/finalize', {
    method: 'POST',
    body: {
      plan,
      selectedHabitIndices: [0, 1, 2], // Select first 3 habits
    },
  });

  if (res.status === 200 && res.data?.data) {
    const d = res.data.data;
    pass(`Vision created: ${d.visionId}`);
    pass(`Goals created: ${d.goalIds?.length} (${d.goalIds?.join(', ')})`);
    pass(`Habits created: ${d.habitIds?.length} (${d.habitIds?.join(', ')})`);
    pass(`Tasks created: ${d.taskIds?.length}`);
    if (d.tasks && d.tasks.length > 0) {
      pass('First-day tasks returned:');
      d.tasks.forEach((t) => console.log(`    - [${t.category}] ${t.title}`));
    } else {
      fail('No task details returned', 'tasks array empty or missing');
    }
  } else {
    fail('Finalize', JSON.stringify(res.data));
  }
}

// ─── Step 4: Complete onboarding ─────────────────────────────
async function step4_complete() {
  log(4, 'Complete onboarding (marks user, triggers morning brief)');

  const res = await apiCall('/auth/complete-onboarding', { method: 'POST' });

  if (res.status === 200 && res.data?.data) {
    if (res.data.data.onboardingCompletedAt || res.data.data.onboarding_completed_at) {
      pass('Onboarding marked as complete');
    } else {
      pass('Response received (checking field name...)');
      console.log('  Fields:', Object.keys(res.data.data).join(', '));
    }
  } else {
    fail('Complete onboarding', JSON.stringify(res.data));
  }
}

// ─── Step 5: Dashboard endpoints ─────────────────────────────
async function step5_dashboard() {
  log(5, 'Dashboard endpoints');

  const today = new Date().toISOString().split('T')[0];

  // GET /tasks?date=today
  const tasksRes = await apiCall(`/tasks?date=${today}`);
  if (tasksRes.status === 200 && tasksRes.data?.data) {
    pass(`Tasks for today: ${tasksRes.data.data.length} tasks`);
    tasksRes.data.data.forEach((t) =>
      console.log(`    - [${t.isCompleted ? '✓' : ' '}] ${t.title}`)
    );
  } else {
    fail('GET /tasks', JSON.stringify(tasksRes.data));
  }

  // GET /ai/morning-brief
  const briefRes = await apiCall('/ai/morning-brief');
  if (briefRes.status === 200) {
    if (briefRes.data?.data?.brief) {
      pass(`Morning brief: "${briefRes.data.data.brief.substring(0, 80)}..."`);
    } else {
      pass('Morning brief endpoint responded (brief may still be generating in background)');
      console.log('  Response:', JSON.stringify(briefRes.data).substring(0, 200));
    }
  } else {
    fail('GET /ai/morning-brief', `Status ${briefRes.status}: ${JSON.stringify(briefRes.data)}`);
  }

  // GET /auth/me — verify onboarding is complete
  const meRes = await apiCall('/auth/me');
  if (meRes.data?.data?.onboardingCompletedAt) {
    pass('User profile shows onboarding completed');
  } else {
    console.log('  User profile fields:', JSON.stringify(meRes.data?.data).substring(0, 300));
  }

  // GET /habits — check created habits
  const habitsRes = await apiCall('/habits');
  if (habitsRes.status === 200 && habitsRes.data?.data) {
    pass(`Habits: ${habitsRes.data.data.length} habits`);
    habitsRes.data.data.forEach?.((h) => console.log(`    - ${h.name} (${h.category})`));
  } else {
    console.log('  Habits response:', JSON.stringify(habitsRes.data).substring(0, 200));
  }

  // GET /visions/active — check created vision
  const visionsRes = await apiCall('/visions/active');
  if (visionsRes.status === 200 && visionsRes.data?.data) {
    const v = Array.isArray(visionsRes.data.data) ? visionsRes.data.data[0] : visionsRes.data.data;
    if (v?.statement) {
      pass(`Vision: "${v.statement.substring(0, 80)}..."`);
    }
  } else {
    console.log('  Visions response:', JSON.stringify(visionsRes.data).substring(0, 200));
  }

  // GET /goals — check created goals
  const goalsRes = await apiCall('/goals');
  if (goalsRes.status === 200 && goalsRes.data?.data) {
    const goalsList = Array.isArray(goalsRes.data.data)
      ? goalsRes.data.data
      : [goalsRes.data.data];
    pass(`Goals: ${goalsList.length}`);
    goalsList.forEach?.((g) => console.log(`    - ${g.title} (${g.category})`));
  } else {
    console.log('  Goals response:', JSON.stringify(goalsRes.data).substring(0, 200));
  }
}

// ─── Step 6: Task completion + points ────────────────────────
async function step6_task_points() {
  log(6, 'Task completion and points');

  const today = new Date().toISOString().split('T')[0];
  const tasksRes = await apiCall(`/tasks?date=${today}`);
  const tasks = tasksRes.data?.data;

  if (!tasks || tasks.length === 0) {
    fail('No tasks to complete', 'Skipping');
    return;
  }

  // Complete first task
  const task = tasks[0];
  const completeRes = await apiCall(`/tasks/${task.id}/complete`, { method: 'PATCH' });
  if (completeRes.status === 200) {
    pass(`Completed task: "${task.title}"`);
    if (completeRes.data?.data?.pointsAwarded !== undefined) {
      pass(`Points awarded: ${completeRes.data.data.pointsAwarded}`);
    }
  } else {
    fail('Complete task', JSON.stringify(completeRes.data));
  }

  // Check points
  const pointsRes = await apiCall('/points/summary');
  if (pointsRes.status === 200 && pointsRes.data?.data) {
    pass(`Points summary: ${JSON.stringify(pointsRes.data.data)}`);
  }
}

// ─── Main ────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  Advancely E2E Onboarding Test');
  console.log('═══════════════════════════════════════════');

  try {
    await step1_auth();
    await step2_onboarding_chat();
    await step3_finalize();
    await step4_complete();
    // Wait a moment for background morning brief generation
    console.log('\n  ⏳ Waiting 5s for background morning brief generation...');
    await new Promise((r) => setTimeout(r, 5000));
    await step5_dashboard();
    await step6_task_points();

    console.log('\n═══════════════════════════════════════════');
    console.log('  E2E Test Complete!');
    console.log('═══════════════════════════════════════════\n');
  } catch (err) {
    console.error('\n💥 FATAL ERROR:', err);
  }
}

main();
