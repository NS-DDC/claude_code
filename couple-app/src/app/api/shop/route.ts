import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/utils';
import User from '@/models/User';
import Pet from '@/models/Pet';
import ShopItem, { SEED_SHOP_ITEMS } from '@/models/ShopItem';

async function ensureShopSeeded() {
  const count = await ShopItem.countDocuments();
  if (count === 0) {
    await ShopItem.insertMany(SEED_SHOP_ITEMS);
  }
}

// GET: 샵 아이템 목록 조회
export async function GET(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return errorResponse('인증이 필요합니다.', 401);

    await connectDB();
    await ensureShopSeeded();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    const query: any = { isAvailable: true };
    if (category) query.category = category;

    const items = await ShopItem.find(query).sort({ category: 1, price: 1 });

    const user = await User.findById(payload.userId);
    let pet = null;
    if (user?.coupleId) {
      pet = await Pet.findOne({ coupleId: user.coupleId });
    }

    return jsonResponse({
      items,
      hearts: pet?.hearts || 0,
      ownedItems: pet?.ownedItems || [],
    });
  } catch (error: any) {
    return errorResponse('서버 오류가 발생했습니다.', 500);
  }
}

// POST: 아이템 구매
export async function POST(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return errorResponse('인증이 필요합니다.', 401);

    await connectDB();
    const user = await User.findById(payload.userId);
    if (!user?.coupleId) return errorResponse('커플 연결이 필요합니다.', 403);

    const { itemId } = await req.json();
    if (!itemId) return errorResponse('아이템을 선택해주세요.');

    const item = await ShopItem.findOne({ itemId, isAvailable: true });
    if (!item) return errorResponse('존재하지 않는 아이템입니다.', 404);

    const pet = await Pet.findOne({ coupleId: user.coupleId });
    if (!pet) return errorResponse('펫을 찾을 수 없습니다.', 404);

    // 이미 소유한 아이템인지 확인 (소모품 제외)
    if (item.category !== 'food' && pet.ownedItems.includes(itemId)) {
      return errorResponse('이미 소유한 아이템입니다.');
    }

    if (item.priceType === 'hearts') {
      if (pet.hearts < item.price) return errorResponse('하트가 부족합니다.');
      pet.hearts -= item.price;
    } else {
      // Premium items - 실제 결제 시스템 연동 필요
      return errorResponse('프리미엄 아이템은 결제가 필요합니다. (준비 중)');
    }

    if (item.category !== 'food') {
      pet.ownedItems.push(itemId);
    }

    await pet.save();

    return jsonResponse({
      message: `${item.name}을(를) 구매했어요! 🎉`,
      hearts: pet.hearts,
      ownedItems: pet.ownedItems,
    });
  } catch (error: any) {
    return errorResponse('서버 오류가 발생했습니다.', 500);
  }
}
