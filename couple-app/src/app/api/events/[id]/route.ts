import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/utils';
import User from '@/models/User';
import Event from '@/models/Event';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return errorResponse('인증이 필요합니다.', 401);

    const { id } = await params;
    await connectDB();
    const user = await User.findById(payload.userId);
    if (!user?.coupleId) return errorResponse('커플 연결이 필요합니다.', 403);

    const body = await req.json();
    const event = await Event.findOneAndUpdate(
      { _id: id, coupleId: user.coupleId },
      { $set: body },
      { new: true }
    );

    if (!event) return errorResponse('이벤트를 찾을 수 없습니다.', 404);
    return jsonResponse({ event });
  } catch (error: any) {
    return errorResponse('서버 오류가 발생했습니다.', 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return errorResponse('인증이 필요합니다.', 401);

    const { id } = await params;
    await connectDB();
    const user = await User.findById(payload.userId);
    if (!user?.coupleId) return errorResponse('커플 연결이 필요합니다.', 403);

    const event = await Event.findOneAndDelete({
      _id: id,
      coupleId: user.coupleId,
    });

    if (!event) return errorResponse('이벤트를 찾을 수 없습니다.', 404);
    return jsonResponse({ message: '삭제되었습니다.' });
  } catch (error: any) {
    return errorResponse('서버 오류가 발생했습니다.', 500);
  }
}
