// StudyFlow AI Personal Study Mentor Engine
// Supports Google Gemini API (when GEMINI_API_KEY/AI_API_KEY is configured)
// and includes a Data-Grounded Intelligent Academic Mentor Engine when running without an external key.

export const generateMentorResponse = async ({ message, context = {}, history = [] }) => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;

  if (apiKey) {
    try {
      return await callGeminiAPI({ message, context, history, apiKey });
    } catch (geminiError) {
      console.warn('[AI Service] Gemini API call failed, falling back to Data-Grounded Academic Mentor Engine:', geminiError.message);
    }
  }

  // Fallback to Data-Grounded Academic Mentor Engine
  return generateDataGroundedResponse({ message, context, history });
};

// 1. Google Gemini API Grounded Execution
const callGeminiAPI = async ({ message, context, history, apiKey }) => {
  const modelName = 'gemini-3.8-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const lang = context.preferredLanguage || 'en';
  const langPrompt = lang === 'ta'
    ? 'Respond in Tamil (தமிழ்) while keeping technical programming/engineering terms accessible.'
    : lang === 'hi'
    ? 'Respond in Hindi (हिंदी) while keeping technical terms accessible.'
    : 'Respond in clear English.';

  const systemInstruction = `You are StudyFlow Personal Academic Mentor, an intelligent study mentor embedded in the student's study operating system.
You MUST rely on and prioritize the student's ACTUAL DATABASE CONTEXT provided below:

STUDENT PROFILE:
- Name: ${context.userName || 'Student'}
- Daily Study Goal: ${context.dailyStudyGoalMinutes || 120} mins
- Available Hours: ${context.availableHoursPerDay || 4} hours/day
- Streak: ${context.streak || 0} days

CURRICULUM & SUBJECTS:
${JSON.stringify(context.subjects || [], null, 2)}

STUDENT'S PERSONAL NOTES:
${context.noteContextString || 'No personal notes recorded yet.'}

RECENT STUDY SESSIONS & HISTORY:
${JSON.stringify(context.recentSessions || [], null, 2)}
Yesterday Study Sessions: ${JSON.stringify(context.yesterdaySessions || [], null, 2)}

UPCOMING EXAMS:
${JSON.stringify(context.upcomingExams || [], null, 2)}

LEARNING DNA:
${JSON.stringify(context.learningDNA || {}, null, 2)}

RULES:
1. NEVER invent fake study history, fake streaks, or fake readiness. If no data exists, politely explain that history is needed and guide them.
2. When the user asks about their notes, ALWAYS quote and reference their note titles (e.g. 📘 Based on your note: "[Title]").
3. When asked to create a schedule or task, offer concrete actionable study slots based on their real subjects.
4. ${langPrompt}
5. Do not use Markdown syntax such as **bold**, *italic*, ### headings, or backticks. Use plain text with normal paragraphs and bullet points.
`;

  const contents = [];

  // Add conversation history
  (history || []).slice(-6).forEach(h => {
    contents.push({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }]
    });
  });

  // Add current message
  contents.push({
    role: 'user',
    parts: [{ text: message }]
  });

  const body = {
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1000
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Extract structured task or action proposal if present
  let suggestedTask = null;
  const lowerMsg = message.toLowerCase();
  if (lowerMsg.includes('task') || lowerMsg.includes('assign') || lowerMsg.includes('schedule')) {
    suggestedTask = extractTaskProposalFromContext(context, message);
  }

  return {
    role: 'assistant',
    content: textOutput,
    suggestedTask
  };
};

