import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  coupleId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  date: Date;
  endDate?: Date;
  color: string;
  isAllDay: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    coupleId: { type: Schema.Types.ObjectId, ref: 'Couple', required: true },
    title: { type: String, required: true, maxlength: 100 },
    description: { type: String, default: '', maxlength: 500 },
    date: { type: Date, required: true },
    endDate: { type: Date, default: null },
    color: { type: String, default: '#F37896' },
    isAllDay: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

EventSchema.index({ coupleId: 1, date: 1 });

export default mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);
