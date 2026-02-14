import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/utils';
import User from '@/models/User';
import Message from '@/models/Message';

export async function GET(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return errorResponse('인증이 필요합니다.', 401);

    await connectDB();
    const user = await User.findById(payload.userId);
    if (!user?.coupleId) return errorResponse('커플 연결이 필요합니다.', 403);

    const { searchParams } = new URL(req.url);
    const before = searchParams.get('before');
    const limit = parseInt(searchParams.get('limit') || '50');

    const query: any = { coupleId: user.coupleId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('sender', 'nickname profileImage');

    // Mark unread messages as read
    await Message.updateMany(
      {
        coupleId: user.coupleId,
        sender: { $ne: user._id },
        readBy: { $nin: [user._id] },
      },
      { $addToSet: { readBy: user._id } }
    );

    return jsonResponse({ messages: messages.reverse() });
  } catch (error: any) {
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

    const { content, messageType } = await req.json();
    if (!content) return errorResponse('메시지를 입력해주세요.');

    const message = await Message.create({
      coupleId: user.coupleId,
      sender: user._id,
      content,
      messageType: messageType || 'text',
      readBy: [user._id],
    });

    const populated = await message.populate('sender', 'nickname profileImage');
    return jsonResponse({ message: populated }, 201);
  } catch (error: any) {
    return errorResponse('서버 오류가 발생했습니다.', 500);
  }
}
