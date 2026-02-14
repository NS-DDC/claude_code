import mongoose, { Schema, Document } from 'mongoose';

export interface ITodo extends Document {
  coupleId: mongoose.Types.ObjectId;
  title: string;
  completed: boolean;
  assignedTo?: mongoose.Types.ObjectId;
  dueDate?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TodoSchema = new Schema<ITodo>(
  {
    coupleId: { type: Schema.Types.ObjectId, ref: 'Couple', required: true },
    title: { type: String, required: true, maxlength: 200 },
    completed: { type: Boolean, default: false },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    dueDate: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

TodoSchema.index({ coupleId: 1, completed: 1 });

export default mongoose.models.Todo || mongoose.model<ITodo>('Todo', TodoSchema);
