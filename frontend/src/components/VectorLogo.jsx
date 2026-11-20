import React from 'react';
import logoImg from '../assets/image.png';

export default function VectorLogo({ size = 'md', showText = true, className = '' }) {
  const sizeMap = {
    sm: {
      img: 'h-5 xs:h-6 sm:h-7',
      divider: 'h-4 sm:h-5',
      advert: 'text-[11px] sm:text-xs',
      sub: 'text-[8px] sm:text-[9px]'
    },
    md: {
      img: 'h-6 xs:h-7 sm:h-8',
      divider: 'h-5 sm:h-6',
      advert: 'text-xs sm:text-sm',
      sub: 'text-[9px] sm:text-[10px]'
    },
    lg: {
      img: 'h-8 xs:h-9 sm:h-11',
      divider: 'h-6 sm:h-8',
      advert: 'text-sm sm:text-base',
      sub: 'text-[10px] sm:text-xs'
    },
    xl: {
      img: 'h-10 xs:h-12 sm:h-14',
      divider: 'h-8 sm:h-10',
      advert: 'text-base sm:text-lg',
      sub: 'text-xs sm:text-sm'
    }
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center gap-2 sm:gap-3 select-none max-w-full ${className}`}>
      {/* Brand Logo Image from src/assets/image.png */}
      <img
        src={logoImg}
        alt="Vector Advert"
        className={`${currentSize.img} w-auto max-w-full object-contain transition-transform duration-300 hover:scale-105 drop-shadow-[0_1px_2px_rgba(0,0,0,0.12)] dark:drop-shadow-[0_2px_10px_rgba(0,206,209,0.35)] shrink-0`}
      />

      {showText && (
        <div className="hidden sm:flex items-center gap-2 sm:gap-2.5 shrink-0">
          <div className={`w-px bg-slate-200 dark:bg-slate-700 ${currentSize.divider}`} />
          <div className="flex flex-col justify-center">
            <span
              className={`font-black tracking-wider uppercase leading-none text-[#00ced1] ${currentSize.advert}`}
              style={{ fontFamily: 'var(--font-brand-display, sans-serif)' }}
            >
              ADVERT
            </span>
            <span
              className={`font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-0.5 ${currentSize.sub}`}
            >
              ERP Platform
            </span>
          </div>
        </div>
      )}
    </div>
  );
}


