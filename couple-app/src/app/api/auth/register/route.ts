import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { signToken } from '@/lib/auth';
import { jsonResponse, errorResponse, generateInviteCode } from '@/lib/utils';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email, password, nickname } = await req.json();

    if (!email || !password || !nickname) {
      return errorResponse('이메일, 비밀번호, 닉네임을 모두 입력해주세요.');
    }

    if (password.length < 6) {
      return errorResponse('비밀번호는 6자 이상이어야 합니다.');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse('이미 사용 중인 이메일입니다.');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const inviteCode = generateInviteCode();

    const user = await User.create({
      email,
      password: hashedPassword,
      nickname,
      inviteCode,
    });

    const token = signToken({ userId: user._id.toString(), email: user.email });

    return jsonResponse({
      token,
      user: {
        id: user._id,
        email: user.email,
        nickname: user.nickname,
        inviteCode: user.inviteCode,
        coupleId: user.coupleId,
      },
    }, 201);
  } catch (error: any) {
    console.error('Register error:', error);
    const msg = error?.message || '알 수 없는 오류';
    return errorResponse(`서버 오류: ${msg}`, 500);
  }
}
