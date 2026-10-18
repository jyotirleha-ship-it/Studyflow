import StudySession from '../models/StudySession.js';
import LearningDNA from '../models/LearningDNA.js';
import StudyTask from '../models/StudyTask.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';

export const computeLearningDNA = async (userId) => {
  let dna = await LearningDNA.findOne({ user: userId });
  if (!dna) {
    dna = new LearningDNA({
      user: userId,
      peakTime: 'Pending study data',
      averageSessionDurationMinutes: 0,
      bestPerformingDays: [],
      averageFocusDuration: 0,
      revisionBehavior: 'Active recall and spaced repetition',
      completionConsistencyScore: 0,
      strongestSubject: 'None yet',
      weakestSubject: 'None yet',
      difficultyTolerance: 'Moderate',
      recoveryBehavior: 'Evaluates next best study actions'
    });
  }

  // Evaluate real study sessions
  const sessions = await StudySession.find({ user: userId });
  if (sessions.length > 0) {
    const totalMinutes = sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
    dna.averageSessionDurationMinutes = Math.round(totalMinutes / sessions.length);

    const avgFocusScore = sessions.reduce((acc, s) => acc + (s.focusScore || 100), 0) / sessions.length;
    dna.averageFocusDuration = Math.max(15, Math.round(dna.averageSessionDurationMinutes * (avgFocusScore / 100)));

    // Calculate peak hours from session timestamps
    const hourCounts = {};
    const dayCounts = {};
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    sessions.forEach(s => {
      const date = new Date(s.createdAt);
      const hour = date.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;

      const dayName = dayNames[date.getDay()];
      dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
    });

    let peakHour = 19;
    let maxHourCount = 0;
    for (const [hour, count] of Object.entries(hourCounts)) {
      if (count > maxHourCount) {
        maxHourCount = count;
        peakHour = parseInt(hour);
      }
    }

    const startH = peakHour % 12 || 12;
    const startAmPm = peakHour >= 12 ? 'PM' : 'AM';
    const endHour = (peakHour + 2) % 24;
    const endH = endHour % 12 || 12;
    const endAmPm = endHour >= 12 ? 'PM' : 'AM';
    dna.peakTime = `${startH}:00 ${startAmPm} – ${endH}:00 ${endAmPm}`;

    dna.bestPerformingDays = Object.entries(dayCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => entry[0]);
  }

  // Evaluate real task consistency
  const tasks = await StudyTask.find({ user: userId });
  if (tasks.length > 0) {
    const completed = tasks.filter(t => t.status === 'completed').length;
    dna.completionConsistencyScore = Math.round((completed / tasks.length) * 100);
  }

  // Evaluate real strongest and weakest subjects from actual topic mastery
  const subjects = await Subject.find({ user: userId });
  if (subjects.length > 0) {
    const subjectAverages = [];
    for (const sub of subjects) {
      const topics = await Topic.find({ user: userId, subject: sub._id });
      if (topics.length > 0) {
        const avgMastery = topics.reduce((acc, t) => acc + (t.masteryScore || 50), 0) / topics.length;
        subjectAverages.push({ name: sub.name, avgMastery });
      } else {
        subjectAverages.push({ name: sub.name, avgMastery: 50 });
      }
    }

    if (subjectAverages.length > 0) {
      subjectAverages.sort((a, b) => b.avgMastery - a.avgMastery);
      dna.strongestSubject = subjectAverages[0].name;
      dna.weakestSubject = subjectAverages[subjectAverages.length - 1].name;
    }
  }

  await dna.save();
  return dna;
};
