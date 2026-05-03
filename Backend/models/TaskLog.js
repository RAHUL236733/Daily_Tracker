import mongoose from 'mongoose';

const taskLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    date: {
      type: String,
      required: [true, 'Please provide a date'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format'],
    },
    completed: {
      type: Boolean,
      default: false,
    },
    timeSpent: {
      type: Number, // in minutes
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'taskslogs',
  }
);

// Compound index for userId and date queries
taskLogSchema.index({ userId: 1, date: 1 });
taskLogSchema.index({ userId: 1, taskId: 1, date: 1 }, { unique: true });

const TaskLog = mongoose.model('TaskLog', taskLogSchema);
export default TaskLog;
