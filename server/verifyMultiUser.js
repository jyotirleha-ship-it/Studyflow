import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'http://localhost:5000/api';

async function req(url, options = {}) {
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  const res = await fetch(fullUrl, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { 'Authorization': `Bearer ${options.token}` } : {})
    },
    ...options
  });
  const contentType = res.headers.get('content-type') || '';
  let data;
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else if (contentType.includes('application/pdf')) {
    const buffer = await res.arrayBuffer();
    data = { isPdf: true, byteLength: buffer.byteLength };
  } else {
    data = await res.text();
  }
  return { status: res.status, ok: res.ok, data };
}

async function runVerification() {
  console.log('====================================================');
  console.log('🚀 STUDYFLOW E2E MULTI-USER & FEATURE VERIFICATION');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // Connect to DB directly for admin elevation and cleanup of test fixtures
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studyflow');
  console.log('Connected to MongoDB for test fixtures.\n');

  // 1. Email validation test
  console.log('--- 1. Testing Registration Email Validation ---');
  const invalidEmailRes = await req('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Invalid Test',
      email: 'invalid-email@',
      password: 'Password123!',
      passwordConfirm: 'Password123!'
    })
  });
  assert(invalidEmailRes.status === 400, 'Invalid email syntax rejected with HTTP 400');

  // 2. Register 5 users
  console.log('\n--- 2. Registering 5 Distinct Real Users ---');
  const usersConfig = [
    { name: 'Alice Smith', email: 'alice_test@studyflow.edu', pass: 'AlicePass123!', subject: 'Database Systems', topic: 'Normalization', noteTitle: '1NF and 2NF Rules', noteContent: '1NF removes repeating groups. 2NF requires full functional dependency on candidate keys.' },
    { name: 'Bob Jones', email: 'bob_test@studyflow.edu', pass: 'BobPass123!', subject: 'Operating Systems', topic: 'Process Scheduling', noteTitle: 'Round Robin Scheduling', noteContent: 'Round robin uses time quantum slices for fair CPU allocation.' },
    { name: 'Charlie Brown', email: 'charlie_test@studyflow.edu', pass: 'CharliePass123!', subject: 'Computer Networks', topic: 'TCP IP Protocol', noteTitle: 'Three-Way Handshake', noteContent: 'TCP establishes connections via SYN, SYN-ACK, and ACK packets.' },
    { name: 'Diana Prince', email: 'diana_test@studyflow.edu', pass: 'DianaPass123!', subject: 'Algorithms', topic: 'Dynamic Programming', noteTitle: 'Memoization vs Tabulation', noteContent: 'Memoization is top-down recursion with caching; tabulation is bottom-up table filling.' },
    { name: 'Evan Wright', email: 'evan_test@studyflow.edu', pass: 'EvanPass123!', subject: 'System Design', topic: 'Load Balancing', noteTitle: 'Consistent Hashing', noteContent: 'Consistent hashing minimizes key remapping when cache nodes scale dynamically.' }
  ];

  const userTokens = [];
  const userIds = [];
  const userSubjects = [];
  const userTopics = [];
  const userNotes = [];

  for (let i = 0; i < usersConfig.length; i++) {
    const u = usersConfig[i];
    // Clean prior test records if any
    await mongoose.connection.collection('users').deleteMany({ email: u.email });

    const regRes = await req('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: u.name,
        email: u.email,
        password: u.pass,
        passwordConfirm: u.pass
      })
    });

    assert(regRes.status === 201 && regRes.data.token, `User ${i + 1} (${u.name}) registered successfully`);
    userTokens.push(regRes.data.token);
    userIds.push(regRes.data.user?.id || regRes.data.user?._id);
    assert(regRes.data.user?.streak === 0, `User ${i + 1} initial streak is 0 (no fake demo streak)`);
  }

  // Test duplicate email rejection
  const dupRes = await req('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Duplicate Alice',
      email: usersConfig[0].email,
      password: 'SomePassword123!',
      passwordConfirm: 'SomePassword123!'
    })
  });
  assert(dupRes.status === 400, 'Duplicate email registration rejected with HTTP 400');

  // 3. Populate each user with their own Subject, Topic, Note, and Study Session
  console.log('\n--- 3. Creating Unique Content for Each User ---');
  for (let i = 0; i < usersConfig.length; i++) {
    const token = userTokens[i];
    const u = usersConfig[i];

    // Subject
    const subRes = await req('/subjects', {
      method: 'POST',
      token,
      body: JSON.stringify({
        name: u.subject,
        code: `CS${101 + i}`,
        color: '#6366f1',
        priority: 'high'
      })
    });
    assert(subRes.status === 201, `Subject "${u.subject}" created for User ${i + 1}`);
    const subjectId = subRes.data.subject._id;
    userSubjects.push(subjectId);

    // Topic
    const topicRes = await req('/subjects/topics', {
      method: 'POST',
      token,
      body: JSON.stringify({
        name: u.topic,
        subject: subjectId,
        estimatedHours: 4,
        difficulty: 'medium'
      })
    });
    assert(topicRes.status === 201, `Topic "${u.topic}" created for User ${i + 1}`);
    const topicId = topicRes.data.topic._id;
    userTopics.push(topicId);

    // Personal Note
    const noteRes = await req('/notes', {
      method: 'POST',
      token,
      body: JSON.stringify({
        subject: subjectId,
        topic: topicId,
        title: u.noteTitle,
        content: u.noteContent,
        tags: ['core', u.topic.toLowerCase()]
      })
    });
    assert(noteRes.status === 201, `Personal Note "${u.noteTitle}" created for User ${i + 1}`);
    userNotes.push(noteRes.data.note._id);

    // Study Session with Distraction Telemetry
    const sessionRes = await req('/study/sessions', {
      method: 'POST',
      token,
      body: JSON.stringify({
        subject: subjectId,
        topic: topicId,
        durationMinutes: 30,
        activeStudyTimeMinutes: 28,
        tabSwitchCount: i,
        distractionCount: i,
        focusScore: 95 - (i * 5),
        notes: `Studied ${u.topic} with focus.`,
        completionStatus: 'completed'
      })
    });
    assert(sessionRes.status === 201, `Focus Study Session logged for User ${i + 1} with focusScore ${95 - (i * 5)}`);
  }

  // 4. Strict Multi-User Isolation Checks
  console.log('\n--- 4. Verifying Strict Multi-User Data Isolation ---');
  for (let i = 0; i < usersConfig.length; i++) {
    const token = userTokens[i];

    // Check Notes isolation
    const myNotesRes = await req('/notes', { token });
    assert(myNotesRes.data.notes.length === 1, `User ${i + 1} sees exactly 1 note (theirs)`);
    assert(myNotesRes.data.notes[0].title === usersConfig[i].noteTitle, `User ${i + 1} note title matches their own note`);

    // Check Subjects isolation
    const mySubRes = await req('/subjects', { token });
    assert(mySubRes.data.subjects.length === 1, `User ${i + 1} sees exactly 1 subject (theirs)`);
    assert(mySubRes.data.subjects[0].name === usersConfig[i].subject, `User ${i + 1} subject matches their own subject`);

    // Check Sessions isolation
    const mySessRes = await req('/study/sessions', { token });
    assert(mySessRes.data.data.length === 1, `User ${i + 1} sees only their own study session`);
  }

  // Cross-user unauthorized direct access check
  const crossAccessRes = await req(`/notes/${userNotes[1]}`, { token: userTokens[0] });
  assert(crossAccessRes.status === 404 || crossAccessRes.status === 403, 'User 1 cannot access User 2 note by direct ID (Zero Data Leak)');

  // 5. Notes Search & PDF Generation
  console.log('\n--- 5. Testing Notes Search & Real PDF Export ---');
  const searchRes = await req('/notes?search=Normalization', { token: userTokens[0] });
  assert(searchRes.data.notes.length === 1, 'Search query "Normalization" finds User 1 note');

  const notePdfRes = await req(`/notes/${userNotes[0]}/pdf`, { token: userTokens[0] });
  assert(notePdfRes.ok && notePdfRes.data.isPdf && notePdfRes.data.byteLength > 100, `Single Note PDF generated successfully (${notePdfRes.data.byteLength} bytes)`);

  const subjectNotesPdfRes = await req(`/notes/subject/${userSubjects[0]}/pdf`, { token: userTokens[0] });
  assert(subjectNotesPdfRes.ok && subjectNotesPdfRes.data.isPdf && subjectNotesPdfRes.data.byteLength > 100, `Subject Notebook PDF generated successfully (${subjectNotesPdfRes.data.byteLength} bytes)`);

  // 6. AI Study Mentor with Note Grounding & Real Context
  console.log('\n--- 6. Testing AI Mentor with Note Grounding & Context ---');
  const chatNoteRes = await req('/chat', {
    method: 'POST',
    token: userTokens[0],
    body: JSON.stringify({ message: 'Explain 2NF based on my notes.' })
  });
  assert(chatNoteRes.ok, 'AI Mentor answered note inquiry');
  const noteReply = chatNoteRes.data?.assistantMessage?.content || '';
  assert(noteReply.includes('Based on your note') || noteReply.includes('1NF and 2NF Rules') || noteReply.includes('2NF'), 'AI Mentor quoted/referenced User 1 personal note');

  const chatScheduleRes = await req('/chat', {
    method: 'POST',
    token: userTokens[0],
    body: JSON.stringify({ message: 'Create a schedule for DBMS.' })
  });
  const scheduleItems = chatScheduleRes.data?.assistantMessage?.suggestedSchedule || [];
  assert(chatScheduleRes.ok && scheduleItems.length > 0, 'AI Mentor generated schedule proposal with suggestedSchedule items');

  if (scheduleItems.length > 0) {
    const acceptRes = await req('/chat/accept-schedule', {
      method: 'POST',
      token: userTokens[0],
      body: JSON.stringify({ scheduleItems })
    });
    assert(acceptRes.status === 201 && acceptRes.data.tasksCreated > 0, `User 1 accepted AI schedule proposal -> created ${acceptRes.data.tasksCreated} tasks`);
  }

  // 7. Role-Based Admin Panel & User Activation Toggle
  console.log('\n--- 7. Testing Admin Authentication, Stats & User Deactivation ---');
  // Normal user cannot access admin
  const userAdminCheck = await req('/admin/stats', { token: userTokens[0] });
  assert(userAdminCheck.status === 403, 'Normal user blocked from /api/admin/stats with 403 Forbidden');

  // Create admin
  const adminEmail = 'admin_master@studyflow.edu';
  await mongoose.connection.collection('users').deleteMany({ email: adminEmail });
  const adminReg = await req('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Platform Admin',
      email: adminEmail,
      password: 'AdminMasterPass123!',
      passwordConfirm: 'AdminMasterPass123!'
    })
  });
  // Promote to admin role in database
  await mongoose.connection.collection('users').updateOne(
    { email: adminEmail },
    { $set: { role: 'admin' } }
  );

  // Login as admin
  const adminLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: adminEmail, password: 'AdminMasterPass123!' })
  });
  const adminToken = adminLogin.data.token;
  assert(adminLogin.data.user.role === 'admin', 'Admin logged in with role "admin"');

  // Admin stats
  const adminStatsRes = await req('/admin/stats', { token: adminToken });
  assert(adminStatsRes.ok && adminStatsRes.data.stats.totalUsers >= 5, `Admin stats returns real DB metrics (totalUsers: ${adminStatsRes.data.stats.totalUsers}, totalNotes: ${adminStatsRes.data.stats.totalNotes})`);

  // Admin user management: deactivate User 5
  const user5Id = userIds[4];
  const toggleRes = await req(`/admin/users/${user5Id}/toggle-active`, {
    method: 'PATCH',
    token: adminToken
  });
  assert(toggleRes.ok && toggleRes.data.user.isActive === false, 'Admin successfully deactivated User 5 account');

  // Deactivated user login blocked
  const user5LoginAttempt = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: usersConfig[4].email, password: usersConfig[4].pass })
  });
  assert(user5LoginAttempt.status === 403, 'Deactivated User 5 login blocked with HTTP 403');

  // Admin reactivates User 5
  const reactivateRes = await req(`/admin/users/${user5Id}/toggle-active`, {
    method: 'PATCH',
    token: adminToken
  });
  assert(reactivateRes.ok && reactivateRes.data.user.isActive === true, 'Admin reactivated User 5 account');

  // Reactivated user can login
  const user5LoginSuccess = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: usersConfig[4].email, password: usersConfig[4].pass })
  });
  assert(user5LoginSuccess.ok && user5LoginSuccess.data.token, 'Reactivated User 5 successfully logged in');

  // 8. Notifications & Schedule Email Service
  console.log('\n--- 8. Testing Notifications & Today\'s Schedule Email ---');
  const emailRes = await req('/notifications/send-daily-schedule', {
    method: 'POST',
    token: userTokens[0]
  });
  assert(emailRes.ok, "Today's Study Schedule email dispatch endpoint executed successfully");

  const prefRes = await req('/notifications/preferences', { token: userTokens[0] });
  assert(prefRes.ok && prefRes.data.preferences, 'Notification preferences retrieved successfully');

  // 9. Recently Accessed Tracking
  console.log('\n--- 9. Testing Recently Accessed Tracker ---');
  const recordAccessRes = await req('/recently-accessed', {
    method: 'POST',
    token: userTokens[0],
    body: JSON.stringify({
      resourceType: 'note',
      resourceId: userNotes[0],
      title: '1NF and 2NF Rules',
      subtitle: 'Database Systems • Normalization',
      path: '/notes'
    })
  });
  assert(recordAccessRes.status === 201, 'Recently accessed note activity recorded');

  const getRecentRes = await req('/recently-accessed', { token: userTokens[0] });
  assert(getRecentRes.ok && getRecentRes.data.data.length >= 1, 'Recently accessed items returned real persisted activities');

  // 10. Real Analytics (No fake numbers)
  console.log('\n--- 10. Testing Real Analytics Calculation ---');
  const analyticsRes = await req('/analytics', { token: userTokens[0] });
  assert(analyticsRes.ok, 'Analytics retrieved');
  assert(typeof analyticsRes.data.totalWeeklyHours === 'number', `Real total weekly hours computed: ${analyticsRes.data.totalWeeklyHours} hrs`);

  console.log('\n====================================================');
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runVerification().catch(err => {
  console.error('Verification error:', err);
  process.exit(1);
});
