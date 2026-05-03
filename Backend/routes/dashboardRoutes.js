import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getDashboard } from '../controllers/taskController.js';

const router = express.Router();

router.use(protect);
router.get('/', getDashboard);

export default router;
