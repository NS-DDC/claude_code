import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/utils';
import User from '@/models/User';
import Couple from '@/models/Couple';

export async function POST(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return errorResponse('인증이 필요합니다.', 401);

    await connectDB();
    const { inviteCode, startDate } = await req.json();

    if (!inviteCode) return errorResponse('초대 코드를 입력해주세요.');

    const currentUser = await User.findById(payload.userId);
    if (!currentUser) return errorResponse('사용자를 찾을 수 없습니다.', 404);
    if (currentUser.coupleId) return errorResponse('이미 커플 연결이 되어 있습니다.');

    const partner = await User.findOne({ inviteCode: inviteCode.toUpperCase() });
    if (!partner) return errorResponse('유효하지 않은 초대 코드입니다.');
    if (partner._id.toString() === currentUser._id.toString()) {
      return errorResponse('본인의 초대 코드는 사용할 수 없습니다.');
    }
    if (partner.coupleId) return errorResponse('상대방이 이미 다른 커플과 연결되어 있습니다.');

    const couple = await Couple.create({
      user1: currentUser._id,
      user2: partner._id,
      startDate: startDate ? new Date(startDate) : new Date(),
    });

    currentUser.coupleId = couple._id;
    partner.coupleId = couple._id;
    await currentUser.save();
    await partner.save();

    return jsonResponse({
      message: '커플 연결이 완료되었습니다!',
      couple: {
        id: couple._id,
        startDate: couple.startDate,
        partner: {
          id: partner._id,
          nickname: partner.nickname,
          profileImage: partner.profileImage,
        },
      },
    }, 201);
  } catch (error: any) {
    console.error('Couple connect error:', error);
    return errorResponse('서버 오류가 발생했습니다.', 500);
  }
}
