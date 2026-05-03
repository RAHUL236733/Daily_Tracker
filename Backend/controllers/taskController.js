import Task from '../models/Task.js';
import TaskLog from '../models/TaskLog.js';
import mongoose from 'mongoose';
import User from '../models/User.js';

const APP_TIMEZONE = process.env.APP_TIMEZONE || 'UTC';

const toDateString = (value = new Date()) => {
  const d = new Date(value);
  return new Intl.DateTimeFormat('en-CA', { timeZone: APP_TIMEZONE }).format(d);
};

const parseDate = (dateString) => new Date(`${dateString}T00:00:00Z`);

const subtractOneDay = (dateString) => {
  const date = parseDate(dateString);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
};

const buildStreakStats = (dateStrings = [], today = toDateString()) => {
  const unique = [...new Set(dateStrings)].sort();

  if (unique.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  let bestStreak = 1;
  let running = 1;

  for (let i = 1; i < unique.length; i += 1) {
    const prev = parseDate(unique[i - 1]);
    const curr = parseDate(unique[i]);
    const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      running += 1;
      if (running > bestStreak) bestStreak = running;
    } else if (diffDays > 1) {
      running = 1;
    }
  }

  const set = new Set(unique);
  let currentStreak = 0;
  if (set.has(today)) {
    let cursor = today;
    while (set.has(cursor)) {
      currentStreak += 1;
      cursor = subtractOneDay(cursor);
    }
  }

  return { currentStreak, bestStreak };
};

const updateUserStreakStats = async (userId) => {
  const dates = await Task.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    { $unwind: '$completedDates' },
    { $group: { _id: '$completedDates' } },
    { $sort: { _id: 1 } },
  ]);

  const dateStrings = dates.map((d) => d._id);
  const { currentStreak, bestStreak } = buildStreakStats(dateStrings, toDateString());

  await User.findByIdAndUpdate(userId, { overallStreak: currentStreak, bestStreak });

  return { currentStreak, bestStreak };
};

/**
 * @desc Create a new task
 * @route POST /api/tasks
 * @access Private
 */
export const createTask = async (req, res) => {
  try {
    const { title, description, category, targetTime } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Please provide title' });
    }

    const task = new Task({
      userId: req.userId,
      title: String(title).trim(),
      description: String(description || '').trim(),
      category: String(category || 'Personal').trim(),
      targetTime: Number(targetTime) || 0,
      completedDates: [],
      currentStreak: 0,
      bestStreak: 0,
    });

    await task.save();

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Get all tasks for current user
 * @route GET /api/tasks
 * @access Private
 */
export const getTasks = async (req, res) => {
  try {
    const today = toDateString();
    const tasks = await Task.find({ userId: req.userId }).sort({ createdAt: -1 }).lean();

    const hydratedTasks = tasks.map((task) => ({
      ...task,
      completed: Array.isArray(task.completedDates) ? task.completedDates.includes(today) : false,
    }));

    res.status(200).json({
      success: true,
      count: hydratedTasks.length,
      tasks: hydratedTasks,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Get single task by ID
 * @route GET /api/tasks/:id
 * @access Private
 */
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.userId });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Update task
 * @route PUT /api/tasks/:id
 * @access Private
 */
export const updateTask = async (req, res) => {
  try {
    let task = await Task.findOne({ _id: req.params.id, userId: req.userId });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Update fields
    const updateFields = ['title', 'description', 'category', 'targetTime'];
    updateFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        task[field] = field === 'targetTime' ? Number(req.body[field]) : req.body[field];
      }
    });

    await task.save();

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      task,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Delete task
 * @route DELETE /api/tasks/:id
 * @access Private
 */
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.userId });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Also delete all task logs for this task
    // Note: You might want to implement cascade delete in the model itself

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Complete task and log in taskslogs
 * @route PATCH /api/tasks/:id/complete
 * @access Private
 */
export const completeTask = async (req, res) => {
  try {
    const { date, timeSpent = 0 } = req.body;
    const task = await Task.findOne({ _id: req.params.id, userId: req.userId });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const logDate = toDateString(date || new Date());

    if (task.completedDates.includes(logDate)) {
      return res.status(409).json({
        success: false,
        message: 'Habit is already completed for this day',
      });
    }

    task.completedDates.push(logDate);
    task.completedDates = [...new Set(task.completedDates)].sort();

    const taskStreakStats = buildStreakStats(task.completedDates, toDateString());
    task.currentStreak = taskStreakStats.currentStreak;
    task.bestStreak = taskStreakStats.bestStreak;
    task.completed = task.completedDates.includes(toDateString());
    await task.save();

    const log = await TaskLog.findOneAndUpdate(
      { userId: req.userId, taskId: task._id, date: logDate },
      {
        $set: {
          completed: true,
          timeSpent: Number(timeSpent) || 0,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const userStreakStats = await updateUserStreakStats(req.userId);

    res.status(200).json({
      success: true,
      message: 'Task completed successfully',
      task,
      log,
      userStreak: userStreakStats,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Dashboard metrics for current user
 * @route GET /api/tasks/dashboard
 * @access Private
 */
export const getDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('overallStreak bestStreak createdAt');
    const today = toDateString();

    const totalTasks = await Task.countDocuments({ userId: req.userId });
    const completedToday = await Task.countDocuments({ userId: req.userId, completedDates: today });
    const completionPercentage = totalTasks > 0 ? Math.round((completedToday / totalTasks) * 100) : 0;

    const userStreakStats = await updateUserStreakStats(req.userId);

    const dayList = [];
    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date();
      date.setUTCDate(date.getUTCDate() - i);
      const ymd = date.toISOString().slice(0, 10);
      const label = date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
      dayList.push({ date: ymd, day: label });
    }

    const weeklyAgg = await TaskLog.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.userId),
          completed: true,
          date: { $gte: dayList[0].date, $lte: dayList[dayList.length - 1].date },
        },
      },
      { $group: { _id: '$date', completed: { $sum: 1 } } },
    ]);

    const weeklyMap = new Map(weeklyAgg.map((d) => [d._id, d.completed]));
    const weeklyCompletionData = dayList.map((d) => ({ day: d.day, date: d.date, completed: weeklyMap.get(d.date) || 0 }));

    const loginDate = user?.createdAt ? new Date(user.createdAt) : new Date();
    const calendarYear = Number(req.query.year) || loginDate.getUTCFullYear();
    const calendarMonth = Number(req.query.month) || loginDate.getUTCMonth() + 1;

    const monthStart = `${calendarYear}-${String(calendarMonth).padStart(2, '0')}-01`;
    const monthEndDate = new Date(Date.UTC(calendarYear, calendarMonth, 0));
    const monthEnd = monthEndDate.toISOString().slice(0, 10);

    const monthlyCalendarData = await TaskLog.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.userId),
          completed: true,
          date: { $gte: monthStart, $lte: monthEnd },
        },
      },
      { $group: { _id: '$date', completedCount: { $sum: 1 } } },
      { $project: { _id: 0, date: '$_id', completedCount: 1 } },
      { $sort: { date: 1 } },
    ]);

    res.status(200).json({
      success: true,
      dashboard: {
        totalHabits: totalTasks,
        completedHabitsToday: completedToday,
        completionPercentage,
        overallStreak: userStreakStats.currentStreak ?? user?.overallStreak ?? 0,
        bestStreak: userStreakStats.bestStreak ?? user?.bestStreak ?? 0,
        weeklyCompletionData,
        monthlyCalendarData,
        calendarMonth,
        calendarYear,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
