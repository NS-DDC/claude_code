'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ImagePlus, Trash2, X, Ticket } from 'lucide-react';
import { takeTicketPhoto, pickFromGallery } from '@/lib/camera';
import { getTicketPhotos, addTicketPhoto, deleteTicketPhoto, type TicketPhoto } from '@/lib/storage';

export default function TicketCamera() {
  const [photos, setPhotos] = useState<TicketPhoto[]>([]);
  const [viewPhoto, setViewPhoto] = useState<TicketPhoto | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadPhotos = useCallback(() => {
    setPhotos(getTicketPhotos());
  }, []);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const handleTakePhoto = async () => {
    setIsLoading(true);
    try {
      const dataUrl = await takeTicketPhoto();
      if (dataUrl) {
        addTicketPhoto(dataUrl);
        loadPhotos();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickGallery = async () => {
    setIsLoading(true);
    try {
      const dataUrl = await pickFromGallery();
      if (dataUrl) {
        addTicketPhoto(dataUrl);
        loadPhotos();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('이 사진을 삭제하시겠습니까?')) {
      deleteTicketPhoto(id);
      loadPhotos();
      if (viewPhoto?.id === id) setViewPhoto(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center gap-2">
        <Ticket size={16} className="text-mint-500" />
        <h2 className="text-sm font-semibold text-gray-700">복권 사진 보관</h2>
        <span className="text-[10px] text-gray-400">({photos.length}/10)</span>
      </div>

      {/* 촬영/갤러리 버튼 */}
      <div className="flex gap-2">
        <button
          onClick={handleTakePhoto}
          disabled={isLoading || photos.length >= 10}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/60 backdrop-blur-sm border border-white/30 rounded-xl text-sm text-gray-600 hover:bg-white/80 transition-all disabled:opacity-50"
        >
          <Camera size={16} />
          촬영
        </button>
        <button
          onClick={handlePickGallery}
          disabled={isLoading || photos.length >= 10}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/60 backdrop-blur-sm border border-white/30 rounded-xl text-sm text-gray-600 hover:bg-white/80 transition-all disabled:opacity-50"
        >
          <ImagePlus size={16} />
          갤러리
        </button>
      </div>

      {/* 사진 그리드 */}
      {photos.length === 0 ? (
        <div className="text-center py-8">
          <Camera className="mx-auto text-gray-300 mb-2" size={32} />
          <p className="text-gray-400 text-xs">복권 사진을 촬영하거나 갤러리에서 선택하세요</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative aspect-[3/4] rounded-xl overflow-hidden border border-white/30 cursor-pointer group"
              onClick={() => setViewPhoto(photo)}
            >
              <img
                src={photo.dataUrl}
                alt="복권 사진"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </motion.div>
          ))}
        </div>
      )}

      {/* 전체보기 모달 */}
      <AnimatePresence>
        {viewPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
            onClick={() => setViewPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={viewPhoto.dataUrl}
                alt="복권 사진"
                className="w-full rounded-2xl"
              />
              <div className="absolute top-3 right-3 flex gap-2">
                <button
                  onClick={() => handleDelete(viewPhoto.id)}
                  className="p-2 bg-red-500 text-white rounded-full shadow-lg"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={() => setViewPhoto(null)}
                  className="p-2 bg-white/90 text-gray-700 rounded-full shadow-lg"
                >
                  <X size={16} />
                </button>
              </div>
              <p className="text-center text-white/60 text-xs mt-2">
                {new Date(viewPhoto.createdAt).toLocaleDateString('ko-KR')}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
