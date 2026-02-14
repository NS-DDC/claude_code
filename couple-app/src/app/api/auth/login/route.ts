import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { signToken } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/utils';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    if (!email || !password) {
      return errorResponse('이메일과 비밀번호를 입력해주세요.');
    }

    const user = await User.findOne({ email });
    if (!user) {
      return errorResponse('이메일 또는 비밀번호가 일치하지 않습니다.', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return errorResponse('이메일 또는 비밀번호가 일치하지 않습니다.', 401);
    }

    const token = signToken({ userId: user._id.toString(), email: user.email });

    return jsonResponse({
      token,
      user: {
        id: user._id,
        email: user.email,
        nickname: user.nickname,
        inviteCode: user.inviteCode,
        coupleId: user.coupleId,
        profileImage: user.profileImage,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return errorResponse('서버 오류가 발생했습니다.', 500);
  }
}
