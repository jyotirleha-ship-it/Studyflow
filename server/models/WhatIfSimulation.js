import mongoose from 'mongoose';

const whatIfSimulationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skippedDate: { type: String, required: true },
  baselineReadiness: { type: Number, default: 82 },
  simulatedReadiness: { type: Number, default: 74 },
  baselineCompletionProb: { type: Number, default: 88 },
  simulatedCompletionProb: { type: Number, default: 76 },
  shiftedStudyMinutes: { type: Number, default: 50 },
  explanation: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('WhatIfSimulation', whatIfSimulationSchema);
