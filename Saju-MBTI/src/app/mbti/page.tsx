'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ArrowRight, Share2, Brain, Search } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import AdBanner from '@/components/AdBanner';
import {
  calculateMBTICompatibility,
  mbtiTypes,
  analyzeDimensions,
  getLoveTip,
  MBTI_DIMENSIONS,
} from '@/lib/mbtiCompatibility';
import { storageService } from '@/lib/storageService';
import { useAuth } from '@/contexts/AuthContext';
import { MBTIType } from '@/types';
import { Share } from '@capacitor/share';

// ─── MBTI metadata ───────────────────────────────────────────────────────────

const MBTI_EMOJIS: Record<MBTIType, string> = {
  INTJ: '🦅', INTP: '🔬', ENTJ: '👑', ENTP: '💡',
  INFJ: '🌙', INFP: '🌸', ENFJ: '🌟', ENFP: '🎨',
  ISTJ: '🏛️', ISFJ: '🛡️', ESTJ: '⚖️', ESFJ: '🤝',
  ISTP: '🔧', ISFP: '🎭', ESTP: '⚡', ESFP: '🎉',
};

const MBTI_NAMES: Record<MBTIType, string> = {
  INTJ: '전략가', INTP: '논리학자', ENTJ: '통솔자', ENTP: '변론가',
  INFJ: '옹호자', INFP: '중재자', ENFJ: '선도자', ENFP: '활동가',
  ISTJ: '현실주의자', ISFJ: '수호자', ESTJ: '경영자', ESFJ: '집정관',
  ISTP: '장인', ISFP: '모험가', ESTP: '사업가', ESFP: '연예인',
};

const MBTI_DESCRIPTIONS: Record<MBTIType, string> = {
  INTJ: '상상력이 풍부하고 계획적이며 모든 것에 대한 전략을 가지고 있습니다. 독립적이고 목표 지향적입니다.',
  INTP: '혁신적인 발명가로 끊임없는 지식에 대한 갈증을 가지고 있습니다. 논리와 분석을 즐깁니다.',
  ENTJ: '대담하고 상상력이 풍부하며 의지가 강한 지도자입니다. 효율성과 목표 달성을 중시합니다.',
  ENTP: '영리하고 호기심이 많으며 지적 도전을 즐깁니다. 새로운 아이디어와 토론을 좋아합니다.',
  INFJ: '이상주의적이고 원칙주의적이며 타인을 돕는 것을 목표로 합니다. 깊은 통찰력을 지닙니다.',
  INFP: '시적이고 친절하며 이타적인 성품을 가졌습니다. 개인 가치와 내면 세계를 중시합니다.',
  ENFJ: '카리스마 있고 영감을 주는 지도자입니다. 타인의 성장을 돕고 조화를 추구합니다.',
  ENFP: '열정적이고 창의적이며 긍정적인 성격입니다. 새로운 가능성과 연결을 즐깁니다.',
  ISTJ: '신뢰할 수 있고 실용적이며 사실에 기반합니다. 책임감이 강하고 전통을 중시합니다.',
  ISFJ: '헌신적이고 따뜻하며 타인을 보호합니다. 세심하고 안정적인 환경을 만듭니다.',
  ESTJ: '뛰어난 관리자로 질서를 만듭니다. 명확한 규칙과 체계적인 접근을 선호합니다.',
  ESFJ: '배려심이 깊고 사교적이며 인기가 많습니다. 조화로운 관계와 공동체를 중시합니다.',
  ISTP: '대담하고 실용적이며 도구를 다루는 데 능숙합니다. 문제를 직접 해결하는 것을 좋아합니다.',
  ISFP: '유연하고 매력적이며 예술적 감각이 있습니다. 현재 순간을 즐기고 자유를 사랑합니다.',
  ESTP: '활동적이고 에너지 넘치며 위험을 감수합니다. 실용적이고 현재에 집중합니다.',
  ESFP: '즉흥적이고 열정적이며 사람들을 즐겁게 합니다. 삶의 기쁨을 나누는 것을 좋아합니다.',
};

