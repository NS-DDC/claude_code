import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/utils';
import User from '@/models/User';
import Couple from '@/models/Couple';
import DailyQuestion, { SEED_QUESTIONS } from '@/models/DailyQuestion';
import QuestionAnswer from '@/models/QuestionAnswer';

async function ensureQuestionsSeeded() {
  const count = await DailyQuestion.countDocuments();
  if (count === 0) {
    await DailyQuestion.insertMany(SEED_QUESTIONS);
  }
}

function getTodayString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// GET: 오늘의 질문과 답변 상태 조회
export async function GET(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return errorResponse('인증이 필요합니다.', 401);

    await connectDB();
    const user = await User.findById(payload.userId);
    if (!user?.coupleId) return errorResponse('커플 연결이 필요합니다.', 403);

    await ensureQuestionsSeeded();

    const couple = await Couple.findById(user.coupleId);
    if (!couple) return errorResponse('커플 정보를 찾을 수 없습니다.', 404);

    // 오늘의 질문: 커플 시작일로부터 경과 일수 기반
    const startDate = new Date(couple.startDate);
    const now = new Date();
    const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    const totalQuestions = await DailyQuestion.countDocuments();
    const questionIndex = daysSinceStart % totalQuestions;

    const todayQuestion = await DailyQuestion.findOne({ order: questionIndex + 1 });
    if (!todayQuestion) {
      const fallback = await DailyQuestion.findOne().sort({ order: 1 });
      if (!fallback) return errorResponse('질문을 불러올 수 없습니다.', 500);
    }

    const question = todayQuestion || await DailyQuestion.findOne().sort({ order: 1 });
    const today = getTodayString();

    // 오늘의 답변 조회
    const todayAnswers = await QuestionAnswer.find({
      coupleId: user.coupleId,
      date: today,
    }).populate('userId', 'nickname profileImage');

    const myAnswer = todayAnswers.find((a) => a.userId._id.toString() === user._id.toString());
    const partnerAnswer = todayAnswers.find((a) => a.userId._id.toString() !== user._id.toString());

    // 이전 답변 기록 (최근 7일)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentAnswers = await QuestionAnswer.find({
      coupleId: user.coupleId,
      createdAt: { $gte: weekAgo },
    })
      .sort({ date: -1, createdAt: -1 })
      .populate('userId', 'nickname');

    // 답변 수 (성장 시스템에 사용)
    const totalAnswers = await QuestionAnswer.countDocuments({
      coupleId: user.coupleId,
      userId: user._id,
    });

    return jsonResponse({
      question: {
        id: question!._id,
        text: question!.question,
        category: question!.category,
      },
      date: today,
      myAnswer: myAnswer ? { answer: myAnswer.answer, createdAt: myAnswer.createdAt } : null,
      partnerAnswer: partnerAnswer
        ? {
            answer: partnerAnswer.answer,
            nickname: (partnerAnswer.userId as any).nickname,
            createdAt: partnerAnswer.createdAt,
          }
        : null,
      bothAnswered: !!myAnswer && !!partnerAnswer,
      totalAnswers,
      recentHistory: recentAnswers,
    });
  } catch (error: any) {
    console.error('Questions GET error:', error);
    return errorResponse('서버 오류가 발생했습니다.', 500);
  }
}

// POST: 오늘의 질문에 답변
export async function POST(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return errorResponse('인증이 필요합니다.', 401);

    await connectDB();
    const user = await User.findById(payload.userId);
    if (!user?.coupleId) return errorResponse('커플 연결이 필요합니다.', 403);

    const { answer, questionId, questionText } = await req.json();
    if (!answer) return errorResponse('답변을 입력해주세요.');

    const today = getTodayString();

    // 이미 오늘 답변했는지 확인
    const existing = await QuestionAnswer.findOne({
      coupleId: user.coupleId,
      userId: user._id,
      date: today,
    });
    if (existing) return errorResponse('오늘은 이미 답변했어요!');

    const questionAnswer = await QuestionAnswer.create({
      coupleId: user.coupleId,
      questionId,
      questionText,
      userId: user._id,
      answer,
      date: today,
    });

    return jsonResponse({ answer: questionAnswer }, 201);
  } catch (error: any) {
    console.error('Questions POST error:', error);
    return errorResponse('서버 오류가 발생했습니다.', 500);
  }
}
