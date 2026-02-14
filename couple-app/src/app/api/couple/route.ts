import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/utils';
import Couple from '@/models/Couple';
import User from '@/models/User';

export async function PUT(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return errorResponse('인증이 필요합니다.', 401);

    await connectDB();
    const user = await User.findById(payload.userId);
    if (!user?.coupleId) return errorResponse('커플 정보가 없습니다.', 404);

    const { startDate, coupleTitle } = await req.json();
    const couple = await Couple.findById(user.coupleId);
    if (!couple) return errorResponse('커플 정보를 찾을 수 없습니다.', 404);

    if (startDate) couple.startDate = new Date(startDate);
    if (coupleTitle) couple.coupleTitle = coupleTitle;

    await couple.save();

    return jsonResponse({ couple });
  } catch (error: any) {
    console.error('Couple update error:', error);
    return errorResponse('서버 오류가 발생했습니다.', 500);
  }
}