// ─── Test questions ───────────────────────────────────────────────────────────

type QuestionDimension = 'EI' | 'SN' | 'TF' | 'JP';

interface Question {
  id: number;
  dimension: QuestionDimension;
  text: string;
  optionA: string;
  optionB: string;
  aLetter: string; // which letter option A maps to
  bLetter: string;
}

const QUESTIONS: Question[] = [
  // EI — 3 questions
  { id: 1, dimension: 'EI', text: '주말에 당신이 더 행복한 상황은?', optionA: '🎉 친구들과 신나는 파티', optionB: '📚 혼자 조용히 독서', aLetter: 'E', bLetter: 'I' },
  { id: 2, dimension: 'EI', text: '처음 만나는 사람과 대화할 때?', optionA: '😄 자연스럽게 말을 많이 건다', optionB: '🤔 상대가 말할 때까지 기다린다', aLetter: 'E', bLetter: 'I' },
  { id: 3, dimension: 'EI', text: '힘든 일이 있을 때 나는?', optionA: '🗣️ 친구에게 털어놓고 싶다', optionB: '🧘 혼자 조용히 정리하고 싶다', aLetter: 'E', bLetter: 'I' },
  // SN — 3 questions
  { id: 4, dimension: 'SN', text: '정보를 처리할 때 나는?', optionA: '📋 오늘 할 일 목록을 꼼꼼히 작성', optionB: '✨ 전체적인 그림과 아이디어에 집중', aLetter: 'S', bLetter: 'N' },
  { id: 5, dimension: 'SN', text: '새로운 프로젝트를 시작할 때?', optionA: '🔍 구체적인 단계와 방법을 먼저 파악', optionB: '💭 미래 가능성과 비전을 먼저 그린다', aLetter: 'S', bLetter: 'N' },
  { id: 6, dimension: 'SN', text: '문제 해결 시 선호하는 방식은?', optionA: '⚙️ 검증된 방법과 경험을 활용', optionB: '🚀 새로운 접근법을 시도해본다', aLetter: 'S', bLetter: 'N' },
  // TF — 3 questions
  { id: 7, dimension: 'TF', text: '친구가 고민을 털어놓을 때?', optionA: '🧩 논리적인 해결책을 먼저 제시한다', optionB: '💗 먼저 공감하고 위로해준다', aLetter: 'T', bLetter: 'F' },
  { id: 8, dimension: 'TF', text: '중요한 결정을 내릴 때?', optionA: '📊 장단점을 분석해 객관적으로 판단', optionB: '❤️ 내 가치관과 감정에 따라 결정', aLetter: 'T', bLetter: 'F' },
  { id: 9, dimension: 'TF', text: '갈등 상황에서 나는?', optionA: '⚖️ 사실과 논리로 해결하려 한다', optionB: '🌈 감정을 먼저 해소하고 싶다', aLetter: 'T', bLetter: 'F' },
  // JP — 3 questions
  { id: 10, dimension: 'JP', text: '여행을 준비할 때 나는?', optionA: '🗺️ 일정과 숙소를 미리 꼼꼼히 계획', optionB: '🎒 현지에서 그때그때 결정한다', aLetter: 'J', bLetter: 'P' },
  { id: 11, dimension: 'JP', text: '마감이 있는 과제가 있다면?', optionA: '📅 일찍 시작해 여유 있게 완성', optionB: '⏰ 마감 직전 집중해서 완성', aLetter: 'J', bLetter: 'P' },
  { id: 12, dimension: 'JP', text: '일상 루틴에 대해 나는?', optionA: '📌 정해진 루틴이 있어야 편하다', optionB: '🌊 그날 기분에 따라 유연하게 산다', aLetter: 'J', bLetter: 'P' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calculateTestResult(answers: Record<number, 'A' | 'B'>): MBTIType {
  const scores: Record<string, number> = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
  QUESTIONS.forEach((q) => {
    const answer = answers[q.id];
    if (answer === 'A') scores[q.aLetter]++;
    else if (answer === 'B') scores[q.bLetter]++;
  });
  const ei = scores.E >= scores.I ? 'E' : 'I';
  const sn = scores.S >= scores.N ? 'S' : 'N';
  const tf = scores.T >= scores.F ? 'T' : 'F';
  const jp = scores.J >= scores.P ? 'J' : 'P';
  return `${ei}${sn}${tf}${jp}` as MBTIType;
}

function getCompatLabel(score: number): string {
  if (score >= 80) return '찰떡 궁합';
  if (score >= 60) return '좋은 궁합';
  if (score >= 40) return '보통 궁합';
  return '노력이 필요한 궁합';
}

function getCompatColor(score: number): string {
  if (score >= 80) return 'from-yellow-400 to-orange-400';
  if (score >= 60) return 'from-green-400 to-emerald-400';
  if (score >= 40) return 'from-blue-400 to-sky-400';
  return 'from-gray-400 to-slate-400';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CircleProgress({ score }: { score: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="128" height="128" className="-rotate-90">
        <circle cx="64" cy="64" r={radius} stroke="#e5e7eb" strokeWidth="10" fill="none" />
        <motion.circle
          cx="64"
          cy="64"
          r={radius}
          stroke="url(#grad)"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-2xl font-bold text-gray-800"
        >
          {score}
        </motion.div>
        <div className="text-xs text-gray-500">점</div>
      </div>
    </div>
  );
}

function DimensionBar({
  dimension, type1, type2, match, insight,
}: {
  dimension: string; type1: string; type2: string; match: boolean; insight: string;
}) {
  const dim1 = MBTI_DIMENSIONS[type1];
  const dim2 = MBTI_DIMENSIONS[type2];
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-gray-600">{dim1?.title ?? type1}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${match ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
          {dimension}
        </span>
        <span className="text-xs font-semibold text-gray-600">{dim2?.title ?? type2}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: match ? '80%' : '45%' }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${match ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-orange-400 to-amber-500'}`}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">{insight}</p>
    </div>
  );
}

// ─── Tab 1: Compatibility ─────────────────────────────────────────────────────

function CompatibilityTab({
  myMBTI, setMyMBTI, partnerMBTI, setPartnerMBTI,
}: {
  myMBTI: MBTIType;
  setMyMBTI: (t: MBTIType) => void;
  partnerMBTI: MBTIType;
  setPartnerMBTI: (t: MBTIType) => void;
}) {
  const { user } = useAuth();
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof calculateMBTICompatibility> | null>(null);

  const handleCalculate = async () => {
    const compatResult = calculateMBTICompatibility(myMBTI, partnerMBTI);
    setResult(compatResult);
    await storageService.add({ type: 'mbti', data: compatResult }, user?.uid);
    setShowResult(true);
  };

  const handleReset = () => {
    setShowResult(false);
    setResult(null);
  };

  if (showResult && result) {
    const dimensions = analyzeDimensions(myMBTI, partnerMBTI);
    const loveTip = getLoveTip(myMBTI, partnerMBTI);
    const label = getCompatLabel(result.score);
    const colorClass = getCompatColor(result.score);

    return (
      <motion.div
        key="result"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
      >
        <GlassCard className="mb-4">
          <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">궁합 분석 결과</h2>

          {/* Types + circle */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-center">
              <div className="text-3xl mb-1">{MBTI_EMOJIS[myMBTI]}</div>
              <div className="text-2xl font-bold text-royal-gold">{myMBTI}</div>
              <div className="text-xs text-gray-500">{MBTI_NAMES[myMBTI]}</div>
            </div>
            <CircleProgress score={result.score} />
            <div className="text-center">
              <div className="text-3xl mb-1">{MBTI_EMOJIS[partnerMBTI]}</div>
              <div className="text-2xl font-bold text-pink-500">{partnerMBTI}</div>
              <div className="text-xs text-gray-500">{MBTI_NAMES[partnerMBTI]}</div>
            </div>
          </div>

          {/* Label */}
          <div className="text-center mb-4">
            <span className={`inline-block bg-gradient-to-r ${colorClass} text-white px-4 py-1.5 rounded-full font-semibold text-sm shadow`}>
              {label}
            </span>
          </div>

          {/* Dimension bars */}
          <div className="bg-white/50 rounded-xl p-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">차원별 궁합 분석</h3>
            {dimensions.map((d) => (
              <DimensionBar key={d.dimension} {...d} />
            ))}
          </div>

          {/* Love tip */}
          <div className="bg-pink-50/70 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-2">
              <Heart className="w-4 h-4 text-pink-500 mt-0.5 shrink-0 fill-pink-500" />
              <p className="text-sm text-gray-700 leading-relaxed">{loveTip}</p>
            </div>
          </div>

          {/* Communication style from existing description */}
          <div className="bg-white/50 rounded-xl p-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">상세 분석</h3>
            <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
              {result.description}
            </p>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleReset}
              className="py-3 bg-white/50 text-pastel-brown rounded-lg font-semibold text-sm"
            >
              다시 하기
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={async () => {
                try {
                  const shareText = `💕 MBTI 궁합 분석\n\n${MBTI_EMOJIS[myMBTI]} ${myMBTI} ❤️ ${MBTI_EMOJIS[partnerMBTI]} ${partnerMBTI}\n\n궁합 점수: ${result.score}점\n${label}\n\n${loveTip}`;
                  await Share.share({ title: 'MBTI 궁합', text: shareText, dialogTitle: '친구에게 공유하기' });
                } catch (e) {
                  // share not supported
                }
              }}
              className="py-3 bg-gradient-to-r from-royal-gold to-yellow-500 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 shadow"
            >
              <Share2 className="w-4 h-4" />
              공유하기
            </motion.button>
          </div>
        </GlassCard>
      </motion.div>
    );
  }

  return (
    <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <GlassCard className="mb-4">
        <div className="space-y-6">
          <div>
            <label className="block text-lg font-semibold text-gray-800 mb-3">나의 MBTI</label>
            <div className="grid grid-cols-4 gap-2">
              {mbtiTypes.map((type) => (
                <motion.button
                  key={type}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setMyMBTI(type)}
                  className={`py-2.5 rounded-lg font-semibold text-sm transition-all ${
                    myMBTI === type
                      ? 'bg-gradient-to-br from-royal-gold to-yellow-500 text-white shadow-lg'
                      : 'bg-white/50 text-pastel-brown'
                  }`}
                >
                  {type}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center">
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
              <Heart className="w-8 h-8 text-red-400 fill-red-400" />
            </motion.div>
          </div>

          <div>
            <label className="block text-lg font-semibold text-gray-800 mb-3">상대방의 MBTI</label>
            <div className="grid grid-cols-4 gap-2">
              {mbtiTypes.map((type) => (
                <motion.button
                  key={type}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setPartnerMBTI(type)}
                  className={`py-2.5 rounded-lg font-semibold text-sm transition-all ${
                    partnerMBTI === type
                      ? 'bg-gradient-to-br from-pink-500 to-red-500 text-white shadow-lg'
                      : 'bg-white/50 text-pastel-brown'
                  }`}
                >
                  {type}
                </motion.button>
              ))}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCalculate}
            className="w-full py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-semibold text-lg shadow-lg"
          >
            궁합 확인하기
            <ArrowRight className="inline w-5 h-5 ml-2" />
          </motion.button>
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="font-semibold text-gray-800 mb-2">MBTI란?</h3>
        <p className="text-sm text-pastel-brown leading-relaxed">
          Myers-Briggs Type Indicator의 약자로, 개인의 성격 유형을 16가지로 분류하는 성격 유형 검사입니다.
          각 유형은 4가지 선호 지표(E/I, S/N, T/F, J/P)의 조합으로 이루어집니다.
        </p>
      </GlassCard>
    </motion.div>
  );
}

// ─── Tab 2: Quick Test ────────────────────────────────────────────────────────

function TestTab({ onResultSelect }: { onResultSelect: (mbti: MBTIType) => void }) {
  const [answers, setAnswers] = useState<Record<number, 'A' | 'B'>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [testResult, setTestResult] = useState<MBTIType | null>(null);

  const handleAnswer = (choice: 'A' | 'B') => {
    const newAnswers = { ...answers, [QUESTIONS[currentQ].id]: choice };
    setAnswers(newAnswers);
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setTestResult(calculateTestResult(newAnswers));
    }
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentQ(0);
    setTestResult(null);
  };

  if (testResult) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <GlassCard className="text-center mb-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="text-7xl mb-3"
          >
            {MBTI_EMOJIS[testResult]}
          </motion.div>
          <h2 className="text-3xl font-bold text-royal-gold mb-1">{testResult}</h2>
          <p className="text-lg font-semibold text-gray-700 mb-3">{MBTI_NAMES[testResult]}</p>
          <p className="text-sm text-gray-600 leading-relaxed mb-6">{MBTI_DESCRIPTIONS[testResult]}</p>

          {/* Dimension breakdown with percentages */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[0, 1, 2, 3].map((i) => {
              const letter = testResult[i];
              const dim = MBTI_DIMENSIONS[letter];
              return (
                <div key={i} className="bg-white/60 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-royal-gold">{letter}</div>
                  <div className="text-xs text-gray-600 mt-1">{dim?.title ?? letter}</div>
                </div>
              );
            })}
          </div>
          {/* Per-dimension percentage bars */}
          <div className="space-y-2 mb-6 text-left">
            {(['EI', 'SN', 'TF', 'JP'] as const).map((dim) => {
              const [aLetter, bLetter] = dim.split('') as [string, string];
              const qs = QUESTIONS.filter((q) => q.dimension === dim);
              const aCount = qs.filter((q) => answers[q.id] === 'A').length;
              const total = qs.length;
              const aPct = Math.round((aCount / total) * 100);
              const bPct = 100 - aPct;
              return (
                <div key={dim}>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{aLetter} {aPct}%</span>
                    <span>{bPct}% {bLetter}</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-royal-gold to-pink-400"
                      style={{ width: `${aPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleReset}
              className="py-3 bg-white/50 text-pastel-brown rounded-lg font-semibold text-sm"
            >
              다시 테스트
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => onResultSelect(testResult)}
              className="py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg font-semibold text-sm shadow"
            >
              이 결과로 궁합 보기
            </motion.button>
          </div>
        </GlassCard>
      </motion.div>
    );
  }

  const q = QUESTIONS[currentQ];
  const progress = (currentQ / QUESTIONS.length) * 100;
  const dimLabels: Record<QuestionDimension, string> = { EI: '에너지', SN: '인식', TF: '판단', JP: '생활' };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Back button */}
      {currentQ > 0 && (
        <button
          onClick={() => setCurrentQ(currentQ - 1)}
          className="flex items-center gap-1 text-gray-400 text-sm hover:text-gray-600 transition-colors mb-3"
        >
          ← 이전 문항
        </button>
      )}
      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{currentQ + 1} / {QUESTIONS.length}</span>
          <span>{dimLabels[q.dimension]} 영역</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
            className="h-full bg-gradient-to-r from-royal-gold to-pink-500 rounded-full"
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.25 }}
        >
          <GlassCard>
            <div className="text-center mb-6">
              <span className="inline-block bg-royal-gold/20 text-royal-gold text-xs font-semibold px-3 py-1 rounded-full mb-3">
                Q{currentQ + 1}
              </span>
              <h3 className="text-lg font-semibold text-gray-800">{q.text}</h3>
            </div>

            <div className="space-y-3">
              {(['A', 'B'] as const).map((choice) => (
                <motion.button
                  key={choice}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleAnswer(choice)}
                  className="w-full py-4 px-5 bg-white/60 hover:bg-white/80 rounded-xl text-left font-medium text-gray-800 transition-all shadow-sm border border-white/50"
                >
                  <span className="inline-block w-7 h-7 rounded-full bg-gradient-to-br from-royal-gold to-yellow-400 text-white text-xs font-bold text-center leading-7 mr-3">
                    {choice}
                  </span>
                  {choice === 'A' ? q.optionA : q.optionB}
                </motion.button>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Tab 3: Type Explorer ─────────────────────────────────────────────────────

function ExplorerTab() {
  const [selected, setSelected] = useState<MBTIType | null>(null);

  return (
    <div>
      <div className="grid grid-cols-4 gap-2 mb-4">
        {mbtiTypes.map((type) => (
          <motion.button
            key={type}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelected(selected === type ? null : type)}
            className={`p-3 rounded-xl text-center transition-all ${
              selected === type
                ? 'bg-gradient-to-br from-royal-gold to-yellow-500 text-white shadow-lg'
                : 'bg-white/50 text-pastel-brown'
            }`}
          >
            <div className="text-xl mb-0.5">{MBTI_EMOJIS[type]}</div>
            <div className="text-xs font-bold">{type}</div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            key={selected}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard>
              <div className="text-center mb-4">
                <div className="text-5xl mb-2">{MBTI_EMOJIS[selected]}</div>
                <h2 className="text-2xl font-bold text-royal-gold">{selected}</h2>
                <p className="text-base font-semibold text-gray-700">{MBTI_NAMES[selected]}</p>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed mb-4">{MBTI_DESCRIPTIONS[selected]}</p>

              {/* Dimensions */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[0, 1, 2, 3].map((i) => {
                  const letter = selected[i];
                  const dim = MBTI_DIMENSIONS[letter];
                  return (
                    <div key={i} className="bg-white/60 rounded-xl p-3 text-center">
                      <div className="text-lg font-bold text-royal-gold">{letter}</div>
                      <div className="text-xs text-gray-600 mt-0.5">{dim?.title ?? letter}</div>
                      {dim?.traits.slice(0, 2).map((t) => (
                        <div key={t} className="text-xs text-gray-400 mt-0.5">{t}</div>
                      ))}
                    </div>
                  );
                })}
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelected(null)}
                className="w-full py-2.5 bg-white/50 text-pastel-brown rounded-lg text-sm font-semibold"
              >
                닫기
              </motion.button>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = 'compat' | 'test' | 'explore';

const TAB_LABELS: { id: Tab; icon: React.ReactNode; label: string }[] = [
  { id: 'compat', icon: <Heart className="w-4 h-4" />, label: '궁합 분석' },
  { id: 'test', icon: <Brain className="w-4 h-4" />, label: 'MBTI 테스트' },
  { id: 'explore', icon: <Search className="w-4 h-4" />, label: '유형 탐색' },
];

export default function MBTIPage() {
  const [activeTab, setActiveTab] = useState<Tab>('compat');
  const [myMBTI, setMyMBTI] = useState<MBTIType>('INFP');
  const [partnerMBTI, setPartnerMBTI] = useState<MBTIType>('ENFJ');

  const handleTestResultSelect = (mbti: MBTIType) => {
    setMyMBTI(mbti);
    setActiveTab('compat');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <Heart className="w-12 h-12 text-royal-gold mx-auto mb-2" />
        <h1 className="text-3xl font-bold text-gray-800">MBTI 궁합</h1>
        <p className="text-pastel-brown mt-1">찰떡궁합을 알아보세요</p>
      </motion.div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-white/40 rounded-xl p-1 mb-5 backdrop-blur">
        {TAB_LABELS.map(({ id, icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === id
                ? 'bg-white text-royal-gold shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {icon}
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden text-xs">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'compat' && (
            <CompatibilityTab
              myMBTI={myMBTI}
              setMyMBTI={setMyMBTI}
              partnerMBTI={partnerMBTI}
              setPartnerMBTI={setPartnerMBTI}
            />
          )}
          {activeTab === 'test' && <TestTab onResultSelect={handleTestResultSelect} />}
          {activeTab === 'explore' && <ExplorerTab />}
        </motion.div>
      </AnimatePresence>

      <AdBanner />
    </div>
  );
}
