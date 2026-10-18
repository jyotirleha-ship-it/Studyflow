import express from 'express';
import { seedDatabase } from '../controllers/seedController.js';

const router = express.Router();

// Restrict seed endpoint: block normal user access
router.post('/', (req, res, next) => {
  const isTestEnvironment = process.env.NODE_ENV === 'test';
  const testHeader = req.headers['x-studyflow-test-fixture'];

  if (!isTestEnvironment && testHeader !== 'studyflow-dev-fixture-2026') {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: Seed functionality is disabled in production and not accessible to regular users.'
    });
  }

  seedDatabase(req, res, next);
});

export default router;