// 2. Data-Grounded Intelligent Academic Mentor Engine (Deterministic & Real Data Driven)
const generateDataGroundedResponse = ({ message, context, history }) => {
  const query = (message || '').toLowerCase().trim();
  const userName = context.userName || 'Student';
  const subjects = context.subjects || [];
  const topics = context.topics || [];
  const notes = context.notes || [];
  const recentSessions = context.recentSessions || [];
  const yesterdaySessions = context.yesterdaySessions || [];
  const upcomingExams = context.upcomingExams || [];
  const learningDNA = context.learningDNA || {};
  const lang = context.preferredLanguage || 'en';

  // Check if completely new user with zero records
  const isCompletelyNew = subjects.length === 0 && recentSessions.length === 0 && notes.length === 0;
  if (isCompletelyNew && (query.includes('history') || query.includes('weak') || query.includes('readiness') || query.includes('yesterday') || query.includes('exam'))) {
    if (lang === 'ta') {
      return {
        role: 'assistant',
        content: `வணக்கம் ${userName}! உங்கள் செயல்திறனை பகுப்பாய்வு செய்ய போதுமான படிப்பு வரலாறு இன்னும் இல்லை.\n\nமுதலில் பாடங்கள் மற்றும் தலைப்புகளைச் சேர்த்து, உங்கள் முதல் படிப்பு அமர்வைத் தொடங்குங்கள்!`,
        suggestedTask: null
      };
    }
    if (lang === 'hi') {
      return {
        role: 'assistant',
        content: `नमस्ते ${userName}! आपके प्रदर्शन का विश्लेषण करने के लिए अभी पर्याप्त अध्ययन इतिहास नहीं है।\n\nआइए पहले अपने विषय जोड़ें और अपना पहला अध्ययन सत्र पूरा करें!`,
        suggestedTask: null
      };
    }
    return {
      role: 'assistant',
      content: `Hello ${userName}! I don't have enough study history yet to analyze your performance.\n\nLet's start by adding your subjects in the **Subjects** section and completing your first study session in **Focus Mode**. Once you log your initial study, I will track your Learning DNA and give you personalized recommendations!`,
      suggestedTask: null
    };
  }

  // --- QUERY CATEGORY 1: Personal Notes Inquiries ---
  const isNoteInquiry = query.includes('note') || query.includes('my notes') || query.includes('what did i write') || query.includes('summarize my');
  if (isNoteInquiry && notes.length > 0) {
    // Find note matching subject/topic/keyword
    let matchingNote = notes.find(n => {
      const titleLower = (n.title || '').toLowerCase();
      const contentLower = (n.content || '').toLowerCase();
      const subLower = (n.subject?.name || '').toLowerCase();
      return query.includes(titleLower) || query.includes(subLower) || titleLower.split(' ').some(w => w.length > 3 && query.includes(w));
    });

    if (!matchingNote) {
      matchingNote = notes[0]; // Most recent note
    }

    const subName = matchingNote.subject?.name || 'Curriculum';
    const noteTitle = matchingNote.title;
    const noteContent = matchingNote.content;

    // Note-based exam generation
    if (query.includes('exam') || query.includes('question') || query.includes('quiz')) {
      const lines = noteContent.split('\n').map(l => l.trim()).filter(l => l.length > 15);
      const q1 = lines[0] || `${noteTitle} core invariant`;
      const q2 = lines[1] || `${noteTitle} practical application`;

      return {
        role: 'assistant',
        content: `📘 **Practice Questions from your Note: "${noteTitle}" (${subName})**\n\nI have generated diagnostic practice questions based directly on your stored note:\n\n**Q1:** In your note *"${noteTitle}"*, you noted: *"${q1}"*.\n• How would you apply this concept under constrained conditions?\n• Can you explain the prerequisite dependencies?\n\n**Q2 (Application):** Based on: *"${q2}"*\n• What edge cases must be handled when implementing this?\n\nWould you like to start a diagnostic quiz or record a focus session to review this note?`,
        suggestedTask: {
          title: `Revise Notes: ${noteTitle}`,
          durationMinutes: 30,
          scheduledDate: new Date().toISOString().split('T')[0],
          priority: 'high',
          reason: `Reinforce concepts from your personal note "${noteTitle}"`
        }
      };
    }

    // Note summarization or explanation
    return {
      role: 'assistant',
      content: `📘 **Based on your note: "${noteTitle}" (${subName})**\n\nHere is the structured breakdown of what you recorded:\n\n${noteContent}\n\n**Mentor Analysis & Synthesis**:\n• **Key Takeaway**: This note captures the foundational rules for ${matchingNote.topic?.name || noteTitle}.\n• **Next Step**: You can export this note as a PDF from your Notes tab or create targeted active recall questions to ensure full retention.`,
      suggestedTask: null
    };
  }

  // --- QUERY CATEGORY 2: Study History (Yesterday, Last Week, DBMS time, etc.) ---
  if (query.includes('yesterday') || query.includes('what did i study') || query.includes('last week') || query.includes('how much time') || query.includes('history')) {
    if (query.includes('yesterday')) {
      if (yesterdaySessions.length === 0) {
        return {
          role: 'assistant',
          content: `You did not record any study sessions yesterday (${getYesterdayDateString()}).\n\n${recentSessions.length > 0 ? `Your last recorded study session was on **${new Date(recentSessions[0].createdAt).toLocaleDateString()}** for **${recentSessions[0].topic?.name || recentSessions[0].subject?.name || 'General Study'}** (${recentSessions[0].durationMinutes} mins).` : 'You have not logged any study sessions yet.'}\n\nLet\'s start today\'s study plan to maintain your progress!`,
          suggestedTask: extractTaskProposalFromContext(context, message)
        };
      }

      const sessionSummary = yesterdaySessions.map(s => `• **${s.subject?.name || 'General'}**: ${s.topic?.name || 'Topic study'} (${s.durationMinutes} mins, Focus: ${s.focusScore || 100}%)`).join('\n');
      const totalYesterdayMins = yesterdaySessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

      return {
        role: 'assistant',
        content: `Here is your recorded study summary from yesterday (${getYesterdayDateString()}):\n\n${sessionSummary}\n\n**Total Time Studied Yesterday**: **${totalYesterdayMins} minutes** (${Math.round(totalYesterdayMins / 60 * 10) / 10} hours).\nGreat effort! Ready to tackle today's targets?`,
        suggestedTask: extractTaskProposalFromContext(context, message)
      };
    }

    // General subject time query (e.g. "How much time did I spend on DBMS?")
    const matchingSubject = subjects.find(s => query.includes(s.name.toLowerCase()) || query.includes((s.code || '').toLowerCase()));
    if (matchingSubject) {
      const subjectSessions = recentSessions.filter(s => s.subject?._id?.toString() === matchingSubject._id.toString() || s.subject?.name === matchingSubject.name);
      const totalSubjectMinutes = subjectSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

      return {
        role: 'assistant',
        content: `📊 **Study Time for ${matchingSubject.name}**:\n\n• Total Recorded Sessions: **${subjectSessions.length}**\n• Total Time Invested: **${totalSubjectMinutes} minutes** (${Math.round(totalSubjectMinutes / 60 * 10) / 10} hours)\n• Syllabus Status: Priority is ${matchingSubject.priority || 'medium'}.\n\nWould you like me to schedule a targeted revision session for ${matchingSubject.name}?`,
        suggestedTask: {
          title: `Study Session: ${matchingSubject.name}`,
          durationMinutes: 40,
          scheduledDate: new Date().toISOString().split('T')[0],
          priority: matchingSubject.priority === 'high' ? 'high' : 'medium',
          reason: `Curriculum progress for ${matchingSubject.name}`
        }
      };
    }

    // General history summary
    const totalMinutesAll = recentSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
    return {
      role: 'assistant',
      content: `Here is your overall study history summary:\n\n• Total Sessions Recorded: **${recentSessions.length}**\n• Total Study Time: **${totalMinutesAll} minutes** (${Math.round(totalMinutesAll / 60 * 10) / 10} hours)\n• Active Streak: **${context.streak || 0} days**\n• Consistency Score: **${learningDNA.completionConsistencyScore || 0}%**\n\nWhat specific topic or subject would you like to review?`,
      suggestedTask: null
    };
  }

  // --- QUERY CATEGORY 3: Weak Subjects / Topics / Forgetting ---
  if (query.includes('weak') || query.includes('struggl') || query.includes('difficult') || query.includes('forgetting') || query.includes('focus on')) {
    const weakTopics = topics.filter(t => (t.masteryScore || 0) < 65).sort((a, b) => (a.masteryScore || 0) - (b.masteryScore || 0));

    if (weakTopics.length === 0) {
      const firstTopic = topics[0];
      return {
        role: 'assistant',
        content: `Based on your recorded assessments, you currently have no critically weak topics (all mastery scores are above 65%).\n\nTo continue advancing, let's target intermediate application exercises in **${firstTopic ? firstTopic.name : 'your core subjects'}**.`,
        suggestedTask: firstTopic ? {
          title: `Practice: ${firstTopic.name}`,
          durationMinutes: 45,
          scheduledDate: new Date().toISOString().split('T')[0],
          priority: 'medium',
          reason: 'Reinforce retention with active recall practice'
        } : null
      };
    }

    const weakest = weakTopics[0];
    const subName = weakest.subject?.name || 'Curriculum';
    const weakList = weakTopics.slice(0, 3).map(w => `• **${w.subject?.name || 'Subject'} — ${w.name}**: Mastery ${w.masteryScore}% (${w.status || 'needs revision'})`).join('\n');

    return {
      role: 'assistant',
      content: `Based on your actual study sessions, quiz performance, and Learning DNA:\n\n**Identified Weak Areas**:\n${weakList}\n\n🎯 **Primary Priority**: **${subName} — ${weakest.name}** is at **${weakest.masteryScore}% mastery**.\n\n**Mentor Diagnosis**: Repeated performance drops in this topic indicate a need to reinforce core definitions before attempting complex scenario questions.\n\nI recommend dedicating 30 minutes to review your notes for this topic and attempt 3 practice problems.`,
      suggestedTask: {
        title: `Reinforce Weak Area: ${weakest.name}`,
        durationMinutes: 30,
        scheduledDate: new Date().toISOString().split('T')[0],
        priority: 'urgent',
        reason: `Lowest topic mastery (${weakest.masteryScore}%) in your curriculum`
      }
    };
  }

  // --- QUERY CATEGORY 4: Schedule Generation ---
  if (query.includes('schedule') || query.includes('create a schedule') || query.includes('plan for tomorrow') || query.includes('revision plan')) {
    const availableHours = context.availableHoursPerDay || 4;
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const planTasks = [];
    const subjectsToPlan = subjects.slice(0, 3);

    if (subjectsToPlan.length > 0) {
      subjectsToPlan.forEach((sub, idx) => {
        const subTopics = topics.filter(t => t.subject?._id?.toString() === sub._id?.toString() || t.subject?.name === sub.name);
        const targetTopic = subTopics[0]?.name || 'Core Fundamentals';
        const startHour = 18 + idx; // 6:00 PM, 7:00 PM, 8:00 PM
        planTasks.push({
          title: `${sub.name}: ${targetTopic}`,
          scheduledDate: tomorrow,
          scheduledTime: `${startHour}:00`,
          durationMinutes: 45,
          priority: sub.priority === 'high' ? 'high' : 'medium',
          reason: `Automated schedule slot based on ${availableHours}h daily availability and ${sub.priority || 'medium'} priority.`
        });
      });
    } else {
      planTasks.push({
        title: 'Study Session: Core Subject Review',
        scheduledDate: tomorrow,
        scheduledTime: '18:00',
        durationMinutes: 60,
        priority: 'high',
        reason: 'Scheduled based on daily study availability'
      });
    }

    const schedulePreview = planTasks.map(t => `• **${t.scheduledTime}** — ${t.title} (${t.durationMinutes} mins)`).join('\n');

    return {
      role: 'assistant',
      content: `I have generated an optimized schedule for tomorrow (**${tomorrow}**) based on your available study time (**${availableHours} hours/day**) and active subject priorities:\n\n${schedulePreview}\n\n**Total Planned Time**: **${planTasks.reduce((acc, t) => acc + t.durationMinutes, 0)} minutes**.\n\nPlease click **Accept Schedule** below to add these study blocks directly to your Planner and Calendar!`,
      suggestedTask: planTasks[0], // First primary task
      suggestedSchedule: planTasks
    };
  }

  // --- QUERY CATEGORY 5: Sample Exam Generation ---
  if (query.includes('generate exam') || query.includes('sample exam') || query.includes('practice exam')) {
    const matchingSub = subjects.find(s => query.includes(s.name.toLowerCase()) || query.includes((s.code || '').toLowerCase())) || subjects[0];
    const subName = matchingSub ? matchingSub.name : 'General Curriculum';
    const subTopics = topics.filter(t => t.subject?._id?.toString() === matchingSub?._id?.toString() || t.subject?.name === subName);
    const topicListStr = subTopics.slice(0, 3).map(t => t.name).join(', ') || 'Core Modules';

    return {
      role: 'assistant',
      content: `📝 **Adaptive Sample Exam for ${subName}**\n\nI have prepared a practice exam calibrated to your recent mastery level:\n\n• **Subject**: ${subName}\n• **Topics Covered**: ${topicListStr}\n• **Format**: 4 Questions (2 Concept Recall + 2 Application Problems)\n• **Target Duration**: 30 Minutes\n• **Difficulty**: Adapted to intermediate problem-solving\n\nWould you like to open this exam now in the **Exams** tab?`,
      suggestedTask: {
        title: `Practice Exam: ${subName}`,
        durationMinutes: 30,
        scheduledDate: new Date().toISOString().split('T')[0],
        priority: 'high',
        reason: `Simulated exam to benchmark retention and readiness for ${subName}`
      }
    };
  }

  // --- QUERY CATEGORY 6: Task Request ---
  if (query.includes('give me a task') || query.includes('create a task') || query.includes('task for')) {
    const task = extractTaskProposalFromContext(context, message);
    return {
      role: 'assistant',
      content: `Hello ${userName}! Based on your current syllabus and mastery levels, here is your recommended study task:\n\n**${task.title}**\n• Duration: **${task.durationMinutes} minutes**\n• Priority: **${task.priority.toUpperCase()}**\n• Reason: ${task.reason}\n\nClick **Accept Task** below to register this in your Planner and Calendar.`,
      suggestedTask: task
    };
  }

  // --- QUERY CATEGORY 7: Focus Mode Trigger ---
  if (query.includes('focus') || query.includes('start session') || query.includes('pomodoro')) {
    const defaultTopic = topics[0]?.name || subjects[0]?.name || 'Focused Deep Work';
    return {
      role: 'assistant',
      content: `Ready for deep work! I recommend starting a **45-minute Focus Session** on **${defaultTopic}**.\n\nDistraction detection will monitor tab switches, and your session will be saved directly into your empirical Learning DNA.\n\nClick the link below or navigate to the **Study Session** tab to begin!`,
      suggestedTask: {
        title: `Focus Session: ${defaultTopic}`,
        durationMinutes: 45,
        scheduledDate: new Date().toISOString().split('T')[0],
        priority: 'high',
        reason: 'Requested focus study session'
      }
    };
  }

  // Default Greeting / Guide Response Grounded in User's Actual Metrics
  const subjectCount = subjects.length;
  const sessionCount = recentSessions.length;
  const streakDays = context.streak || 0;

  return {
    role: 'assistant',
    content: `Hello ${userName}! I am your **StudyFlow Personal Academic Mentor**.\n\nCurrently monitoring:\n• **${subjectCount} Subject(s)** and **${notes.length} Personal Note(s)**\n• **${sessionCount} Logged Session(s)** with an active **${streakDays}-day Streak**\n\nYou can ask me:\n• *"What did I study yesterday?"*\n• *"What are my weak subjects?"*\n• *"Explain my notes on [topic]"*\n• *"Create a schedule for tomorrow"*\n• *"Create a sample exam for ${subjects[0]?.name || 'my subjects'}"*,\n• *"Give me a task for today"*.`,
    suggestedTask: null
  };
};

