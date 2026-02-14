'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Star, StarOff, Clock, MoreVertical, Search, Trophy, Edit3, X, Check } from 'lucide-react';
import LottoBall from './LottoBall';
import {
  getHistory,
  deleteHistory,
  toggleFavorite,
  clearHistory,
  updateHistory,
  checkAllRecordsAgainstWinning,
  type LottoRecord,
  type WinCheckResult,
} from '@/lib/storage';
const LINE_LABELS = ['A', 'B', 'C', 'D', 'E'];

interface RecordGroup {
  groupId: string;
  records: LottoRecord[];
  createdAt: string;
}

type DateGroup = {
  label: string;
  items: (LottoRecord | RecordGroup)[];
};

function groupRecords(records: LottoRecord[]): (LottoRecord | RecordGroup)[] {
  const grouped = new Map<string, LottoRecord[]>();
  const singles: LottoRecord[] = [];

  records.forEach((r) => {
    if (r.groupId) {
      const arr = grouped.get(r.groupId) || [];
      arr.push(r);
      grouped.set(r.groupId, arr);
    } else {
      singles.push(r);
    }
  });

  const allItems: { createdAt: string; item: LottoRecord | RecordGroup }[] = [];

  grouped.forEach((recs, groupId) => {
    recs.sort((a, b) => (a.lineIndex ?? 0) - (b.lineIndex ?? 0));
    allItems.push({
      createdAt: recs[0].createdAt,
      item: { groupId, records: recs, createdAt: recs[0].createdAt },
    });
  });

  singles.forEach((r) => {
    allItems.push({ createdAt: r.createdAt, item: r });
  });

  allItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return allItems.map(({ item }) => item);
}

function groupByDate(items: (LottoRecord | RecordGroup)[]): DateGroup[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  const groups: DateGroup[] = [
    { label: '오늘', items: [] },
    { label: '어제', items: [] },
    { label: '이번 주', items: [] },
    { label: '이전', items: [] },
  ];

  items.forEach((item) => {
    const created = new Date(isGroup(item) ? item.createdAt : item.createdAt);
    const createdDate = new Date(created.getFullYear(), created.getMonth(), created.getDate());

    if (createdDate.getTime() >= today.getTime()) {
      groups[0].items.push(item);
    } else if (createdDate.getTime() >= yesterday.getTime()) {
      groups[1].items.push(item);
    } else if (createdDate.getTime() >= weekAgo.getTime()) {
      groups[2].items.push(item);
    } else {
      groups[3].items.push(item);
    }
  });

  return groups.filter((g) => g.items.length > 0);
}

function isGroup(item: LottoRecord | RecordGroup): item is RecordGroup {
  return 'records' in item;
}

