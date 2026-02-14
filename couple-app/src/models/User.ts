import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  nickname: string;
  profileImage?: string;
  coupleId?: mongoose.Types.ObjectId;
  inviteCode: string;
  birthday?: Date;
  pushSubscription?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    nickname: { type: String, required: true, maxlength: 20 },
    profileImage: { type: String, default: '' },
    coupleId: { type: Schema.Types.ObjectId, ref: 'Couple', default: null },
    inviteCode: { type: String, unique: true, required: true },
    birthday: { type: Date, default: null },
    pushSubscription: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
