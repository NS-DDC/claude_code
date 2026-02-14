'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

const speciesEmoji: Record<string, string> = {
  bunny: '🐰',
  cat: '🐱',
  dog: '🐶',
  bear: '🧸',
};

const moodEmoji: Record<string, string> = {
  happy: '😊',
  normal: '😐',
  sad: '😢',
  love: '🥰',
  sulky: '😤',
};

const moodText: Record<string, string> = {
  happy: '행복해요!',
  normal: '평범해요',
  sad: '슬퍼요...',
  love: '사랑에 빠졌어요!',
  sulky: '서운해요...',
};

const bgStyles: Record<string, string> = {
  bg_default: 'from-pastel-cream to-pastel-peach',
  bg_cherry: 'from-pink-100 to-pink-200',
  bg_beach: 'from-sky-100 to-cyan-200',
  bg_starry: 'from-indigo-200 to-purple-300',
  bg_castle: 'from-amber-100 to-rose-200',
};

export default function PetPage() {
  const { token } = useAuth();
  const [pet, setPet] = useState<any>(null);
  const [feedAnim, setFeedAnim] = useState(false);
  const [patAnim, setPatAnim] = useState(false);
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState('');

  const fetchPet = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/pet', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.pet) setPet(data.pet);
    } catch {}
  }, [token]);

  useEffect(() => {
    fetchPet();
  }, [fetchPet]);

  const feedPet = async (foodId: string) => {
    try {
      const res = await fetch('/api/pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'feed', itemId: foodId }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedAnim(true);
        setMessage(data.message);
        setTimeout(() => { setFeedAnim(false); setMessage(''); }, 2000);
        fetchPet();
      } else {
        setMessage(data.error);
        setTimeout(() => setMessage(''), 2000);
      }
    } catch {}
  };

  const patPet = async () => {
    try {
      const res = await fetch('/api/pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'pat' }),
      });
      const data = await res.json();
      if (res.ok) {
        setPatAnim(true);
        setMessage(data.message);
        setTimeout(() => { setPatAnim(false); setMessage(''); }, 2000);
        fetchPet();
      }
    } catch {}
  };

  const saveName = async () => {
    if (!newName.trim()) return;
    try {
      await fetch('/api/pet', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newName }),
      });
      setEditing(false);
      fetchPet();
    } catch {}
  };

  if (!pet) {
    return (
      <div className="px-4 pt-6 flex items-center justify-center min-h-[60vh]">
        <div className="animate-heartbeat text-5xl">🐣</div>
      </div>
    );
  }

  const bgClass = bgStyles[pet.equippedItems?.background] || bgStyles.bg_default;

  return (
    <div className="px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">🏡 우리의 공간</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-primary-500">💕 {pet.hearts}</span>
          <Link href="/dashboard/shop" className="btn-primary text-sm py-1.5 px-3">
            🛍️ 샵
          </Link>
        </div>
      </div>

      {/* Pet Display Area */}
      <div className={`card bg-gradient-to-br ${bgClass} border-0 mb-4 relative overflow-hidden`}>
        {/* Decorative elements */}
        <div className="absolute top-2 right-3 text-4xl opacity-20">✨</div>
        <div className="absolute bottom-2 left-3 text-3xl opacity-20">🌿</div>

        <div className="text-center py-6">
          {/* Pet */}
          <div
            className={`text-8xl mb-4 inline-block transition-transform ${
              patAnim ? 'animate-bounce' : feedAnim ? 'scale-110' : ''
            }`}
            onClick={patPet}
            style={{ cursor: 'pointer' }}
          >
            {speciesEmoji[pet.species] || '🐰'}
          </div>

          {/* Equipped items display */}
          <div className="flex items-center justify-center gap-1 mb-2">
            {pet.equippedItems?.hat && <span className="text-2xl">{getItemEmoji(pet.equippedItems.hat)}</span>}
            {pet.equippedItems?.outfit && <span className="text-2xl">{getItemEmoji(pet.equippedItems.outfit)}</span>}
            {pet.equippedItems?.accessory && <span className="text-2xl">{getItemEmoji(pet.equippedItems.accessory)}</span>}
          </div>

          {/* Name */}
          {editing ? (
            <div className="flex items-center justify-center gap-2">
              <input
                type="text"
                className="input-field w-32 text-center text-sm"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={10}
                placeholder="이름 입력"
              />
              <button onClick={saveName} className="text-primary-400 text-sm">확인</button>
              <button onClick={() => setEditing(false)} className="text-gray-400 text-sm">취소</button>
            </div>
          ) : (
            <button
              onClick={() => { setEditing(true); setNewName(pet.name); }}
              className="text-lg font-bold text-gray-700 hover:text-primary-500"
            >
              {pet.name} ✏️
            </button>
          )}

          {/* Mood */}
          <div className="flex items-center justify-center gap-1 mt-2">
            <span className="text-xl">{moodEmoji[pet.mood]}</span>
            <span className="text-sm text-gray-500">{moodText[pet.mood]}</span>
          </div>

          {/* Floating message */}
          {message && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 px-4 py-2 rounded-full shadow-md animate-fade-in">
              <p className="text-sm font-medium text-primary-500">{message}</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="card text-center">
          <p className="text-xs text-gray-400">레벨</p>
          <p className="text-2xl font-bold text-primary-500">Lv.{pet.level}</p>
          <div className="h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-300 to-primary-400 rounded-full transition-all"
              style={{ width: `${pet.expProgress || 0}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">EXP {pet.exp}/{pet.nextLevelExp}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-400">포만감</p>
          <p className="text-2xl font-bold text-warm-500">{pet.hunger}%</p>
          <div className="h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-warm-300 to-warm-400 rounded-full transition-all"
              style={{ width: `${pet.hunger}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">{pet.hunger < 30 ? '배고파요!' : '든든해요'}</p>
        </div>
      </div>

      {/* Quick Feed */}
      <div className="card mb-4">
        <h3 className="font-bold text-gray-700 mb-3">🍽️ 먹이 주기</h3>
        <div className="grid grid-cols-4 gap-2">
          {[
            { id: 'food_cookie', emoji: '🍪', name: '쿠키', cost: 10 },
            { id: 'food_chocolate', emoji: '🍫', name: '초콜릿', cost: 20 },
            { id: 'food_cake', emoji: '🎂', name: '케이크', cost: 30 },
            { id: 'food_special', emoji: '🍽️', name: '스페셜', cost: 100 },
          ].map((food) => (
            <button
              key={food.id}
              onClick={() => feedPet(food.id)}
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-gray-50 hover:bg-primary-50 transition-colors"
            >
              <span className="text-2xl">{food.emoji}</span>
              <span className="text-[10px] text-gray-500">{food.name}</span>
              <span className="text-[10px] text-primary-400">💕{food.cost}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Species Selection */}
      <div className="card mb-4">
        <h3 className="font-bold text-gray-700 mb-3">🐾 캐릭터 변경</h3>
        <div className="flex gap-3 justify-center">
          {Object.entries(speciesEmoji).map(([species, emoji]) => (
            <button
              key={species}
              onClick={async () => {
                await fetch('/api/pet', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ species }),
                });
                fetchPet();
              }}
              className={`text-4xl p-3 rounded-xl transition-all ${
                pet.species === species ? 'bg-primary-100 scale-110' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Growth tips */}
      <div className="card bg-pastel-cream/50 mb-4">
        <h3 className="font-bold text-gray-700 mb-2">💡 성장 팁</h3>
        <ul className="text-xs text-gray-500 space-y-1">
          <li>• 매일 질문 카드에 답변하면 하트와 경험치를 얻어요</li>
          <li>• 연애 일수가 늘어나면 자동으로 하트가 쌓여요</li>
          <li>• 먹이를 주면 포만감과 경험치가 올라가요</li>
          <li>• 질문에 소홀히 하면 {pet.name}이(가) 서운해해요</li>
        </ul>
      </div>

      <div className="bottom-nav-spacer" />
    </div>
  );
}

function getItemEmoji(itemId: string): string {
  const emojiMap: Record<string, string> = {
    hat_ribbon: '🎀', hat_crown: '👑', hat_flower: '🌸', hat_santa: '🎅',
    outfit_dress: '👗', outfit_tuxedo: '🤵', outfit_couple: '👫', outfit_wedding: '💒',
    acc_glasses: '💖', acc_wings: '👼', acc_necklace: '💝', acc_ring: '💍',
  };
  return emojiMap[itemId] || '✨';
}
