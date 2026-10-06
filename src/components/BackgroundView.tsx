import React, { useState, useEffect } from 'react';
import { WorkRulesSettings } from '../types';

interface BackgroundViewProps {
  settings: WorkRulesSettings;
  isNight?: boolean;
  isWeekend?: boolean;
  isHoliday?: boolean;
}

// 8 Cloudinary Images provided for the slideshow
export const SLIDESHOW_IMAGES = [
  'https://res.cloudinary.com/tengku/image/upload/v1791263855/ginesia/liburan_iaoj8q.jpg',
  'https://res.cloudinary.com/tengku/image/upload/v1791263855/ginesia/liburan1_ihjxuw.jpg',
  'https://res.cloudinary.com/tengku/image/upload/v1791263855/ginesia/liburan3_zwfwlj.webp',
  'https://res.cloudinary.com/tengku/image/upload/v1791263855/ginesia/liburan2_ronfmt.jpg',
  'https://res.cloudinary.com/tengku/image/upload/v1791263855/ginesia/kantor3_cuqpum.jpg',
  'https://res.cloudinary.com/tengku/image/upload/v1791263855/ginesia/kantor_vkkigk.jpg',
  'https://res.cloudinary.com/tengku/image/upload/v1791263854/ginesia/liburan4_uoiffm.webp',
  'https://res.cloudinary.com/tengku/image/upload/v1791263854/ginesia/kantor2_lseias.jpg',
];

export const BackgroundView: React.FC<BackgroundViewProps> = ({ settings }) => {
  const { bgDarkOverlay, bgBlur, backgroundTheme } = settings;
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-advance slideshow every 8 seconds with smooth crossfade
  useEffect(() => {
    if (backgroundTheme === 'none') return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SLIDESHOW_IMAGES.length);
    }, 8000);

    return () => clearInterval(timer);
  }, [backgroundTheme]);

  if (backgroundTheme === 'none') {
    return <div className="fixed inset-0 bg-slate-950 pointer-events-none -z-10" />;
  }

  const overlayOpacity = Math.max(0, Math.min(1, (bgDarkOverlay ?? 0) / 100));
  const blurValue = Math.max(0, Math.min(20, bgBlur ?? 0));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 select-none bg-slate-950">
      {/* Preload & Crossfade Slideshow Layers */}
      {SLIDESHOW_IMAGES.map((imgSrc, idx) => {
        const isActive = idx === currentIndex;
        return (
          <img
            key={imgSrc}
            src={imgSrc}
            alt="Slideshow Background"
            referrerPolicy="no-referrer"
            className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000 ease-in-out scale-105 ${
              isActive ? 'opacity-100 z-0' : 'opacity-0 -z-10'
            }`}
            style={{ filter: blurValue > 0 ? `blur(${blurValue}px)` : undefined }}
          />
        );
      })}

      {/* Dark Overlay & Gradient (scales cleanly down to 0%) */}
      {overlayOpacity > 0 && (
        <>
          <div
            className="absolute inset-0 bg-slate-950 transition-opacity duration-500"
            style={{ opacity: overlayOpacity }}
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/40 transition-opacity duration-500"
            style={{ opacity: overlayOpacity }}
          />
        </>
      )}
    </div>
  );
};
