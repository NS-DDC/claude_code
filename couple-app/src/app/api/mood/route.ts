import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/utils';
import User from '@/models/User';
import MoodMessage from '@/models/MoodMessage';

// GET: 기분 메시지 조회
export async function GET(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return errorResponse('인증이 필요합니다.', 401);

    await connectDB();
    const user = await User.findById(payload.userId);
    if (!user?.coupleId) return errorResponse('커플 연결이 필요합니다.', 403);

    const messages = await MoodMessage.find({ coupleId: user.coupleId })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('sender', 'nickname profileImage');

    // 읽지 않은 메시지 읽음 처리
    await MoodMessage.updateMany(
      {
        coupleId: user.coupleId,
        sender: { $ne: user._id },
        read: false,
      },
      { read: true }
    );

    // 읽지 않은 수
    const unreadCount = await MoodMessage.countDocuments({
      coupleId: user.coupleId,
      sender: { $ne: user._id },
      read: false,
    });

    return jsonResponse({ messages: messages.reverse(), unreadCount });
  } catch (error: any) {
    return errorResponse('서버 오류가 발생했습니다.', 500);
  }
}

// POST: 기분 전송
export async function POST(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return errorResponse('인증이 필요합니다.', 401);

    await connectDB();
    const user = await User.findById(payload.userId);
    if (!user?.coupleId) return errorResponse('커플 연결이 필요합니다.', 403);

    const { mood, moodEmoji, moodLabel, message } = await req.json();
    if (!mood || !moodEmoji) return errorResponse('기분을 선택해주세요.');

    const moodMsg = await MoodMessage.create({
      coupleId: user.coupleId,
      sender: user._id,
      mood,
      moodEmoji,
      moodLabel: moodLabel || mood,
      message: message || '',
    });

    const populated = await moodMsg.populate('sender', 'nickname profileImage');

    // TODO: 여기서 상대방에게 푸시 알림 전송
    // sendPushNotification(partnerId, `${user.nickname}님이 기분을 보냈어요: ${moodEmoji} ${moodLabel}`)

    return jsonResponse({ mood: populated }, 201);
  } catch (error: any) {
    return errorResponse('서버 오류가 발생했습니다.', 500);
  }
}
