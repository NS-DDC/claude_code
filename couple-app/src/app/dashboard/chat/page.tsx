'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

const moodCategories = [
  {
    label: '사랑',
    moods: [
      { mood: 'love', emoji: '🥰', label: '사랑해' },
      { mood: 'miss', emoji: '💕', label: '보고싶어' },
      { mood: 'kiss', emoji: '😘', label: '뽀뽀' },
      { mood: 'hug', emoji: '🤗', label: '안아줘' },
      { mood: 'heart', emoji: '❤️', label: '내 마음이야' },
    ],
  },
  {
    label: '기분',
    moods: [
      { mood: 'happy', emoji: '😊', label: '기분 좋아' },
      { mood: 'excited', emoji: '🤩', label: '신나!' },
      { mood: 'tired', emoji: '😴', label: '졸려...' },
      { mood: 'hungry', emoji: '🍽️', label: '배고파' },
      { mood: 'bored', emoji: '😐', label: '심심해' },
    ],
  },
  {
    label: '응원',
    moods: [
      { mood: 'cheer', emoji: '💪', label: '화이팅!' },
      { mood: 'proud', emoji: '👏', label: '잘했어!' },
      { mood: 'goodnight', emoji: '🌙', label: '잘 자' },
      { mood: 'goodmorning', emoji: '☀️', label: '좋은 아침' },
      { mood: 'thankyou', emoji: '🙏', label: '고마워' },
    ],
  },
  {
    label: '귀여움',
    moods: [
      { mood: 'pout', emoji: '🥺', label: '삐졌어' },
      { mood: 'shy', emoji: '😊', label: '부끄러워' },
      { mood: 'angry', emoji: '😤', label: '화났어!' },
      { mood: 'cry', emoji: '🥲', label: '울고싶어' },
      { mood: 'surprise', emoji: '😲', label: '깜짝!' },
    ],
  },
];

export default function MoodPage() {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedMood, setSelectedMood] = useState<any>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showPicker, setShowPicker] = useState(true);
  const [sentAnimation, setSentAnimation] = useState(false);

  const fetchMoods = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/mood', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
    } catch {}
  }, [token]);

  useEffect(() => {
    fetchMoods();
    const interval = setInterval(fetchMoods, 10000);
    return () => clearInterval(interval);
  }, [fetchMoods]);

  const sendMood = async () => {
    if (!selectedMood || sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/mood', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mood: selectedMood.mood,
          moodEmoji: selectedMood.emoji,
          moodLabel: selectedMood.label,
          message: customMessage,
        }),
      });
      if (res.ok) {
        setSentAnimation(true);
        setSelectedMood(null);
        setCustomMessage('');
        setTimeout(() => {
          setSentAnimation(false);
          setShowPicker(true);
        }, 2000);
        fetchMoods();
      }
    } catch {} finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? '오후' : '오전';
    return `${ampm} ${h % 12 || 12}:${m}`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-bold text-gray-800 mb-2">💌 기분 전송</h1>
      <p className="text-sm text-gray-400 mb-6">지금의 기분을 상대방에게 보내보세요</p>

      {/* Sent Animation */}
      {sentAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 shadow-xl text-center animate-slide-up">
            <div className="text-6xl mb-3 animate-bounce">💌</div>
            <p className="font-bold text-gray-700">기분을 보냈어요!</p>
            <p className="text-sm text-gray-400 mt-1">상대방에게 알림이 전송됩니다</p>
          </div>
        </div>
      )}

      {/* Mood Picker */}
      {showPicker && (
        <div className="space-y-4 mb-6">
          {moodCategories.map((category) => (
            <div key={category.label}>
              <p className="text-xs font-medium text-gray-400 mb-2">{category.label}</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {category.moods.map((mood) => (
                  <button
                    key={mood.mood}
                    onClick={() => {
                      setSelectedMood(mood);
                      setShowPicker(false);
                    }}
                    className={`flex flex-col items-center gap-1 min-w-[64px] p-3 rounded-2xl transition-all ${
                      selectedMood?.mood === mood.mood
                        ? 'bg-primary-100 scale-105'
                        : 'bg-white hover:bg-gray-50'
                    } shadow-sm`}
                  >
                    <span className="text-3xl">{mood.emoji}</span>
                    <span className="text-[10px] text-gray-500 whitespace-nowrap">{mood.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected mood + send */}
      {selectedMood && !showPicker && (
        <div className="card mb-6 animate-slide-up text-center">
          <div className="text-6xl mb-3 animate-bounce">{selectedMood.emoji}</div>
          <p className="font-bold text-gray-700 text-lg mb-1">{selectedMood.label}</p>

          <input
            type="text"
            className="input-field text-center mt-3"
            placeholder="한마디 추가하기 (선택)"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            maxLength={100}
          />

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => { setSelectedMood(null); setShowPicker(true); }}
              className="btn-secondary flex-1"
            >
              다시 고르기
            </button>
            <button
              onClick={sendMood}
              className="btn-primary flex-1"
              disabled={sending}
            >
              {sending ? '전송 중...' : '보내기 💌'}
            </button>
          </div>
        </div>
      )}

      {/* Recent Mood History */}
      <div className="mb-4">
        <h2 className="font-bold text-gray-700 mb-3">최근 기분 기록</h2>
        {messages.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-3xl mb-2">💭</p>
            <p className="text-sm text-gray-400">아직 주고받은 기분이 없어요</p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((msg) => {
              const isMe = msg.sender._id === user?.id;
              return (
                <div
                  key={msg._id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div
                    className={`max-w-[280px] p-3 rounded-2xl ${
                      isMe
                        ? 'bg-primary-50 rounded-br-md'
                        : 'bg-white shadow-sm rounded-bl-md'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{msg.moodEmoji}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-700">{msg.moodLabel}</p>
                        {msg.message && (
                          <p className="text-xs text-gray-500 mt-0.5">{msg.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-gray-300">
                        {msg.sender.nickname}
                      </span>
                      <span className="text-[10px] text-gray-300">
                        {formatDate(msg.createdAt)} {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bottom-nav-spacer" />
    </div>
  );
}
