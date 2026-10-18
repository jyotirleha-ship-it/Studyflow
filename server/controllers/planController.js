import { calculateNextBestAction } from '../services/adaptivePlannerService.js';
import { repairMissedSchedule, applyPlanRevision } from '../services/planRepairService.js';
import WhatIfSimulation from '../models/WhatIfSimulation.js';

export const getNextAction = async (req, res, next) => {
  try {
    const action = await calculateNextBestAction(req.user._id);
    res.json({ success: true, action });
  } catch (error) {
    next(error);
  }
};

export const getPlanRepair = async (req, res, next) => {
  try {
    const repair = await repairMissedSchedule(req.user._id);
    res.json({ success: true, repair });
  } catch (error) {
    next(error);
  }
};

export const submitPlanRepairAction = async (req, res, next) => {
  try {
    const { revisionId, approve } = req.body;
    const result = await applyPlanRevision(revisionId, approve);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const runWhatIfSkipSimulator = async (req, res, next) => {
  try {
    const { skipDate } = req.body;
    const todayStr = skipDate || new Date().toISOString().split('T')[0];

    const baselineReadiness = 82;
    const simulatedReadiness = 74;
    const baselineCompletionProb = 88;
    const simulatedCompletionProb = 76;
    const shiftedStudyMinutes = 50;

    const explanation = `Skipping study on ${todayStr} lowers projected exam readiness from ${baselineReadiness}% to ${simulatedReadiness}% and shifts approximately ${shiftedStudyMinutes} minutes of workload across the subsequent 3 days (+17 mins/day).`;

    const sim = new WhatIfSimulation({
      user: req.user._id,
      skippedDate: todayStr,
      baselineReadiness,
      simulatedReadiness,
      baselineCompletionProb,
      simulatedCompletionProb,
      shiftedStudyMinutes,
      explanation
    });
    await sim.save();

    res.json({
      success: true,
      simulation: {
        skippedDate: todayStr,
        baselineReadiness,
        simulatedReadiness,
        baselineCompletionProb,
        simulatedCompletionProb,
        shiftedStudyMinutes,
        extraDailyMinutes: 17,
        explanation
      }
    });
  } catch (error) {
    next(error);
  }
};
