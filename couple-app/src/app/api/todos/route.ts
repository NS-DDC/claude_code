import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/utils';
import User from '@/models/User';
import Todo from '@/models/Todo';

export async function GET(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return errorResponse('인증이 필요합니다.', 401);

    await connectDB();
    const user = await User.findById(payload.userId);
    if (!user?.coupleId) return errorResponse('커플 연결이 필요합니다.', 403);

    const todos = await Todo.find({ coupleId: user.coupleId })
      .sort({ completed: 1, createdAt: -1 })
      .populate('createdBy', 'nickname')
      .populate('assignedTo', 'nickname');

    return jsonResponse({ todos });
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

    const { title, assignedTo, dueDate } = await req.json();
    if (!title) return errorResponse('할 일을 입력해주세요.');

    const todo = await Todo.create({
      coupleId: user.coupleId,
      title,
      assignedTo: assignedTo || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      createdBy: user._id,
    });

    const populated = await todo.populate(['createdBy', 'assignedTo']);
    return jsonResponse({ todo: populated }, 201);
  } catch (error: any) {
    return errorResponse('서버 오류가 발생했습니다.', 500);
  }
}
