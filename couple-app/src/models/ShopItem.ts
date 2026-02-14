import mongoose, { Schema, Document } from 'mongoose';

export interface IShopItem extends Document {
  itemId: string;
  name: string;
  description: string;
  category: 'hat' | 'outfit' | 'accessory' | 'background' | 'food';
  price: number;
  priceType: 'hearts' | 'premium';
  emoji: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  isAvailable: boolean;
}

const ShopItemSchema = new Schema<IShopItem>({
  itemId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, enum: ['hat', 'outfit', 'accessory', 'background', 'food'], required: true },
  price: { type: Number, required: true },
  priceType: { type: String, enum: ['hearts', 'premium'], default: 'hearts' },
  emoji: { type: String, default: '🎁' },
  rarity: { type: String, enum: ['common', 'rare', 'epic', 'legendary'], default: 'common' },
  isAvailable: { type: Boolean, default: true },
});

export default mongoose.models.ShopItem || mongoose.model<IShopItem>('ShopItem', ShopItemSchema);

export const SEED_SHOP_ITEMS: Omit<IShopItem, keyof Document>[] = [
  // Hats
  { itemId: 'hat_ribbon', name: '리본 모자', description: '귀여운 리본이 달린 모자', category: 'hat', price: 50, priceType: 'hearts', emoji: '🎀', rarity: 'common', isAvailable: true },
  { itemId: 'hat_crown', name: '왕관', description: '공주님/왕자님을 위한 왕관', category: 'hat', price: 200, priceType: 'hearts', emoji: '👑', rarity: 'rare', isAvailable: true },
  { itemId: 'hat_flower', name: '꽃 화관', description: '봄 향기 가득한 화관', category: 'hat', price: 150, priceType: 'hearts', emoji: '🌸', rarity: 'rare', isAvailable: true },
  { itemId: 'hat_santa', name: '산타 모자', description: '메리 크리스마스!', category: 'hat', price: 300, priceType: 'hearts', emoji: '🎅', rarity: 'epic', isAvailable: true },

  // Outfits
  { itemId: 'outfit_dress', name: '원피스', description: '사랑스러운 분홍 원피스', category: 'outfit', price: 100, priceType: 'hearts', emoji: '👗', rarity: 'common', isAvailable: true },
  { itemId: 'outfit_tuxedo', name: '턱시도', description: '멋진 정장 차림', category: 'outfit', price: 100, priceType: 'hearts', emoji: '🤵', rarity: 'common', isAvailable: true },
  { itemId: 'outfit_couple', name: '커플룩', description: '우리만의 커플 의상', category: 'outfit', price: 350, priceType: 'hearts', emoji: '👫', rarity: 'epic', isAvailable: true },
  { itemId: 'outfit_wedding', name: '웨딩 드레스', description: '특별한 날을 위한 웨딩 의상', category: 'outfit', price: 500, priceType: 'premium', emoji: '💒', rarity: 'legendary', isAvailable: true },

  // Accessories
  { itemId: 'acc_glasses', name: '하트 안경', description: '사랑이 보이는 안경', category: 'accessory', price: 30, priceType: 'hearts', emoji: '💖', rarity: 'common', isAvailable: true },
  { itemId: 'acc_wings', name: '천사 날개', description: '내 사랑은 천사', category: 'accessory', price: 250, priceType: 'hearts', emoji: '👼', rarity: 'rare', isAvailable: true },
  { itemId: 'acc_necklace', name: '하트 목걸이', description: '반짝이는 하트 목걸이', category: 'accessory', price: 80, priceType: 'hearts', emoji: '💝', rarity: 'common', isAvailable: true },
  { itemId: 'acc_ring', name: '커플 링', description: '영원한 사랑의 상징', category: 'accessory', price: 400, priceType: 'premium', emoji: '💍', rarity: 'legendary', isAvailable: true },

  // Backgrounds
  { itemId: 'bg_default', name: '기본 배경', description: '포근한 기본 배경', category: 'background', price: 0, priceType: 'hearts', emoji: '🏠', rarity: 'common', isAvailable: true },
  { itemId: 'bg_cherry', name: '벚꽃 배경', description: '분홍빛 벚꽃이 흩날리는 배경', category: 'background', price: 150, priceType: 'hearts', emoji: '🌸', rarity: 'rare', isAvailable: true },
  { itemId: 'bg_beach', name: '해변 배경', description: '파도 소리가 들리는 해변', category: 'background', price: 200, priceType: 'hearts', emoji: '🏖️', rarity: 'rare', isAvailable: true },
  { itemId: 'bg_starry', name: '별빛 배경', description: '로맨틱한 별이 빛나는 밤', category: 'background', price: 300, priceType: 'hearts', emoji: '🌌', rarity: 'epic', isAvailable: true },
  { itemId: 'bg_castle', name: '성 배경', description: '동화 속 커플의 성', category: 'background', price: 500, priceType: 'premium', emoji: '🏰', rarity: 'legendary', isAvailable: true },

  // Food (consumable)
  { itemId: 'food_cookie', name: '쿠키', description: 'EXP +10, 포만감 +15', category: 'food', price: 10, priceType: 'hearts', emoji: '🍪', rarity: 'common', isAvailable: true },
  { itemId: 'food_cake', name: '케이크', description: 'EXP +30, 포만감 +30', category: 'food', price: 30, priceType: 'hearts', emoji: '🎂', rarity: 'common', isAvailable: true },
  { itemId: 'food_chocolate', name: '초콜릿', description: 'EXP +20, 포만감 +20', category: 'food', price: 20, priceType: 'hearts', emoji: '🍫', rarity: 'common', isAvailable: true },
  { itemId: 'food_special', name: '스페셜 디너', description: 'EXP +100, 포만감 +50', category: 'food', price: 100, priceType: 'hearts', emoji: '🍽️', rarity: 'rare', isAvailable: true },
];
