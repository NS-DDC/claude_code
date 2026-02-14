import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/utils';
import User from '@/models/User';
import Pet, { getLevel, getExpForNextLevel, calculateMood } from '@/models/Pet';
import QuestionAnswer from '@/models/QuestionAnswer';

// GET: 펫 정보 조회
export async function GET(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return errorResponse('인증이 필요합니다.', 401);

    await connectDB();
    const user = await User.findById(payload.userId);
    if (!user?.coupleId) return errorResponse('커플 연결이 필요합니다.', 403);

    let pet = await Pet.findOne({ coupleId: user.coupleId });

    // 펫이 없으면 생성
    if (!pet) {
      pet = await Pet.create({
        coupleId: user.coupleId,
        name: '러브',
        species: 'bunny',
      });
    }

    // 시간에 따른 포만감 감소
    const hoursSinceLastFed = (Date.now() - new Date(pet.lastFed).getTime()) / (1000 * 60 * 60);
    const hungerDecrease = Math.floor(hoursSinceLastFed * 2); // 시간당 2씩 감소
    pet.hunger = Math.max(0, pet.hunger - hungerDecrease);

    // 오늘 질문 답변 여부 확인
    const today = new Date().toISOString().split('T')[0];
    const partnerAnswered = await QuestionAnswer.findOne({
      coupleId: user.coupleId,
      userId: { $ne: user._id },
      date: today,
    });

    // 기분 계산
    pet.mood = calculateMood(pet, !!partnerAnswered);
    await pet.save();

    const level = getLevel(pet.exp);
    const nextLevelExp = getExpForNextLevel(level);
    const currentLevelExp = level > 1 ? getExpForNextLevel(level - 1) : 0;

    return jsonResponse({
      pet: {
        id: pet._id,
        name: pet.name,
        species: pet.species,
        level,
        exp: pet.exp,
        expProgress: ((pet.exp - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100,
        nextLevelExp,
        mood: pet.mood,
        hunger: pet.hunger,
        hearts: pet.hearts,
        equippedItems: pet.equippedItems,
        ownedItems: pet.ownedItems,
      },
    });
  } catch (error: any) {
    console.error('Pet GET error:', error);
    return errorResponse('서버 오류가 발생했습니다.', 500);
  }
}

// PUT: 펫 정보 수정 (이름 변경, 종 변경, 아이템 장착)
export async function PUT(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return errorResponse('인증이 필요합니다.', 401);

    await connectDB();
    const user = await User.findById(payload.userId);
    if (!user?.coupleId) return errorResponse('커플 연결이 필요합니다.', 403);

    const body = await req.json();
    const pet = await Pet.findOne({ coupleId: user.coupleId });
    if (!pet) return errorResponse('펫을 찾을 수 없습니다.', 404);

    if (body.name) pet.name = body.name;
    if (body.species) pet.species = body.species;
    if (body.equippedItems) {
      Object.entries(body.equippedItems).forEach(([key, value]) => {
        if (value === null || pet.ownedItems.includes(value as string) || key === 'background') {
          (pet.equippedItems as any)[key] = value;
        }
      });
    }

    await pet.save();
    return jsonResponse({ pet });
  } catch (error: any) {
    return errorResponse('서버 오류가 발생했습니다.', 500);
  }
}

// POST: 펫 먹이 주기 / 상호작용
export async function POST(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return errorResponse('인증이 필요합니다.', 401);

    await connectDB();
    const user = await User.findById(payload.userId);
    if (!user?.coupleId) return errorResponse('커플 연결이 필요합니다.', 403);

    const pet = await Pet.findOne({ coupleId: user.coupleId });
    if (!pet) return errorResponse('펫을 찾을 수 없습니다.', 404);

    const { action, itemId } = await req.json();

    if (action === 'feed') {
      const foodItems: Record<string, { exp: number; hunger: number; cost: number }> = {
        food_cookie: { exp: 10, hunger: 15, cost: 10 },
        food_cake: { exp: 30, hunger: 30, cost: 30 },
        food_chocolate: { exp: 20, hunger: 20, cost: 20 },
        food_special: { exp: 100, hunger: 50, cost: 100 },
      };

      const food = foodItems[itemId];
      if (!food) return errorResponse('유효하지 않은 음식입니다.');
      if (pet.hearts < food.cost) return errorResponse('하트가 부족합니다.');

      pet.hearts -= food.cost;
      pet.exp += food.exp;
      pet.hunger = Math.min(100, pet.hunger + food.hunger);
      pet.level = getLevel(pet.exp);
      pet.lastFed = new Date();
      pet.lastInteraction = new Date();
      await pet.save();

      return jsonResponse({
        message: `${pet.name}에게 먹이를 주었어요!`,
        expGained: food.exp,
        hungerRestored: food.hunger,
        pet: { level: pet.level, exp: pet.exp, hunger: pet.hunger, hearts: pet.hearts },
      });
    }

    if (action === 'pat') {
      // 하루 3번까지 쓰다듬기 가능
      pet.exp += 5;
      pet.level = getLevel(pet.exp);
      pet.lastInteraction = new Date();
      await pet.save();

      return jsonResponse({
        message: `${pet.name}이(가) 좋아해요! 💕`,
        expGained: 5,
        pet: { level: pet.level, exp: pet.exp },
      });
    }

    return errorResponse('유효하지 않은 액션입니다.');
  } catch (error: any) {
    return errorResponse('서버 오류가 발생했습니다.', 500);
  }
}
