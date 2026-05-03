import express from 'express';
import {
  createLog,
  getLogs,
  getLogsRange,
  getDailyStats,
  deleteLog,
} from '../controllers/logController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.post('/', createLog);
router.get('/', getLogs);
router.get('/range', getLogsRange);
router.get('/stats', getDailyStats);
router.delete('/:id', deleteLog);

export default router;
