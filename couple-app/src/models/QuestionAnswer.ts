import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestionAnswer extends Document {
  coupleId: mongoose.Types.ObjectId;
  questionId: mongoose.Types.ObjectId;
  questionText: string;
  userId: mongoose.Types.ObjectId;
  answer: string;
  date: string; // YYYY-MM-DD format
  createdAt: Date;
  updatedAt: Date;
}

const QuestionAnswerSchema = new Schema<IQuestionAnswer>(
  {
    coupleId: { type: Schema.Types.ObjectId, ref: 'Couple', required: true },
    questionId: { type: Schema.Types.ObjectId, ref: 'DailyQuestion', required: true },
    questionText: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    answer: { type: String, required: true, maxlength: 500 },
    date: { type: String, required: true },
  },
  { timestamps: true }
);

QuestionAnswerSchema.index({ coupleId: 1, date: 1 });
QuestionAnswerSchema.index({ coupleId: 1, userId: 1, date: 1 }, { unique: true });

export default mongoose.models.QuestionAnswer || mongoose.model<IQuestionAnswer>('QuestionAnswer', QuestionAnswerSchema);
