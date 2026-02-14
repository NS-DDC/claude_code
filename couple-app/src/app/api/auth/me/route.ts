import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/utils';
import User from '@/models/User';
import Couple from '@/models/Couple';

export async function GET(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) {
      return errorResponse('인증이 필요합니다.', 401);
    }

    await connectDB();
    const user = await User.findById(payload.userId).select('-password');
    if (!user) {
      return errorResponse('사용자를 찾을 수 없습니다.', 404);
    }

    let couple = null;
    let partner = null;
    if (user.coupleId) {
      couple = await Couple.findById(user.coupleId);
      if (couple) {
        const partnerId = couple.user1.toString() === user._id.toString()
          ? couple.user2
          : couple.user1;
        partner = await User.findById(partnerId).select('nickname profileImage email');
      }
    }

    return jsonResponse({
      user: {
        id: user._id,
        email: user.email,
        nickname: user.nickname,
        inviteCode: user.inviteCode,
        coupleId: user.coupleId,
        profileImage: user.profileImage,
        birthday: user.birthday,
      },
      couple: couple ? {
        id: couple._id,
        startDate: couple.startDate,
        coupleTitle: couple.coupleTitle,
        coverImage: couple.coverImage,
      } : null,
      partner: partner ? {
        id: partner._id,
        nickname: partner.nickname,
        profileImage: partner.profileImage,
      } : null,
    });
  } catch (error: any) {
    console.error('Me error:', error);
    return errorResponse('서버 오류가 발생했습니다.', 500);
  }
}
