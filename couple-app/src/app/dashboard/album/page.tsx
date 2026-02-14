'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';

interface Photo {
  _id: string;
  imageUrl: string;
  caption: string;
  uploadedBy: { _id: string; nickname: string };
  createdAt: string;
}

export default function AlbumPage() {
  const { token } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPhotos = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/photos', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.photos) setPhotos(data.photos);
    } catch {} finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB 이하여야 합니다.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const res = await fetch('/api/photos', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        fetchPhotos();
      }
    } catch {} finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">📸 사진 앨범</h1>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn-primary text-sm py-2 px-4"
          disabled={uploading}
        >
          {uploading ? '업로드 중...' : '+ 사진 추가'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      <p className="text-sm text-gray-400 mb-4">총 {photos.length}장의 추억</p>

      {/* Photo Grid */}
      {photos.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">📷</p>
          <p className="text-sm text-gray-400">아직 사진이 없어요</p>
          <p className="text-xs text-gray-300 mt-1">소중한 순간을 기록해보세요</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 rounded-2xl overflow-hidden">
          {photos.map((photo) => (
            <button
              key={photo._id}
              onClick={() => setSelectedPhoto(photo)}
              className="aspect-square relative overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity"
            >
              <img
                src={photo.imageUrl}
                alt={photo.caption || '사진'}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {/* Photo Viewer Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 text-white text-2xl z-10"
            onClick={() => setSelectedPhoto(null)}
          >
            ✕
          </button>
          <div className="w-full max-w-lg px-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedPhoto.imageUrl}
              alt={selectedPhoto.caption || '사진'}
              className="w-full max-h-[70vh] object-contain rounded-lg"
            />
            <div className="mt-4 text-center">
              {selectedPhoto.caption && (
                <p className="text-white mb-1">{selectedPhoto.caption}</p>
              )}
              <p className="text-gray-400 text-sm">
                {selectedPhoto.uploadedBy?.nickname} · {formatDate(selectedPhoto.createdAt)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bottom-nav-spacer" />
    </div>
  );
}
