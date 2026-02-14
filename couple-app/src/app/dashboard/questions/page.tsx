'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

const categoryColors: Record<string, string> = {
  love: 'from-pink-200 to-rose-300',
  fun: 'from-amber-200 to-orange-300',
  deep: 'from-purple-200 to-indigo-300',
  dream: 'from-sky-200 to-blue-300',
  memory: 'from-green-200 to-emerald-300',
};

const categoryLabels: Record<string, string> = {
  love: '사랑',
  fun: '재미',
  deep: '깊은 대화',
  dream: '꿈',
  memory: '추억',
};

export default function QuestionsPage() {
  const { token, user } = useAuth();
  const [question, setQuestion] = useState<any>(null);
  const [myAnswer, setMyAnswer] = useState<any>(null);
  const [partnerAnswer, setPartnerAnswer] = useState<any>(null);
  const [bothAnswered, setBothAnswered] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [revealed, setRevealed] = useState(false);

  const fetchQuestion = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/questions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.question) {
        setQuestion(data.question);
        setMyAnswer(data.myAnswer);
        setPartnerAnswer(data.partnerAnswer);
        setBothAnswered(data.bothAnswered);
        if (data.recentHistory) setHistory(data.recentHistory);
      }
    } catch {}
  }, [token]);

  useEffect(() => {
    fetchQuestion();
  }, [fetchQuestion]);

  const handleSubmit = async () => {
    if (!answerText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          answer: answerText,
          questionId: question.id,
          questionText: question.text,
        }),
      });
      if (res.ok) {
        setAnswerText('');
        fetchQuestion();
      }
    } catch {} finally {
      setSubmitting(false);
    }
  };

  if (!question) {
    return (
      <div className="px-4 pt-6 flex items-center justify-center min-h-[60vh]">
        <div className="animate-heartbeat text-4xl">💭</div>
      </div>
    );
  }

  const gradient = categoryColors[question.category] || categoryColors.love;

  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-bold text-gray-800 mb-2">💌 오늘의 질문</h1>
      <p className="text-sm text-gray-400 mb-6">매일 하나씩, 서로를 더 알아가요</p>

      {/* Question Card */}
      <div className={`card bg-gradient-to-br ${gradient} border-0 mb-6 animate-slide-up`}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium text-white/70 bg-white/20 px-2 py-0.5 rounded-full">
            {categoryLabels[question.category] || '사랑'}
          </span>
        </div>
        <p className="text-lg font-bold text-white leading-relaxed">{question.text}</p>
        <p className="text-xs text-white/60 mt-3">Q.{question.id?.slice(-3) || '?'}</p>
      </div>

      {/* Answer Section */}
      {!myAnswer ? (
        <div className="card animate-fade-in mb-4">
          <p className="text-sm font-medium text-gray-600 mb-3">나의 답변을 적어주세요</p>
          <textarea
            className="input-field min-h-[100px] resize-none"
            placeholder="진심을 담아 답변해주세요..."
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            maxLength={500}
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-400">{answerText.length}/500</span>
            <button
              onClick={handleSubmit}
              className="btn-primary py-2 px-6"
              disabled={!answerText.trim() || submitting}
            >
              {submitting ? '제출 중...' : '답변 보내기 💕'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 mb-4">
          {/* My Answer */}
          <div className="card animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-primary-200 flex items-center justify-center text-sm">
                {user?.nickname?.charAt(0)}
              </div>
              <span className="font-medium text-gray-700">{user?.nickname}</span>
              <span className="text-xs text-gray-400">나의 답변</span>
            </div>
            <p className="text-sm text-gray-600 bg-primary-50 p-3 rounded-xl">{myAnswer.answer}</p>
          </div>

          {/* Partner Answer */}
          {bothAnswered ? (
            <div className="card animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-warm-200 flex items-center justify-center text-sm">
                  {partnerAnswer?.nickname?.charAt(0) || '?'}
                </div>
                <span className="font-medium text-gray-700">{partnerAnswer?.nickname}</span>
                <span className="text-xs text-gray-400">상대방 답변</span>
              </div>
              {revealed ? (
                <p className="text-sm text-gray-600 bg-warm-50 p-3 rounded-xl animate-fade-in">
                  {partnerAnswer?.answer}
                </p>
              ) : (
                <button
                  onClick={() => setRevealed(true)}
                  className="w-full py-4 bg-gradient-to-r from-primary-100 to-warm-100 rounded-xl text-center hover:shadow-md transition-shadow"
                >
                  <span className="text-2xl">🎁</span>
                  <p className="text-sm text-gray-500 mt-1">탭하여 상대방 답변 확인하기</p>
                </button>
              )}
            </div>
          ) : (
            <div className="card text-center py-6">
              <span className="text-3xl mb-2 block">⏳</span>
              <p className="text-sm text-gray-400">상대방의 답변을 기다리는 중...</p>
              <p className="text-xs text-gray-300 mt-1">답변이 도착하면 알림을 보내드릴게요</p>
            </div>
          )}
        </div>
      )}

      {/* History Toggle */}
      <button
        onClick={() => setShowHistory(!showHistory)}
        className="w-full text-center text-sm text-primary-400 py-2 mb-4"
      >
        {showHistory ? '이전 기록 닫기 ▲' : '이전 기록 보기 ▼'}
      </button>

      {/* History */}
      {showHistory && (
        <div className="space-y-3 animate-fade-in mb-4">
          {history.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">아직 기록이 없어요</p>
          ) : (
            (() => {
              const grouped: Record<string, any[]> = {};
              history.forEach((h) => {
                if (!grouped[h.date]) grouped[h.date] = [];
                grouped[h.date].push(h);
              });
              return Object.entries(grouped).map(([date, answers]) => (
                <div key={date} className="card">
                  <p className="text-xs text-gray-400 mb-2">{date}</p>
                  <p className="text-sm font-medium text-gray-600 mb-2">{answers[0]?.questionText}</p>
                  {answers.map((a: any) => (
                    <div key={a._id} className="flex items-start gap-2 mb-1">
                      <span className="text-xs text-primary-400 font-medium min-w-[40px]">
                        {(a.userId as any)?.nickname}
                      </span>
                      <span className="text-xs text-gray-500">{a.answer}</span>
                    </div>
                  ))}
                </div>
              ));
            })()
          )}
        </div>
      )}

      <div className="bottom-nav-spacer" />
    </div>
  );
}
