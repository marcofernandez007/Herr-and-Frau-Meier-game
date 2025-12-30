
import React from 'react';

export const getRollValue = (d1: number, d2: number): number => {
  const high = Math.max(d1, d2);
  const low = Math.min(d1, d2);
  
  // Meier is 21 (2 and 1)
  if (high === 2 && low === 1) return 1000;
  
  // Doubles are next (11, 22, ..., 66)
  if (high === low) return high * 100;
  
  // Normal rolls are highest digit first
  return high * 10 + low;
};

export const formatRollName = (val: number): string => {
  if (val === 1000) return "Meier (21)!";
  if (val >= 100) return `${val / 100}-${val / 100} Double`;
  return val.toString();
};

export const DICE_FACES: Record<number, React.ReactNode> = {
  1: <div className="grid grid-cols-3 grid-rows-3 gap-1 h-full w-full p-2"><div className="col-start-2 row-start-2 bg-stone-800 rounded-full"></div></div>,
  2: <div className="grid grid-cols-3 grid-rows-3 gap-1 h-full w-full p-2"><div className="col-start-1 row-start-1 bg-stone-800 rounded-full"></div><div className="col-start-3 row-start-3 bg-stone-800 rounded-full"></div></div>,
  3: <div className="grid grid-cols-3 grid-rows-3 gap-1 h-full w-full p-2"><div className="col-start-1 row-start-1 bg-stone-800 rounded-full"></div><div className="col-start-2 row-start-2 bg-stone-800 rounded-full"></div><div className="col-start-3 row-start-3 bg-stone-800 rounded-full"></div></div>,
  4: <div className="grid grid-cols-3 grid-rows-3 gap-1 h-full w-full p-2"><div className="col-start-1 row-start-1 bg-stone-800 rounded-full"></div><div className="col-start-3 row-start-1 bg-stone-800 rounded-full"></div><div className="col-start-1 row-start-3 bg-stone-800 rounded-full"></div><div className="col-start-3 row-start-3 bg-stone-800 rounded-full"></div></div>,
  5: <div className="grid grid-cols-3 grid-rows-3 gap-1 h-full w-full p-2"><div className="col-start-1 row-start-1 bg-stone-800 rounded-full"></div><div className="col-start-3 row-start-1 bg-stone-800 rounded-full"></div><div className="col-start-2 row-start-2 bg-stone-800 rounded-full"></div><div className="col-start-1 row-start-3 bg-stone-800 rounded-full"></div><div className="col-start-3 row-start-3 bg-stone-800 rounded-full"></div></div>,
  6: <div className="grid grid-cols-3 grid-rows-3 gap-1 h-full w-full p-2"><div className="col-start-1 row-start-1 bg-stone-800 rounded-full"></div><div className="col-start-3 row-start-1 bg-stone-800 rounded-full"></div><div className="col-start-1 row-start-2 bg-stone-800 rounded-full"></div><div className="col-start-3 row-start-2 bg-stone-800 rounded-full"></div><div className="col-start-1 row-start-3 bg-stone-800 rounded-full"></div><div className="col-start-3 row-start-3 bg-stone-800 rounded-full"></div></div>,
};
