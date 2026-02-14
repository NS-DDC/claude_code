/**
 * 카메라 유틸리티 (Capacitor Camera + 웹 폴백)
 */

import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export async function takeTicketPhoto(): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    try {
      const photo = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: 1200,
      });
      return photo.dataUrl ?? null;
    } catch {
      return null;
    }
  }

  // 웹 폴백: file input
  return pickFileInput('environment');
}

export async function pickFromGallery(): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    try {
      const photo = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
        width: 1200,
      });
      return photo.dataUrl ?? null;
    } catch {
      return null;
    }
  }

  // 웹 폴백
  return pickFileInput();
}

function pickFileInput(capture?: string): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (capture) input.setAttribute('capture', capture);

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    };

    // 사용자가 취소한 경우
    input.oncancel = () => resolve(null);
    input.click();
  });
}
