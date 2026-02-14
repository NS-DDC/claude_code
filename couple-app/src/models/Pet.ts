import mongoose, { Schema, Document } from 'mongoose';

export interface IPet extends Document {
  coupleId: mongoose.Types.ObjectId;
  name: string;
  species: 'bunny' | 'cat' | 'dog' | 'bear';
  level: number;
  exp: number;
  mood: 'happy' | 'normal' | 'sad' | 'love' | 'sulky';
  hunger: number; // 0-100
  hearts: number; // 화폐 (하트)
  equippedItems: {
    hat?: string;
    outfit?: string;
    accessory?: string;
    background?: string;
  };
  ownedItems: string[];
  lastFed: Date;
  lastInteraction: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PetSchema = new Schema<IPet>(
  {
    coupleId: { type: Schema.Types.ObjectId, ref: 'Couple', required: true, unique: true },
    name: { type: String, default: '러브', maxlength: 10 },
    species: { type: String, enum: ['bunny', 'cat', 'dog', 'bear'], default: 'bunny' },
    level: { type: Number, default: 1 },
    exp: { type: Number, default: 0 },
    mood: { type: String, enum: ['happy', 'normal', 'sad', 'love', 'sulky'], default: 'happy' },
    hunger: { type: Number, default: 80, min: 0, max: 100 },
    hearts: { type: Number, default: 100 },
    equippedItems: {
      hat: { type: String, default: null },
      outfit: { type: String, default: null },
      accessory: { type: String, default: null },
      background: { type: String, default: 'bg_default' },
    },
    ownedItems: [{ type: String }],
    lastFed: { type: Date, default: Date.now },
    lastInteraction: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.Pet || mongoose.model<IPet>('Pet', PetSchema);

// Level thresholds
export const LEVEL_EXP = [0, 100, 250, 500, 850, 1300, 1900, 2600, 3500, 4500, 5800];

export function getLevel(exp: number): number {
  for (let i = LEVEL_EXP.length - 1; i >= 0; i--) {
    if (exp >= LEVEL_EXP[i]) return i + 1;
  }
  return 1;
}

export function getExpForNextLevel(level: number): number {
  if (level >= LEVEL_EXP.length) return LEVEL_EXP[LEVEL_EXP.length - 1] * 2;
  return LEVEL_EXP[level];
}

// Mood calculation based on recent interactions
export function calculateMood(pet: IPet, partnerAnsweredToday: boolean): IPet['mood'] {
  const hoursSinceInteraction = (Date.now() - new Date(pet.lastInteraction).getTime()) / (1000 * 60 * 60);

  if (hoursSinceInteraction > 72) return 'sad';
  if (hoursSinceInteraction > 48) return 'sulky';
  if (partnerAnsweredToday && hoursSinceInteraction < 12) return 'love';
  if (pet.hunger < 30) return 'sulky';
  if (pet.hunger > 70) return 'happy';
  return 'normal';
}
