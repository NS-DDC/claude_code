'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

const categoryLabels: Record<string, string> = {
  hat: '🎩 모자',
  outfit: '👗 의상',
  accessory: '💎 악세서리',
  background: '🖼️ 배경',
  food: '🍽️ 먹이',
};

const rarityColors: Record<string, string> = {
  common: 'text-gray-400 bg-gray-100',
  rare: 'text-blue-500 bg-blue-50',
  epic: 'text-purple-500 bg-purple-50',
  legendary: 'text-amber-500 bg-amber-50',
};

const rarityLabels: Record<string, string> = {
  common: '일반',
  rare: '레어',
  epic: '에픽',
  legendary: '전설',
};

export default function ShopPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [hearts, setHearts] = useState(0);
  const [ownedItems, setOwnedItems] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('hat');
  const [buying, setBuying] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const fetchShop = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/shop', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.items) setItems(data.items);
      if (data.hearts !== undefined) setHearts(data.hearts);
      if (data.ownedItems) setOwnedItems(data.ownedItems);
    } catch {}
  }, [token]);

  useEffect(() => {
    fetchShop();
  }, [fetchShop]);

  const buyItem = async (itemId: string) => {
    setBuying(itemId);
    try {
      const res = await fetch('/api/shop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ itemId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        fetchShop();
      } else {
        setMessage(data.error);
      }
      setTimeout(() => setMessage(''), 3000);
    } catch {} finally {
      setBuying(null);
    }
  };

  const equipItem = async (itemId: string, category: string) => {
    try {
      await fetch('/api/pet', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          equippedItems: { [category]: itemId },
        }),
      });
      setMessage('장착 완료! ✨');
      setTimeout(() => setMessage(''), 2000);
    } catch {}
  };

  const filteredItems = items.filter((item) => item.category === selectedCategory);
  const categories = ['hat', 'outfit', 'accessory', 'background', 'food'];

  return (
    <div className="px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">🛍️ 샵</h1>
        <span className="text-sm font-bold text-primary-500 bg-primary-50 px-3 py-1 rounded-full">
          💕 {hearts}
        </span>
      </div>

      {/* Message */}
      {message && (
        <div className="bg-primary-50 text-primary-500 text-sm font-medium text-center py-2 px-4 rounded-xl mb-4 animate-fade-in">
          {message}
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`text-xs px-3 py-2 rounded-full whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-primary-400 text-white'
                : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            {categoryLabels[cat]}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-2 gap-3">
        {filteredItems.map((item) => {
          const owned = ownedItems.includes(item.itemId);
          const canAfford = hearts >= item.price;
          const isPremium = item.priceType === 'premium';

          return (
            <div key={item.itemId} className="card relative">
              {/* Rarity Badge */}
              <span className={`absolute top-2 right-2 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${rarityColors[item.rarity]}`}>
                {rarityLabels[item.rarity]}
              </span>

              <div className="text-center">
                <span className="text-4xl block mb-2">{item.emoji}</span>
                <p className="font-medium text-sm text-gray-700">{item.name}</p>
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>

                {/* Price */}
                <div className="mt-2">
                  {isPremium ? (
                    <span className="text-xs font-bold text-amber-500">💎 프리미엄</span>
                  ) : (
                    <span className={`text-xs font-bold ${canAfford ? 'text-primary-400' : 'text-gray-400'}`}>
                      💕 {item.price}
                    </span>
                  )}
                </div>

                {/* Action Button */}
                <div className="mt-2">
                  {owned ? (
                    item.category !== 'food' ? (
                      <button
                        onClick={() => equipItem(item.itemId, item.category)}
                        className="text-xs bg-primary-50 text-primary-400 py-1.5 px-4 rounded-full hover:bg-primary-100 transition-colors"
                      >
                        장착하기
                      </button>
                    ) : (
                      <button
                        onClick={() => buyItem(item.itemId)}
                        className="text-xs bg-warm-50 text-warm-500 py-1.5 px-4 rounded-full hover:bg-warm-100 transition-colors"
                        disabled={buying === item.itemId || !canAfford}
                      >
                        먹이 주기
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => buyItem(item.itemId)}
                      className={`text-xs py-1.5 px-4 rounded-full transition-colors ${
                        canAfford && !isPremium
                          ? 'bg-primary-400 text-white hover:bg-primary-500'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                      disabled={buying === item.itemId || (!canAfford && !isPremium) || isPremium}
                    >
                      {buying === item.itemId ? '구매 중...' : '구매'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-3xl mb-2">🏪</p>
          <p className="text-sm text-gray-400">이 카테고리에는 아이템이 없어요</p>
        </div>
      )}

      {/* How to earn hearts */}
      <div className="card bg-pastel-cream/50 mt-4 mb-4">
        <h3 className="font-bold text-gray-700 mb-2">💕 하트 얻는 법</h3>
        <ul className="text-xs text-gray-500 space-y-1">
          <li>• 매일 질문 카드에 답변하기 (+20 하트)</li>
          <li>• 연애 일수 10일마다 (+50 하트)</li>
          <li>• 매일 접속 보너스 (+5 하트)</li>
        </ul>
      </div>

      <div className="bottom-nav-spacer" />
    </div>
  );
}
