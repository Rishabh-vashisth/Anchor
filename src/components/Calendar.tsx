import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Task } from '../types';
import { DayCell, DayState } from './DayCell';
import { X } from 'lucide-react';

interface CalendarProps {
  tasks: Task[];
}

export function Calendar({ tasks }: CalendarProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday

  const getDayState = (day: number): DayState => {
    const dateStr = new Date(currentYear, currentMonth, day).toDateString();
    
    const dayTasks = tasks.filter(t => {
      const createdDate = new Date(t.createdAt).toDateString();
      const completedDate = t.completedAt ? new Date(t.completedAt).toDateString() : null;
      return createdDate === dateStr || completedDate === dateStr;
    });

    if (dayTasks.some(t => t.status === 'completed' && t.completedAt && new Date(t.completedAt).toDateString() === dateStr)) {
      return 'completed';
    }
    if (dayTasks.length > 0) {
      return 'created';
    }
    return 'none';
  };

  const getTasksForDay = (day: number) => {
    const dateStr = new Date(currentYear, currentMonth, day).toDateString();
    return tasks.filter(t => {
      const createdDate = new Date(t.createdAt).toDateString();
      const completedDate = t.completedAt ? new Date(t.completedAt).toDateString() : null;
      return createdDate === dateStr || completedDate === dateStr;
    });
  };

  const monthName = today.toLocaleString('default', { month: 'long' });
  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="space-y-6 bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black uppercase tracking-widest text-white/40">{monthName} {currentYear}</h3>
        <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Activity Log</span>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {dayNames.map(name => (
          <div key={name} className="text-[10px] font-mono text-white/20 text-center uppercase font-bold py-1">
            {name}
          </div>
        ))}
        
        {/* Empty cells for padding */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Actual days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const isToday = day === today.getDate();
          const state = getDayState(day);
          
          return (
            <DayCell
              key={day}
              day={day}
              isToday={isToday}
              state={state}
              onClick={() => {
                const dayTasks = getTasksForDay(day);
                if (dayTasks.length > 0) {
                  setSelectedDay(day);
                }
              }}
            />
          );
        })}
      </div>

      <div className="flex items-center gap-4 pt-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white" />
          <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white/20" />
          <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest">Created</span>
        </div>
      </div>

      {/* Selected Day Tasks Modal */}
      <AnimatePresence>
        {selectedDay !== null && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#151619] border border-white/10 p-8 w-full max-w-xs shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Activity for</span>
                  <h4 className="text-xl font-black uppercase tracking-tighter">{monthName} {selectedDay}</h4>
                </div>
                <button onClick={() => setSelectedDay(null)} className="text-white/20 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {getTasksForDay(selectedDay).map(task => (
                  <div key={task.id} className="p-4 bg-white/[0.02] border border-white/5 flex items-center justify-between gap-4">
                    <span className={`text-sm ${task.status === 'completed' ? 'text-white' : 'text-white/40'}`}>
                      {task.text}
                    </span>
                    <span className="text-[8px] font-mono uppercase tracking-widest text-white/20">
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