export default function HistoryList() {
  const [records, setRecords] = useState<LottoRecord[]>([]);
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showWinCheck, setShowWinCheck] = useState(false);
  const [winInput, setWinInput] = useState('');
  const [bonusInput, setBonusInput] = useState('');
  const [winResults, setWinResults] = useState<WinCheckResult[] | null>(null);

  const loadRecords = useCallback(() => {
    setRecords(getHistory());
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleDelete = (id: string) => {
    deleteHistory(id);
    loadRecords();
    setOpenMenuId(null);
  };

  const handleDeleteGroup = (groupId: string) => {
    const toDelete = records.filter((r) => r.groupId === groupId);
    toDelete.forEach((r) => deleteHistory(r.id));
    loadRecords();
    setOpenMenuId(null);
  };

  const handleToggleFavorite = (id: string) => {
    toggleFavorite(id);
    loadRecords();
  };

  const handleToggleFavoriteGroup = (groupId: string) => {
    const groupRecs = records.filter((r) => r.groupId === groupId);
    const allFav = groupRecs.every((r) => r.isFavorite);
    groupRecs.forEach((r) => {
      if (allFav ? r.isFavorite : !r.isFavorite) {
        toggleFavorite(r.id);
      }
    });
    loadRecords();
  };

  const handleSaveMemo = (id: string, memo: string) => {
    updateHistory(id, { memo: memo.trim() || undefined });
    loadRecords();
  };

  const handleClearAll = () => {
    if (window.confirm('모든 기록을 삭제하시겠습니까?')) {
      clearHistory();
      loadRecords();
      setWinResults(null);
    }
  };

  const handleWinCheck = () => {
    const parseNums = (input: string): number[] =>
      input.split(/[,\s]+/).map(Number).filter((n) => n >= 1 && n <= 45);

    const winNumbers = parseNums(winInput);
    const bonus = Number(bonusInput);

    if (winNumbers.length !== 6) {
      alert('당첨 번호 6개를 입력해주세요.');
      return;
    }
    if (!bonus || bonus < 1 || bonus > 45) {
      alert('보너스 번호를 입력해주세요 (1~45).');
      return;
    }

    const results = checkAllRecordsAgainstWinning(winNumbers, bonus, filter === 'favorites');
    setWinResults(results);
  };

  const favoritesCount = useMemo(() => records.filter((r) => r.isFavorite).length, [records]);

  const filteredRecords = filter === 'favorites'
    ? records.filter((r) => r.isFavorite)
    : records;

  const groupedItems = useMemo(() => groupRecords(filteredRecords), [filteredRecords]);
  const dateGroups = useMemo(() => groupByDate(groupedItems), [groupedItems]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  // 당첨 확인 결과에서 특정 record의 결과 찾기
  const getWinResult = (recordId: string): WinCheckResult | undefined =>
    winResults?.find((r) => r.recordId === recordId);

  return (
    <div className="space-y-4">
      {/* 필터 및 액션 */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => { setFilter('all'); setWinResults(null); }}
            className={`px-3 py-1.5 text-xs rounded-full transition-all ${
              filter === 'all'
                ? 'bg-gold-300 text-white font-semibold'
                : 'bg-white/60 text-gray-500 border border-white/30 dark:bg-gray-800/60 dark:text-gray-400 dark:border-gray-700'
            }`}
          >
            전체 ({records.length})
          </button>
          <button
            onClick={() => { setFilter('favorites'); setWinResults(null); }}
            className={`px-3 py-1.5 text-xs rounded-full transition-all ${
              filter === 'favorites'
                ? 'bg-gold-300 text-white font-semibold'
                : 'bg-white/60 text-gray-500 border border-white/30 dark:bg-gray-800/60 dark:text-gray-400 dark:border-gray-700'
            }`}
          >
            저장됨 ({favoritesCount})
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowWinCheck(!showWinCheck); setWinResults(null); }}
            className={`p-1.5 rounded-lg transition-colors ${showWinCheck ? 'bg-gold-100 text-gold-500' : 'text-gray-400 hover:text-gray-500'}`}
            title="당첨 확인"
          >
            <Trophy size={16} />
          </button>
          {records.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs text-red-400 hover:text-red-500 transition-colors"
            >
              전체 삭제
            </button>
          )}
        </div>
      </div>

      {/* 당첨 확인 패널 */}
      <AnimatePresence>
        {showWinCheck && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-gradient-to-br from-gold-50 to-orange-50 rounded-2xl border border-gold-200 space-y-3 dark:from-gray-800 dark:to-gray-800 dark:border-gray-700">
              <p className="text-xs font-semibold text-gold-600 dark:text-gold-400">당첨 번호 입력</p>
              <div>
                <label className="text-[10px] text-gray-500 mb-1 block">당첨 번호 6개 (쉼표 구분)</label>
                <input
                  type="text"
                  value={winInput}
                  onChange={(e) => setWinInput(e.target.value)}
                  placeholder="예: 1, 12, 23, 34, 40, 45"
                  className="w-full px-3 py-2 text-sm bg-white/80 border border-gold-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 mb-1 block">보너스 번호</label>
                <input
                  type="text"
                  value={bonusInput}
                  onChange={(e) => setBonusInput(e.target.value)}
                  placeholder="예: 7"
                  className="w-full px-3 py-2 text-sm bg-white/80 border border-gold-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                />
              </div>
              <button
                onClick={handleWinCheck}
                className="w-full py-2.5 bg-gold-400 text-white text-sm font-medium rounded-xl hover:bg-gold-500 transition-colors flex items-center justify-center gap-1.5"
              >
                <Search size={14} />
                당첨 확인하기
              </button>

              {/* 당첨 결과 요약 */}
              {winResults && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="pt-2 border-t border-gold-200 dark:border-gray-600"
                >
                  {(() => {
                    const winners = winResults.filter((r) => r.rank !== null);
                    if (winners.length === 0) {
                      return <p className="text-xs text-gray-400 text-center py-2">당첨된 번호가 없습니다.</p>;
                    }
                    return (
                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold text-gold-600">{winners.length}개 당첨!</p>
                        {[1, 2, 3, 4, 5].map((rank) => {
                          const count = winners.filter((w) => w.rank === rank).length;
                          if (count === 0) return null;
                          return (
                            <p key={rank} className="text-[11px] text-gray-500">
                              {rank}등: {count}개
                            </p>
                          );
                        })}
                      </div>
                    );
                  })()}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 기록 목록 */}
      {groupedItems.length === 0 ? (
        <div className="text-center py-16">
          <Clock className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-400 text-sm">
            {filter === 'favorites'
              ? '저장된 번호가 없습니다.'
              : '아직 생성한 번호가 없습니다.'}
          </p>
          <p className="text-gray-300 text-xs mt-1">
            {filter === 'favorites'
              ? '별 아이콘을 눌러 번호를 저장하세요'
              : '홈에서 번호를 생성해보세요!'}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {dateGroups.map((dateGroup) => (
            <div key={dateGroup.label}>
              <p className="text-[11px] font-semibold text-gray-400 mb-2 px-1 dark:text-gray-500">{dateGroup.label}</p>
              <div className="space-y-3">
                <AnimatePresence>
                  {dateGroup.items.map((item, idx) =>
                    isGroup(item) ? (
                      <GroupCard
                        key={item.groupId}
                        group={item}
                        idx={idx}
                        openMenuId={openMenuId}
                        setOpenMenuId={setOpenMenuId}
                        onDeleteGroup={handleDeleteGroup}
                        onToggleFavoriteGroup={handleToggleFavoriteGroup}
                        onDelete={handleDelete}
                        onToggleFavorite={handleToggleFavorite}
                        onSaveMemo={handleSaveMemo}
                        formatDate={formatDate}
                        getWinResult={getWinResult}
                      />
                    ) : (
                      <SingleCard
                        key={item.id}
                        record={item}
                        idx={idx}
                        openMenuId={openMenuId}
                        setOpenMenuId={setOpenMenuId}
                        onDelete={handleDelete}
                        onToggleFavorite={handleToggleFavorite}
                        onSaveMemo={handleSaveMemo}
                        formatDate={formatDate}
                        winResult={getWinResult(item.id)}
                      />
                    )
                  )}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WinBadge({ rank }: { rank: number }) {
  const colors: Record<number, string> = {
    1: 'bg-red-500 text-white',
    2: 'bg-orange-400 text-white',
    3: 'bg-gold-400 text-white',
    4: 'bg-blue-400 text-white',
    5: 'bg-green-400 text-white',
  };
  return (
    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${colors[rank] || ''}`}>
      {rank}등
    </span>
  );
}

function MemoEditor({ memo, onSave }: { memo?: string; onSave: (memo: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(memo || '');

  if (editing) {
    return (
      <div className="flex items-center gap-1.5 mt-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="메모 입력..."
          className="flex-1 px-2 py-1 text-xs bg-white/70 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
          autoFocus
          maxLength={50}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { onSave(value); setEditing(false); }
            if (e.key === 'Escape') setEditing(false);
          }}
        />
        <button onClick={() => { onSave(value); setEditing(false); }} className="p-1 text-green-500">
          <Check size={14} />
        </button>
        <button onClick={() => setEditing(false)} className="p-1 text-gray-400">
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => { setValue(memo || ''); setEditing(true); }}
      className="flex items-center gap-1 mt-1.5 text-[10px] text-gray-400 hover:text-gray-500 transition-colors"
    >
      <Edit3 size={10} />
      {memo ? <span className="text-gray-500 dark:text-gray-400">{memo}</span> : <span>메모 추가</span>}
    </button>
  );
}

function SingleCard({
  record,
  idx,
  openMenuId,
  setOpenMenuId,
  onDelete,
  onToggleFavorite,
  onSaveMemo,
  formatDate,
  winResult,
}: {
  record: LottoRecord;
  idx: number;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onSaveMemo: (id: string, memo: string) => void;
  formatDate: (iso: string) => string;
  winResult?: WinCheckResult;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: idx * 0.05 }}
      className={`relative p-4 bg-white/50 backdrop-blur-sm rounded-2xl border shadow-sm dark:bg-gray-800/50 ${
        winResult?.rank ? 'border-gold-300 shadow-gold-100' : 'border-white/30 dark:border-gray-700'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Clock size={12} />
          {formatDate(record.createdAt)}
          {winResult?.rank && <WinBadge rank={winResult.rank} />}
          {winResult && !winResult.rank && (
            <span className="text-[10px] text-gray-300">{winResult.matchCount}개 일치</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggleFavorite(record.id)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors dark:hover:bg-gray-700"
          >
            {record.isFavorite ? (
              <Star size={16} className="text-gold-400 fill-gold-400" />
            ) : (
              <StarOff size={16} className="text-gray-300" />
            )}
          </button>
          <button
            onClick={() => setOpenMenuId(openMenuId === record.id ? null : record.id)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors dark:hover:bg-gray-700"
          >
            <MoreVertical size={16} className="text-gray-400" />
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {record.numbers.map((num) => (
          <LottoBall key={num} number={num} size="sm" animate={false} />
        ))}
      </div>

      <MemoEditor memo={record.memo} onSave={(memo) => onSaveMemo(record.id, memo)} />

      <AnimatePresence>
        {openMenuId === record.id && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute right-2 top-10 bg-white rounded-xl shadow-lg border border-gray-100 z-10 overflow-hidden dark:bg-gray-800 dark:border-gray-700"
          >
            <button
              onClick={() => onDelete(record.id)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 w-full transition-colors dark:hover:bg-red-900/20"
            >
              <Trash2 size={14} />
              삭제
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function GroupCard({
  group,
  idx,
  openMenuId,
  setOpenMenuId,
  onDeleteGroup,
  onToggleFavoriteGroup,
  onDelete,
  onToggleFavorite,
  onSaveMemo,
  formatDate,
  getWinResult,
}: {
  group: RecordGroup;
  idx: number;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  onDeleteGroup: (groupId: string) => void;
  onToggleFavoriteGroup: (groupId: string) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onSaveMemo: (id: string, memo: string) => void;
  formatDate: (iso: string) => string;
  getWinResult: (recordId: string) => WinCheckResult | undefined;
}) {
  const menuKey = `group-${group.groupId}`;
  const allFav = group.records.every((r) => r.isFavorite);
  const groupWinResults = group.records.map((r) => getWinResult(r.id)).filter(Boolean) as WinCheckResult[];
  const bestRank = groupWinResults.length > 0
    ? Math.min(...groupWinResults.filter((r) => r.rank !== null).map((r) => r.rank!))
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: idx * 0.05 }}
      className={`relative p-4 bg-white/50 backdrop-blur-sm rounded-2xl border shadow-sm dark:bg-gray-800/50 ${
        bestRank ? 'border-gold-300 shadow-gold-100' : 'border-white/30 dark:border-gray-700'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Clock size={12} />
          {formatDate(group.createdAt)}
          <span className="px-1.5 py-0.5 bg-gold-100 text-gold-500 rounded-full text-[10px] font-semibold dark:bg-gold-900/30 dark:text-gold-400">
            {group.records.length}줄
          </span>
          {bestRank && <WinBadge rank={bestRank} />}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggleFavoriteGroup(group.groupId)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors dark:hover:bg-gray-700"
          >
            {allFav ? (
              <Star size={16} className="text-gold-400 fill-gold-400" />
            ) : (
              <StarOff size={16} className="text-gray-300" />
            )}
          </button>
          <button
            onClick={() => setOpenMenuId(openMenuId === menuKey ? null : menuKey)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors dark:hover:bg-gray-700"
          >
            <MoreVertical size={16} className="text-gray-400" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {group.records.map((record, lineIdx) => {
          const wr = getWinResult(record.id);
          return (
            <div key={record.id}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 w-4 flex-shrink-0">
                  {LINE_LABELS[lineIdx] ?? lineIdx + 1}
                </span>
                <div className="flex gap-1.5 flex-wrap">
                  {record.numbers.map((num) => (
                    <LottoBall key={num} number={num} size="sm" animate={false} />
                  ))}
                </div>
                {wr?.rank && <WinBadge rank={wr.rank} />}
                {wr && !wr.rank && (
                  <span className="text-[9px] text-gray-300 ml-1">{wr.matchCount}개</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 그룹 메모 - 첫 번째 레코드 기준 */}
      <MemoEditor
        memo={group.records[0]?.memo}
        onSave={(memo) => onSaveMemo(group.records[0]?.id, memo)}
      />

      <AnimatePresence>
        {openMenuId === menuKey && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute right-2 top-10 bg-white rounded-xl shadow-lg border border-gray-100 z-10 overflow-hidden dark:bg-gray-800 dark:border-gray-700"
          >
            <button
              onClick={() => onDeleteGroup(group.groupId)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 w-full transition-colors dark:hover:bg-red-900/20"
            >
              <Trash2 size={14} />
              전체 삭제
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

