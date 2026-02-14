import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/utils';
import User from '@/models/User';
import Photo from '@/models/Photo';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return errorResponse('인증이 필요합니다.', 401);

    await connectDB();
    const user = await User.findById(payload.userId);
    if (!user?.coupleId) return errorResponse('커플 연결이 필요합니다.', 403);

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const photos = await Photo.find({ coupleId: user.coupleId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('uploadedBy', 'nickname');

    const total = await Photo.countDocuments({ coupleId: user.coupleId });

    return jsonResponse({ photos, total, page, totalPages: Math.ceil(total / limit) });
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

    const formData = await req.formData();
    const file = formData.get('photo') as File;
    const caption = formData.get('caption') as string || '';

    if (!file) return errorResponse('사진을 선택해주세요.');

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.name)}`;
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    const photo = await Photo.create({
      coupleId: user.coupleId,
      imageUrl: `/uploads/${fileName}`,
      caption,
      uploadedBy: user._id,
    });

    return jsonResponse({ photo }, 201);
  } catch (error: any) {
    console.error('Photo upload error:', error);
    return errorResponse('서버 오류가 발생했습니다.', 500);
  }
}
