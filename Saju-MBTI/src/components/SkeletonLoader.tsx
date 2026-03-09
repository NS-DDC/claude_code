'use client';

interface SkeletonLoaderProps {
  type: 'card' | 'text' | 'circle' | 'gauge' | 'widget';
  lines?: number;
}

export default function SkeletonLoader({ type, lines = 3 }: SkeletonLoaderProps) {
  if (type === 'card') {
    return (
      <div className="bg-white/30 backdrop-blur-md rounded-2xl border border-white/20 p-6 animate-pulse">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-white/40 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-white/40 rounded w-3/4" />
            <div className="h-3 bg-white/30 rounded w-1/2" />
          </div>
        </div>
        <div className="space-y-2">
          {Array.from({ length: lines }).map((_, i) => (
            <div key={i} className="h-3 bg-white/30 rounded" style={{ width: `${85 - i * 15}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (type === 'widget') {
    return (
      <div className="bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-2xl p-6 animate-pulse mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-white/30 rounded w-24" />
          <div className="w-6 h-6 bg-white/30 rounded" />
        </div>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-white/30 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-white/30 rounded w-2/3" />
            <div className="h-3 bg-white/20 rounded w-1/2" />
          </div>
        </div>
        <div className="bg-white/20 rounded-lg p-4">
          <div className="h-3 bg-white/30 rounded w-full mb-2" />
          <div className="h-3 bg-white/20 rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (type === 'gauge') {
    return (
      <div className="flex flex-col items-center animate-pulse">
        <div className="w-44 h-24 bg-white/30 rounded-t-full" />
        <div className="h-8 bg-white/30 rounded w-16 mt-2" />
        <div className="h-4 bg-white/20 rounded w-20 mt-2" />
      </div>
    );
  }

  if (type === 'circle') {
    return <div className="w-20 h-20 bg-white/30 rounded-full animate-pulse" />;
  }

  // text type
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 bg-white/30 rounded" style={{ width: `${90 - i * 10}%` }} />
      ))}
    </div>
  );
}
