import mongoose, { Schema, Document } from 'mongoose';

export interface IDailyQuestion extends Document {
  question: string;
  category: 'love' | 'fun' | 'deep' | 'dream' | 'memory';
  order: number;
}

const DailyQuestionSchema = new Schema<IDailyQuestion>({
  question: { type: String, required: true },
  category: { type: String, enum: ['love', 'fun', 'deep', 'dream', 'memory'], default: 'love' },
  order: { type: Number, required: true },
});

export default mongoose.models.DailyQuestion || mongoose.model<IDailyQuestion>('DailyQuestion', DailyQuestionSchema);

// Seed data for daily questions
export const SEED_QUESTIONS = [
  { question: '오늘 가장 행복했던 순간은?', category: 'love', order: 1 },
  { question: '상대방의 가장 좋아하는 점 3가지는?', category: 'love', order: 2 },
  { question: '둘이서 가고 싶은 여행지는 어디야?', category: 'dream', order: 3 },
  { question: '우리의 첫 만남에서 가장 기억에 남는 건?', category: 'memory', order: 4 },
  { question: '상대방이 모르는 나의 비밀 하나는?', category: 'fun', order: 5 },
  { question: '10년 후 우리는 어떤 모습일까?', category: 'dream', order: 6 },
  { question: '상대방에게 가장 고마운 순간은?', category: 'love', order: 7 },
  { question: '같이 도전해보고 싶은 것은?', category: 'fun', order: 8 },
  { question: '서로에게 하고 싶지만 못했던 말이 있어?', category: 'deep', order: 9 },
  { question: '우리만의 특별한 추억 하나를 꼽는다면?', category: 'memory', order: 10 },
  { question: '상대방의 잠버릇은 어떤 게 있어?', category: 'fun', order: 11 },
  { question: '커플로서 함께 이루고 싶은 목표는?', category: 'dream', order: 12 },
  { question: '상대방이 가장 멋있어 보일 때는?', category: 'love', order: 13 },
  { question: '가장 맛있게 먹은 음식은?', category: 'fun', order: 14 },
  { question: '서로 닮은 점과 다른 점은?', category: 'deep', order: 15 },
  { question: '상대방에게 주고 싶은 선물이 있다면?', category: 'love', order: 16 },
  { question: '둘만의 약속이나 규칙이 있어?', category: 'deep', order: 17 },
  { question: '가장 웃겼던 에피소드는?', category: 'memory', order: 18 },
  { question: '서로의 MBTI에 대해 어떻게 생각해?', category: 'fun', order: 19 },
  { question: '상대방이 없으면 가장 힘들 것 같은 이유는?', category: 'deep', order: 20 },
  { question: '기념일에 가장 하고 싶은 것은?', category: 'love', order: 21 },
  { question: '함께 보고 싶은 영화나 드라마는?', category: 'fun', order: 22 },
  { question: '나에게 상대방은 어떤 존재야?', category: 'deep', order: 23 },
  { question: '같이 살면 꼭 하고 싶은 것은?', category: 'dream', order: 24 },
  { question: '상대방의 가장 귀여운 행동은?', category: 'love', order: 25 },
  { question: '최근에 상대방 때문에 감동받은 일은?', category: 'love', order: 26 },
  { question: '둘이 함께 배우고 싶은 것이 있어?', category: 'dream', order: 27 },
  { question: '상대방의 첫인상은 어땠어?', category: 'memory', order: 28 },
  { question: '사랑한다는 말 대신 할 수 있는 표현은?', category: 'deep', order: 29 },
  { question: '우리 커플의 가장 큰 장점은?', category: 'love', order: 30 },
  { question: '상대방이 가장 좋아하는 음식은?', category: 'fun', order: 31 },
  { question: '함께한 시간 중 가장 특별한 날은?', category: 'memory', order: 32 },
  { question: '상대방에게 한 가지 소원을 빌 수 있다면?', category: 'dream', order: 33 },
  { question: '서로에 대해 새로 알게 된 점이 있어?', category: 'deep', order: 34 },
  { question: '오늘 상대방에게 한마디!', category: 'love', order: 35 },
  { question: '둘의 연애 노래를 고른다면?', category: 'fun', order: 36 },
  { question: '상대방과의 미래를 상상하면 어때?', category: 'dream', order: 37 },
  { question: '싸우고 나서 가장 먼저 드는 생각은?', category: 'deep', order: 38 },
  { question: '상대방이 나를 위해 해준 것 중 최고는?', category: 'memory', order: 39 },
  { question: '우리가 할아버지 할머니가 되어도 함께할까?', category: 'love', order: 40 },
  { question: '상대방의 요리 중 가장 맛있는 건?', category: 'fun', order: 41 },
  { question: '함께 찍은 사진 중 가장 좋아하는 건?', category: 'memory', order: 42 },
  { question: '5년 후 우리의 모습은 어떨까?', category: 'dream', order: 43 },
  { question: '사랑의 언어가 뭐라고 생각해?', category: 'deep', order: 44 },
  { question: '오늘 만약 마지막 날이라면 뭘 하고 싶어?', category: 'deep', order: 45 },
  { question: '서로 처음 좋아하게 된 계기는?', category: 'memory', order: 46 },
  { question: '상대방의 습관 중 귀여운 것은?', category: 'fun', order: 47 },
  { question: '같이 도전해보고 싶은 취미는?', category: 'dream', order: 48 },
  { question: '지금 이 순간 상대방에게 하고 싶은 말은?', category: 'love', order: 49 },
  { question: '우리의 사랑을 색깔로 표현한다면?', category: 'deep', order: 50 },
];
