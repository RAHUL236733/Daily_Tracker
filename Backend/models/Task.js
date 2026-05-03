import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a task title'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [300, 'Description cannot exceed 300 characters'],
    },
    category: {
      type: String,
      required: [true, 'Please provide a category'],
      trim: true,
      default: 'Personal',
    },
    targetTime: {
      type: Number,
      required: [true, 'Please provide a target time'],
      min: [0, 'targetTime must be non-negative'],
      default: 0,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedDates: {
      type: [String],
      default: [],
      validate: {
        validator: (dates) => dates.every((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)),
        message: 'Each completed date must be in YYYY-MM-DD format',
      },
    },
    currentStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    bestStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: 'tasks',
  }
);

// Index for faster queries by userId
taskSchema.index({ userId: 1 });
taskSchema.index({ userId: 1, completedDates: 1 });

const Task = mongoose.model('Task', taskSchema);
export default Task;
