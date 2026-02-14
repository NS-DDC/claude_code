import mongoose, { Schema, Document } from 'mongoose';

export interface ICouple extends Document {
  user1: mongoose.Types.ObjectId;
  user2: mongoose.Types.ObjectId;
  startDate: Date;
  coupleTitle?: string;
  coverImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CoupleSchema = new Schema<ICouple>(
  {
    user1: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    user2: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    startDate: { type: Date, required: true },
    coupleTitle: { type: String, default: '우리 커플' },
    coverImage: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.models.Couple || mongoose.model<ICouple>('Couple', CoupleSchema);
