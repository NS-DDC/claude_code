import mongoose, { Schema, Document } from 'mongoose';

export interface IMoodMessage extends Document {
  coupleId: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  mood: string;
  moodEmoji: string;
  moodLabel: string;
  message?: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MoodMessageSchema = new Schema<IMoodMessage>(
  {
    coupleId: { type: Schema.Types.ObjectId, ref: 'Couple', required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    mood: { type: String, required: true },
    moodEmoji: { type: String, required: true },
    moodLabel: { type: String, required: true },
    message: { type: String, default: '', maxlength: 100 },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

MoodMessageSchema.index({ coupleId: 1, createdAt: -1 });

export default mongoose.models.MoodMessage || mongoose.model<IMoodMessage>('MoodMessage', MoodMessageSchema);
