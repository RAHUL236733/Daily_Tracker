import TaskLog from '../models/TaskLog.js';
import Task from '../models/Task.js';

const toDateString = (value = new Date()) => new Date(value).toISOString().slice(0, 10);

/**
 * @desc Create or update a task log entry
 * @route POST /api/logs
 * @access Private
 */
export const createLog = async (req, res) => {
  try {
    const { taskId, date, completed, timeSpent } = req.body;

    if (!taskId || !date) {
      return res.status(400).json({ success: false, message: 'Please provide taskId and date' });
    }

    // Verify task belongs to user
    const task = await Task.findOne({ _id: taskId, userId: req.userId });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const logDate = toDateString(date);

    // Check if log already exists for this date
    let log = await TaskLog.findOne({
      userId: req.userId,
      taskId,
      date: logDate,
    });

    if (log) {
      // Update existing log
      log.completed = completed !== undefined ? completed : log.completed;
      log.timeSpent = timeSpent !== undefined ? timeSpent : log.timeSpent;
    } else {
      // Create new log
      log = new TaskLog({
        userId: req.userId,
        taskId,
        date: logDate,
        completed: completed || false,
        timeSpent: timeSpent || 0,
      });
    }

    await log.save();

    res.status(201).json({
      success: true,
      message: 'Task log created/updated successfully',
      log,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Get task logs for a specific date
 * @route GET /api/logs?date=YYYY-MM-DD
 * @access Private
 */
export const getLogs = async (req, res) => {
  try {
    const { date, taskId } = req.query;

    const query = { userId: req.userId };

    if (date) {
      query.date = String(date);
    }

    if (taskId) {
      query.taskId = taskId;
    }

    const logs = await TaskLog.find(query)
      .populate('taskId', 'title category')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Get logs for a date range
 * @route GET /api/logs/range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * @access Private
 */
export const getLogsRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Please provide startDate and endDate' });
    }

    const start = toDateString(startDate);
    const end = toDateString(endDate);

    const logs = await TaskLog.find({
      userId: req.userId,
      date: { $gte: start, $lte: end },
    })
      .populate('taskId', 'title category')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Get daily statistics
 * @route GET /api/logs/stats?date=YYYY-MM-DD
 * @access Private
 */
export const getDailyStats = async (req, res) => {
  try {
    const { date } = req.query;

    const queryDate = toDateString(date || new Date());

    const logs = await TaskLog.find({
      userId: req.userId,
      date: queryDate,
    });

    const completed = logs.filter((log) => log.completed).length;
    const total = logs.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const totalTimeSpent = logs.reduce((sum, log) => sum + log.timeSpent, 0);

    res.status(200).json({
      success: true,
      stats: {
        date: queryDate,
        completed,
        total,
        completionRate,
        totalTimeSpent,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Delete a task log
 * @route DELETE /api/logs/:id
 * @access Private
 */
export const deleteLog = async (req, res) => {
  try {
    const log = await TaskLog.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!log) {
      return res.status(404).json({ success: false, message: 'Task log not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Task log deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
