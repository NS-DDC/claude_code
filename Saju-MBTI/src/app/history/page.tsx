'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Trash2, Sparkles, Heart, Scan, AlertCircle, Star, Users, Calendar } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import AdBanner from '@/components/AdBanner';
import { storage } from '@/lib/storage';
import { HistoryRecord } from '@/types';

const typeLabels = {
  'saju': '사주 분석',
  'saju-compatibility': '사주 궁합',
  'mbti': 'MBTI 궁합',
  'fortune': '운세 스캔',
  'destiny': '운명 캐릭터',
  'destiny-compatibility': '운명 궁합',
  'daily-fortune': '일일 운세'
};

const typeIcons = {
  'saju': Sparkles,
  'saju-compatibility': Heart,
  'mbti': Heart,
  'fortune': Scan,
  'destiny': Star,
  'destiny-compatibility': Users,
  'daily-fortune': Calendar
};

const typeColors = {
  'saju': 'from-purple-400 to-pink-400',
  'saju-compatibility': 'from-red-400 to-pink-400',
  'mbti': 'from-pink-500 to-red-500',
  'fortune': 'from-blue-400 to-cyan-400',
  'destiny': 'from-yellow-400 to-amber-400',
  'destiny-compatibility': 'from-purple-500 to-pink-500',
  'daily-fortune': 'from-blue-500 to-cyan-500'
};

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<HistoryRecord | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const allHistory = storage.getAll();
    setHistory(allHistory);
  };

  const handleDelete = (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      storage.delete(id);
      loadHistory();
      if (selectedItem?.data.id === id) {
        setSelectedItem(null);
      }
    }
  };

  const handleClearAll = () => {
    if (confirm('모든 히스토리를 삭제하시겠습니까?')) {
      storage.clear();
      loadHistory();
      setSelectedItem(null);
    }
  };

  const filteredHistory = selectedType === 'all'
    ? history
    : history.filter(record => record.type === selectedType);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <History className="w-12 h-12 text-royal-gold mx-auto mb-2" />
        <h1 className="text-3xl font-bold text-gray-800">히스토리</h1>
        <p className="text-pastel-brown mt-2">내가 확인한 분석 결과</p>
      </motion.div>

      <GlassCard className="mb-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
              selectedType === 'all'
                ? 'bg-royal-gold text-white'
                : 'bg-white/50 text-pastel-brown'
            }`}
          >
            전체 ({history.length})
          </button>
          {Object.entries(typeLabels).map(([type, label]) => {
            const count = history.filter(r => r.type === type).length;
            return (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  selectedType === type
                    ? 'bg-royal-gold text-white'
                    : 'bg-white/50 text-pastel-brown'
                }`}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>

        {history.length > 0 && (
          <button
            onClick={handleClearAll}
            className="w-full mt-4 py-2 bg-red-500/20 text-red-600 rounded-lg font-semibold text-sm hover:bg-red-500/30 transition-all"
          >
            <Trash2 className="inline w-4 h-4 mr-1" />
            전체 삭제
          </button>
        )}
      </GlassCard>

      {filteredHistory.length === 0 ? (
        <GlassCard>
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-pastel-brown/50 mx-auto mb-4" />
            <p className="text-pastel-brown text-lg">
              {selectedType === 'all'
                ? '아직 분석한 기록이 없습니다.'
                : `${typeLabels[selectedType as keyof typeof typeLabels]} 기록이 없습니다.`
              }
            </p>
            <p className="text-pastel-brown text-sm mt-2">
              사주, MBTI, 운세를 확인해보세요!
            </p>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-3 mb-6">
          <AnimatePresence>
            {filteredHistory.map((record, index) => {
              const Icon = typeIcons[record.type];
              const colorClass = typeColors[record.type];

              return (
                <motion.div
                  key={record.data.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                >
                  <GlassCard hover={true}>
                    <div
                      className="cursor-pointer"
                      onClick={() => setSelectedItem(record)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-3 rounded-lg bg-gradient-to-br ${colorClass} flex-shrink-0`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 mb-1">
                            {typeLabels[record.type]}
                          </h3>
                          <p className="text-sm text-pastel-brown">
                            {formatDate(record.data.date)}
                          </p>
                          {record.type === 'saju' && 'input' in record.data && (() => {
                            const data = record.data as any;
                            return (
                              <p className="text-sm text-gray-600 mt-1 truncate">
                                {data.input.birthYear}년 {data.input.birthMonth}월 {data.input.birthDay}일
                              </p>
                            );
                          })()}
                          {record.type === 'mbti' && 'myMBTI' in record.data && (() => {
                            const data = record.data as any;
                            return (
                              <p className="text-sm text-gray-600 mt-1">
                                {data.myMBTI} ❤️ {data.partnerMBTI} ({data.score}점)
                              </p>
                            );
                          })()}
                          {record.type === 'fortune' && 'luckyNumber' in record.data && (() => {
                            const data = record.data as any;
                            return (
                              <p className="text-sm text-gray-600 mt-1 truncate">
                                행운의 숫자: {data.luckyNumber}
                              </p>
                            );
                          })()}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(record.data.id);
                          }}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-all flex-shrink-0"
                        >
                          <Trash2 className="w-5 h-5 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  {typeLabels[selectedItem.type]}
                </h2>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-pastel-brown hover:text-gray-800 text-2xl"
                >
                  ×
                </button>
              </div>

              <p className="text-sm text-pastel-brown mb-4">
                {formatDate(selectedItem.data.date)}
              </p>

              <div className="bg-white/50 rounded-lg p-4">
                {selectedItem.type === 'saju' && 'input' in selectedItem.data && (() => {
                  const data = selectedItem.data as any;
                  return (
                    <div>
                      <h3 className="font-semibold mb-2">생년월일시</h3>
                      <p className="text-gray-700 mb-4">
                        {data.input.birthYear}년 {data.input.birthMonth}월 {data.input.birthDay}일 {data.input.birthHour}시
                      </p>
                      <h3 className="font-semibold mb-2">오행 분포</h3>
                      <div className="space-y-1 mb-4">
                        {Object.entries(data.elements).map(([element, count]) => (
                          <div key={element} className="flex items-center gap-2">
                            <span className="w-12">{element}:</span>
                            <span className="font-semibold">{count as number}</span>
                          </div>
                        ))}
                      </div>
                      <h3 className="font-semibold mb-2">해석</h3>
                      <p className="text-gray-700 whitespace-pre-line">
                        {data.description}
                      </p>
                    </div>
                  );
                })()}

                {selectedItem.type === 'saju-compatibility' && 'compatibilityScore' in selectedItem.data && (() => {
                  const data = selectedItem.data as any;
                  return (
                    <div>
                      <div className="text-center mb-4">
                        <p className="text-5xl font-bold text-royal-gold mb-2">
                          {data.compatibilityScore}점
                        </p>
                        <div className="flex justify-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star} className="text-2xl">
                              {star <= Math.round(data.compatibilityScore / 20) ? '⭐' : '☆'}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-700 whitespace-pre-line">
                        {data.description}
                      </p>
                    </div>
                  );
                })()}

                {selectedItem.type === 'mbti' && 'myMBTI' in selectedItem.data && (() => {
                  const data = selectedItem.data as any;
                  return (
                    <div>
                      <div className="text-center mb-4">
                        <p className="text-2xl font-bold text-gray-800 mb-2">
                          {data.myMBTI} ❤️ {data.partnerMBTI}
                        </p>
                        <p className="text-5xl font-bold text-royal-gold mb-2">
                          {data.score}점
                        </p>
                        <div className="flex justify-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star} className="text-2xl">
                              {star <= Math.round(data.score / 20) ? '⭐' : '☆'}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-700 whitespace-pre-line">
                        {data.description}
                      </p>
                    </div>
                  );
                })()}

                {selectedItem.type === 'fortune' && 'luckyNumber' in selectedItem.data && (() => {
                  const data = selectedItem.data as any;
                  return (
                    <div className="text-center">
                      <div
                        className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center"
                        style={{ backgroundColor: data.luckyColor }}
                      >
                        <Sparkles className="w-12 h-12 text-white" />
                      </div>
                      <p className="text-lg text-gray-700 mb-4">
                        {data.message}
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-royal-gold/20 rounded-lg p-3">
                          <p className="text-sm text-pastel-brown mb-1">행운의 숫자</p>
                          <p className="text-3xl font-bold text-royal-gold">
                            {data.luckyNumber}
                          </p>
                        </div>
                        <div className="bg-purple-400/20 rounded-lg p-3">
                          <p className="text-sm text-pastel-brown mb-1">행운의 색상</p>
                          <div
                            className="w-12 h-12 rounded-full mx-auto mt-1"
                            style={{ backgroundColor: data.luckyColor }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <button
                onClick={() => setSelectedItem(null)}
                className="w-full mt-4 py-3 bg-royal-gold text-white rounded-lg font-semibold"
              >
                닫기
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AdBanner />
    </div>
  );
}
