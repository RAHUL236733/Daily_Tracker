import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { createTask, completeTask } from '../controllers/taskController.js';

const router = express.Router();

router.use(protect);
router.post('/', createTask);
router.patch('/:id/complete', completeTask);

export default router;
