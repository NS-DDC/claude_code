import mongoose, { Schema, Document } from 'mongoose';

export interface IPhoto extends Document {
  coupleId: mongoose.Types.ObjectId;
  imageUrl: string;
  thumbnail?: string;
  caption?: string;
  uploadedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PhotoSchema = new Schema<IPhoto>(
  {
    coupleId: { type: Schema.Types.ObjectId, ref: 'Couple', required: true },
    imageUrl: { type: String, required: true },
    thumbnail: { type: String, default: '' },
    caption: { type: String, default: '', maxlength: 200 },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

PhotoSchema.index({ coupleId: 1, createdAt: -1 });

export default mongoose.models.Photo || mongoose.model<IPhoto>('Photo', PhotoSchema);
