import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/utils';
import User from '@/models/User';

// Save push subscription for user
export async function POST(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return errorResponse('인증이 필요합니다.', 401);

    await connectDB();
    const { subscription } = await req.json();

    await User.findByIdAndUpdate(payload.userId, {
      pushSubscription: JSON.stringify(subscription),
    });

    return jsonResponse({ message: '푸시 알림이 등록되었습니다.' });
  } catch (error: any) {
    return errorResponse('서버 오류가 발생했습니다.', 500);
  }
}

// Remove push subscription
export async function DELETE(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return errorResponse('인증이 필요합니다.', 401);

    await connectDB();
    await User.findByIdAndUpdate(payload.userId, {
      pushSubscription: null,
    });

    return jsonResponse({ message: '푸시 알림이 해제되었습니다.' });
  } catch (error: any) {
    return errorResponse('서버 오류가 발생했습니다.', 500);
  }
}
