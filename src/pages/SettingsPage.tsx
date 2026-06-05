import React from 'react';
import { motion } from 'motion/react';
import { 
  Settings, 
  Trash2, 
  Database, 
  ShieldAlert, 
  RefreshCw, 
  User, 
  FolderLock,
  Sparkles,
  Info
} from 'lucide-react';

interface SettingsPageProps {
  key?: string;
  stats: {
    tasksCount: number;
    ideasCount: number;
    reflectionsCount: number;
    goalsCount: number;
    streak: number;
  };
  timeTrackingEnabled: boolean;
  toggleTimeTracking: () => void;
  dailyTimeBudget: number;
  updateDailyTimeBudget: (minutes: number) => void;
  onReset: () => void;
}

export function SettingsPage({
  stats,
  timeTrackingEnabled,
  toggleTimeTracking,
  dailyTimeBudget,
  updateDailyTimeBudget,
  onReset
}: SettingsPageProps) {

  const handleResetConfirm = () => {
    if (window.confirm("CRITICAL WARNING: This action is irreversible. All local diagnostic state data, streaks, and focus parameters will be wiped from application storage. Do you wish to proceed?")) {
      onReset();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="space-y-6 text-white font-mono"
    >
      {/* Header */}
      <section className="space-y-1">
        <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-orange-500 font-bold block animate-pulse">
          Secure Diagnostics
        </span>
        <h2 className="text-2xl font-black tracking-tighter uppercase text-white">
          System Settings
        </h2>
        <p className="text-[11px] text-zinc-500">
          Verify storage limits, analyze state properties, or execute administrative reset codes.
        </p>
      </section>

      {/* Account Info Diagnostic Section */}
      <div className="p-4 border border-white/5 bg-zinc-950/40 space-y-3">
        <div className="flex items-center gap-2 text-[10px] uppercase text-orange-400 font-bold">
          <User className="w-3.5 h-3.5" />
          <span>Operator telemetry details</span>
        </div>
        <div className="text-xs text-zinc-400 space-y-1 pt-1 border-t border-white/5">
          <div className="flex justify-between">
            <span>Client Region:</span>
            <span className="text-white">UTC Global Container</span>
          </div>
          <div className="flex justify-between">
            <span>Terminal Port:</span>
            <span className="text-white">Port 3000 Inbound</span>
          </div>
          <div className="flex justify-between">
            <span>Version:</span>
            <span className="text-white">v3.1.5 Stable</span>
          </div>
        </div>
      </div>

      {/* Database diagnostic counts */}
      <div className="p-4 border border-white/5 bg-zinc-950/40 space-y-3">
        <div className="flex items-center gap-2 text-[10px] uppercase text-zinc-400 font-bold">
          <Database className="w-3.5 h-3.5 text-zinc-500" />
          <span>Storage Index Metrics</span>
        </div>

        <div className="text-xs text-zinc-400 space-y-1.5 pt-1 border-t border-white/5">
          <div className="flex justify-between">
            <span>Total Logged Tasks:</span>
            <span className="text-white font-bold">{stats.tasksCount} nodes</span>
          </div>
          <div className="flex justify-between">
            <span>Active Idea Cash:</span>
            <span className="text-white font-bold">{stats.ideasCount} nodes</span>
          </div>
          <div className="flex justify-between">
            <span>Saved Reflections:</span>
            <span className="text-white font-bold">{stats.reflectionsCount} entries</span>
          </div>
          <div className="flex justify-between">
            <span>Strategic OKR Goals:</span>
            <span className="text-white font-bold">{stats.goalsCount} objectives</span>
          </div>
          <div className="flex justify-between">
            <span>Current Focus Streak:</span>
            <span className="text-emerald-400 font-black">{stats.streak} days</span>
          </div>
        </div>
      </div>

      {/* Time Tracking System Settings */}
      <div className="p-4 border border-white/5 bg-zinc-950/40 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-[10px] uppercase text-zinc-400 font-bold">
            <span className="w-1.5 h-1.5 rounded-none bg-orange-500 inline-block animate-pulse" />
            <span>Time Allocator Engine</span>
          </div>
          <button
            onClick={toggleTimeTracking}
            className={`px-3 py-1 text-[9px] font-mono uppercase font-black tracking-widest border transition-all ${
              timeTrackingEnabled
                ? 'bg-orange-600 border-orange-500 text-white'
                : 'border-white/15 text-zinc-500 hover:text-white'
            }`}
          >
            {timeTrackingEnabled ? 'Enabled_ACTIVE' : 'Disabled_OFF'}
          </button>
        </div>

        <p className="text-xs text-zinc-400 font-sans leading-relaxed">
          Enable optional focused session countdown timers, Pomodoro preset tracking, and daily cognitive time budgets to visualize execution discipline ratios.
        </p>

        {timeTrackingEnabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-4 pt-3 border-t border-white/5 font-mono"
          >
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500 uppercase">Daily Focus Budget:</span>
                <span className="text-orange-400 font-bold">
                  {Math.floor(dailyTimeBudget / 60)}h {dailyTimeBudget % 60}m ({dailyTimeBudget} mins)
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="900"
                step="15"
                value={dailyTimeBudget}
                onChange={(e) => updateDailyTimeBudget(Number(e.target.value))}
                className="w-full accent-orange-500 h-1 bg-white/5 rounded-none appearance-none outline-none cursor-pointer"
              />
              <div className="flex justify-between text-[8px] text-zinc-600 uppercase">
                <span>30m (Micro Focus)</span>
                <span>480m (Standard 8h)</span>
                <span>900m (Extreme Deep)</span>
              </div>
            </div>

            <div className="p-3 bg-white/[0.01] border border-white/5 space-y-1 text-xs">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Pomodoro Preset Sessions</span>
              <p className="text-[10px] text-zinc-500 font-sans leading-relaxed">
                Choose any preset during active task timers: <strong className="text-zinc-300">25m (Focus)</strong>, <strong className="text-zinc-300">45m (Sprint)</strong>, or <strong className="text-zinc-300">90m (Ultra Deep)</strong>.
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* System info disclaimer */}
      <div className="p-4 border border-blue-500/10 bg-blue-950/15 flex gap-3 text-xs text-zinc-300">
        <Info className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
        <div className="space-y-1 font-sans">
          <span className="font-bold text-white block text-[10px] uppercase font-mono tracking-wider">Storage integrity</span>
          <p className="leading-relaxed">
            All data points reside safely on your sandboxed device context using standard SQLite & browser key-value local storage APIs. No trackers, telemetry cookies, or remote cloud processors inspect your strategic layout.
          </p>
        </div>
      </div>

      {/* Dangerous Operations administrative reset */}
      <div className="p-5 border border-red-500/20 bg-red-950/10 space-y-4">
        <div className="flex items-center gap-2 text-[10px] uppercase text-red-500 font-black">
          <ShieldAlert className="w-4 h-4" />
          <span>Destructive Administration Control</span>
        </div>
        
        <p className="text-xs text-zinc-400 font-sans leading-relaxed">
          Wipe client memory to default state. This action resolves performance loops and deletes old prioritizations immediately.
        </p>

        <button
          onClick={handleResetConfirm}
          className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Trash2 className="w-4 h-4" />
          <span>Wipe Sandboxed Cache Database</span>
        </button>
      </div>

    </motion.div>
  );
}