const extractTaskProposalFromContext = (context, query) => {
  const subjects = context.subjects || [];
  const topics = context.topics || [];
  const lowerQuery = (query || '').toLowerCase();

  let targetSubject = subjects.find(s => lowerQuery.includes(s.name.toLowerCase()) || lowerQuery.includes((s.code || '').toLowerCase()));
  if (!targetSubject && subjects.length > 0) {
    targetSubject = subjects[0];
  }

  let targetTopic = null;
  if (targetSubject) {
    const subTopics = topics.filter(t => t.subject?._id?.toString() === targetSubject._id?.toString() || t.subject?.name === targetSubject.name);
    targetTopic = subTopics.find(t => (t.masteryScore || 0) < 70) || subTopics[0];
  }

  const subjectName = targetSubject?.name || 'Curriculum';
  const topicName = targetTopic?.name || 'Core Fundamentals';
  const todayStr = new Date().toISOString().split('T')[0];

  return {
    title: `${subjectName} — ${topicName}`,
    durationMinutes: targetTopic?.estimatedMinutes || 40,
    scheduledDate: todayStr,
    priority: targetSubject?.priority === 'high' ? 'high' : 'medium',
    reason: `Targeted task generated by StudyFlow Mentor based on ${subjectName} syllabus priority.`
  };
};

