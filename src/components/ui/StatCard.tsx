import React from 'react';

interface StatCardProps {
  label: string;
  value: number;
  color: string;
}

export function StatCard({ label, value, color }: StatCardProps) {
  return (
    <div className="p-6 border border-white/10 bg-white/[0.02]">
      <div className={`text-4xl font-black mb-1 ${color}`}>{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">{label}</div>
    </div>
  );
}
