import { useState, useCallback } from 'react';
import { planAPI } from '../services/api.js';

export const useStudyPlanner = () => {
  const [nextAction, setNextAction] = useState(null);
  const [repairData, setRepairData] = useState(null);
  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchNextAction = useCallback(async () => {
    try {
      const res = await planAPI.getNextAction();
      setNextAction(res.data.action);
      return res.data.action;
    } catch (err) {
      console.error('Failed to get next best action', err);
    }
  }, []);

  const checkPlanRepair = useCallback(async () => {
    try {
      const res = await planAPI.getPlanRepair();
      setRepairData(res.data.repair);
      return res.data.repair;
    } catch (err) {
      console.error('Failed to check plan repair', err);
    }
  }, []);

  const applyPlanRepair = useCallback(async (revisionId, approve) => {
    setLoading(true);
    try {
      const res = await planAPI.applyRepair({ revisionId, approve });
      setLoading(false);
      setRepairData(null);
      return res.data;
    } catch (err) {
      setLoading(false);
      return { success: false, message: err.message };
    }
  }, []);

  const runWhatIfSimulator = useCallback(async (skipDate) => {
    setLoading(true);
    try {
      const res = await planAPI.runWhatIf({ skipDate });
      setLoading(false);
      setSimulationResult(res.data.simulation);
      return res.data.simulation;
    } catch (err) {
      setLoading(false);
      console.error('Failed to run what if simulator', err);
    }
  }, []);

  return {
    nextAction,
    repairData,
    simulationResult,
    loading,
    fetchNextAction,
    checkPlanRepair,
    applyPlanRepair,
    runWhatIfSimulator,
    clearSimulation: () => setSimulationResult(null)
  };
};