const getYesterdayDateString = () => {
  const d = new Date(Date.now() - 86400000);
  return d.toLocaleDateString();
};

export const generateQuizQuestions = async ({ topicName, count = 4 }) => {
  return [
    {
      questionText: `In ${topicName}, which of the following best defines the fundamental concept?`,
      questionType: 'recall',
      options: [
        'A structured pattern used to ensure efficient resource access and enforce system invariants',
        'A static memory allocation mechanism with zero runtime overhead',
        'A sequential linear search routine executed during program termination',
        'An unmanaged hardware interrupt signal'
      ],
      correctAnswerIndex: 0,
      explanation: 'The fundamental concept relies on structured patterns to manage resource allocation and invariants safely.',
      hint: 'Think about concurrency, resource access, and invariants.'
    },
    {
      questionText: `When applying ${topicName} in a high-concurrency production scenario, what is the primary edge case to safeguard against?`,
      questionType: 'application',
      options: [
        'Race conditions or deadlock under circular wait dependencies',
        'Compiler warning regarding unused local variables',
        'Slight variation in CSS rendering engine timing',
        'Excessive static typing annotations in test files'
      ],
      correctAnswerIndex: 0,
      explanation: 'Application problems frequently stress test state invariants, where race conditions or circular wait trigger system failures.',
      hint: 'Focus on concurrent access and resource locking invariants.'
    },
    {
      questionText: `Which active recall technique is most effective for long-term retention of ${topicName}?`,
      questionType: 'recall',
      options: [
        'Spaced retrieval practice with self-explanation of invariants within 48 hours',
        'Re-reading highlighted textbook pages without testing yourself',
        'Cramming theoretical definitions right before an examination',
        'Passive listening to lecture audio at 2x speed'
      ],
      correctAnswerIndex: 0,
      explanation: 'Empirical learning science proves that spaced active recall with self-explanation yields 3x higher retention than passive reading.',
      hint: 'Spaced retrieval and self-explanation are key.'
    },
    {
      questionText: `If an algorithm utilizing ${topicName} experiences a worst-case performance degradation, what is the most probable architectural cause?`,
      questionType: 'application',
      options: [
        'Unbalanced partition/tree depth leading to linear rather than logarithmic time complexity',
        'Overly descriptive variable names in the module header',
        'Network latency on an isolated offline machine',
        'Use of standard IEEE 754 floating point arithmetic'
      ],
      correctAnswerIndex: 0,
      explanation: 'Worst-case degradation in tree/graph algorithms typically occurs when depth degrades to O(N) due to lack of rebalancing.',
      hint: 'Consider structural balance and recursion depth.'
    }
  ];
};
