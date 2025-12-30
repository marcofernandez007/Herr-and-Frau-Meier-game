
import React, { useState, useEffect } from 'react';
import { DICE_FACES } from '../constants';

interface DieProps {
  value: number;
  rolling?: boolean;
  intense?: boolean;
  highlight?: 'success' | 'fail' | null;
}

export const Die: React.FC<DieProps> = ({ value, rolling, intense, highlight }) => {
  const [displayValue, setDisplayValue] = useState(value);

  // During rolling, cycle through random faces to simulate motion
  useEffect(() => {
    let intervalId: number;
    if (rolling) {
      intervalId = window.setInterval(() => {
        setDisplayValue((Math.floor(Math.random() * 6) + 1));
      }, 70);
    } else {
      setDisplayValue(value);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [rolling, value]);

  const highlightClass = highlight === 'success' 
    ? 'animate-glow-success scale-105' 
    : highlight === 'fail' 
    ? 'animate-glow-fail scale-105' 
    : '';

  const shakeClass = intense ? 'animate-die-shake-impactful' : 'animate-die-shake';

  return (
    <div className={`
      w-20 h-20 md:w-24 md:h-24 bg-stone-100 rounded-xl shadow-lg border-2 border-stone-300
      flex items-center justify-center relative overflow-hidden
      ${rolling ? `${shakeClass} z-10` : 'transition-all duration-300 ease-out hover:scale-110'}
      ${!rolling ? 'shadow-[0_12px_24px_-8px_rgba(0,0,0,0.6)]' : 'shadow-none'}
      ${highlightClass}
    `}>
      {/* Face Content */}
      <div className={`
        h-full w-full transition-opacity duration-100
        ${rolling ? 'opacity-50 blur-[1px]' : 'opacity-100 blur-0'}
      `}>
        {DICE_FACES[displayValue] || DICE_FACES[1]}
      </div>
      
      {/* Glossy Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-black/5 via-transparent to-white/20"></div>
      
      {/* 3D edge effect */}
      {!rolling && (
        <div className="absolute inset-0 border-b-4 border-r-4 border-black/10 rounded-xl pointer-events-none"></div>
      )}
    </div>
  );
};
