import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

const MOTIVATIONAL_MESSAGES = [
  "Consistency beats intensity! 25 minutes of deep focus moves mountains. 🚀",
  "Great job showing up today! Your future self is thanking you right now. ✨",
  "Stuck on a tricky concept? Break it into smaller bite-sized questions! 🧩",
  "Remember to take a 5-minute breather to help your brain consolidate memories! ☕",
  "Mastering DBMS & Java is a marathon. Every study block counts! 📚"
];

/**
 * Custom hook for AI Mentor Robot companion character.
 * Employs useState, useEffect, useCallback, and useMemo.
 */
export const useMentorRobot = () => {
  const { user } = useSelector((state) => state.auth);
  const [isBubbleOpen, setIsBubbleOpen] = useState(true);
  const [robotMood, setRobotMood] = useState('happy'); // 'happy' | 'waving' | 'cheering' | 'thinking'
  const [messageIndex, setMessageIndex] = useState(0);

  const studentName = useMemo(() => {
    return user?.name ? user.name.split(' ')[0] : 'Scholar';
  }, [user]);

  const todayTarget = useMemo(() => ({
    subjects: 2,
    quizzes: 1,
    revisionMinutes: 30
  }), []);

  // Cycle moods occasionally
  useEffect(() => {
    const moods = ['happy', 'waving', 'cheering', 'thinking'];
    const interval = setInterval(() => {
      setRobotMood(prev => {
        const nextIdx = (moods.indexOf(prev) + 1) % moods.length;
        return moods[nextIdx];
      });
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  const toggleBubble = useCallback(() => {
    setIsBubbleOpen(prev => !prev);
  }, []);

  const nextMessage = useCallback(() => {
    setMessageIndex(prev => (prev + 1) % (MOTIVATIONAL_MESSAGES.length + 1));
  }, []);

  const currentSpeech = useMemo(() => {
    if (messageIndex === 0) {
      return {
        type: 'target',
        title: `Hello ${studentName}! 🤖`,
        content: `Today's target:\n• ${todayTarget.subjects} subjects\n• ${todayTarget.quizzes} quiz\n• ${todayTarget.revisionMinutes} minutes revision`,
        actionText: 'Got it, let\'s study! 🎯'
      };
    }
    const quote = MOTIVATIONAL_MESSAGES[(messageIndex - 1) % MOTIVATIONAL_MESSAGES.length];
    return {
      type: 'motivation',
      title: 'Mentor Tip 💡',
      content: quote,
      actionText: 'Next tip 👉'
    };
  }, [studentName, todayTarget, messageIndex]);

  return {
    isBubbleOpen,
    robotMood,
    studentName,
    todayTarget,
    currentSpeech,
    toggleBubble,
    nextMessage,
    setIsBubbleOpen,
    setRobotMood
  };
};

export default useMentorRobot;
