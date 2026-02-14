import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/utils';
import User from '@/models/User';
import Event from '@/models/Event';

export async function GET(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return errorResponse('인증이 필요합니다.', 401);

    await connectDB();
    const user = await User.findById(payload.userId);
    if (!user?.coupleId) return errorResponse('커플 연결이 필요합니다.', 403);

    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const events = await Event.find({
      coupleId: user.coupleId,
      date: { $gte: startOfMonth, $lte: endOfMonth },
    }).sort({ date: 1 }).populate('createdBy', 'nickname');

    return jsonResponse({ events });
  } catch (error: any) {
    console.error('Events GET error:', error);
    return errorResponse('서버 오류가 발생했습니다.', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return errorResponse('인증이 필요합니다.', 401);

    await connectDB();
    const user = await User.findById(payload.userId);
    if (!user?.coupleId) return errorResponse('커플 연결이 필요합니다.', 403);

    const { title, description, date, endDate, color, isAllDay } = await req.json();

    if (!title || !date) {
      return errorResponse('제목과 날짜를 입력해주세요.');
    }

    const event = await Event.create({
      coupleId: user.coupleId,
      title,
      description,
      date: new Date(date),
      endDate: endDate ? new Date(endDate) : null,
      color: color || '#F37896',
      isAllDay: isAllDay ?? true,
      createdBy: user._id,
    });

    return jsonResponse({ event }, 201);
  } catch (error: any) {
    console.error('Events POST error:', error);
    return errorResponse('서버 오류가 발생했습니다.', 500);
  }
}
