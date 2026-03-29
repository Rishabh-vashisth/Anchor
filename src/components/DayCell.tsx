import React from 'react';
import { motion } from 'motion/react';

export type DayState = 'none' | 'created' | 'completed';

interface DayCellProps {
  key?: number | string;
  day: number;
  isToday: boolean;
  state: DayState;
  onClick?: () => void;
}

export function DayCell({ day, isToday, state, onClick }: DayCellProps) {
  const getBgColor = () => {
    switch (state) {
      case 'completed':
        return 'bg-white text-black shadow-[0_0_10px_rgba(255,255,255,0.3)]';
      case 'created':
        return 'bg-white/20 text-white/80';
      default:
        return 'bg-white/[0.03] text-white/20';
    }
  };

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={`
        aspect-square flex flex-col items-center justify-center rounded-lg text-[10px] font-mono transition-all
        ${getBgColor()}
        ${isToday ? 'ring-1 ring-white/40' : ''}
      `}
    >
      <span className="font-bold">{day}</span>
    </motion.button>
  );
}
