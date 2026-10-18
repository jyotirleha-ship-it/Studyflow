export const analyzeUnderstanding = ({ recallAccuracy, applicationAccuracy, retriesCount = 0, hintsUsedCount = 0 }) => {
  // Surface understanding detector: High recall but low application
  if (recallAccuracy >= 70 && applicationAccuracy < 55) {
    return {
      type: 'surface_understanding',
      isSurface: true,
      message: '⚠️ You may recognize this topic conceptually but have difficulty applying it to problem-solving.',
      recommendation: 'Practice 3 application-based coding/scenario questions before moving forward to solidify actual understanding.',
      masteryAdjustment: -15
    };
  }

  // Strong actual understanding: Both high
  if (recallAccuracy >= 70 && applicationAccuracy >= 70) {
    return {
      type: 'actual_understanding',
      isSurface: false,
      message: '🎉 Genuine Understanding Detected! You understand the foundational mechanics and can apply them under variation.',
      recommendation: 'Advance to the next syllabus module or attempt a timed revision challenge.',
      masteryAdjustment: +15
    };
  }

  // Low on both: Struggling with foundations
  if (recallAccuracy < 60 && applicationAccuracy < 60) {
    return {
      type: 'struggling',
      isSurface: false,
      message: 'Foundational concepts are not yet solid.',
      recommendation: 'Review the prerequisite topics and core definitions before re-attempting application problems.',
      masteryAdjustment: -10
    };
  }

  return {
    type: 'actual_understanding',
    isSurface: false,
    message: 'Good conceptual progress with balanced performance.',
    recommendation: 'Proceed with scheduled revision cycles.',
    masteryAdjustment: +5
  };
};
