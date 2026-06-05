import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Lightbulb, 
  Bookmark, 
  AlertTriangle, 
  Trash2, 
  Plus, 
  Calendar,
  Sparkles,
  Search,
  Smile,
  Meh,
  Frown,
  TrendingUp,
  X,
  ChevronDown,
  ChevronUp,
  Activity,
  FileText,
  Filter,
  Clock,
  ArrowRight,
  Tag,
  Sliders,
  Eye,
  CheckCircle,
  HelpCircle,
  Image,
  Layers,
  Heart,
  Target
} from 'lucide-react';
import { Reflection, ReflectionTag, Task } from '../types';

interface ReflectionsPageProps {
  key?: string;
  reflections: Reflection[];
  allTasks: Task[];
  onAddReflection: (
    text: string,
    tag: ReflectionTag,
    whatWorked?: string,
    whatBlocked?: string,
    whatSurprised?: string,
    whatToDoDifferently?: string,
    moodEnergy?: number,
    stressLevel?: number,
    photo?: string | null,
    relatedTaskId?: string | null,
    templateId?: string | null
  ) => void;
  onDeleteReflection: (id: string) => void;
}

interface ReflectionTemplate {
  id: string;
  name: string;
  description: string;
  emoji: string;
  whatWorkedLabel: string;
  whatBlockedLabel: string;
  whatSurprisedLabel: string;
  whatToDoDifferentlyLabel: string;
  defaultTag: ReflectionTag;
  placeholderWorked: string;
  placeholderBlocked: string;
  placeholderSurprised: string;
  placeholderDifferently: string;
}

const TEMPLATES: ReflectionTemplate[] = [
  {
    id: 'standard',
    name: 'Standard Post-Mortem',
    description: 'A balanced daily audit to map energy levels, friction points, and action priorities.',
    emoji: '📝',
    defaultTag: 'Insight',
    whatWorkedLabel: 'What worked? (positive patterns, successes)',
    placeholderWorked: 'Drafted clean API handlers; protected morning focus for 3 uninterrupted hours.',
    whatBlockedLabel: 'What blocked you? (obstacles, leaks, distractions)',
    placeholderBlocked: 'Context switching between Slack requests; 2 unscheduled syncs threw off afternoon deep blocks.',
    whatSurprisedLabel: 'What surprised you? (unexpected learnings, insights)',
    placeholderSurprised: 'Found that tackling the toughest refactoring task first thing made the rest of the day feel trivial.',
    whatToDoDifferentlyLabel: 'What to do differently tomorrow? (action items)',
    placeholderDifferently: 'Keep Slack closed until 11:30 AM; calendar block 1 hour of quiet testing time.'
  },
  {
    id: 'victory',
    name: 'Victory & Breakthrough',
    description: 'Capture highly successful days. Codify your strengths and momentum.',
    emoji: '🏆',
    defaultTag: 'Victory',
    whatWorkedLabel: 'Highlight your direct victories (major successes and positive triggers)',
    placeholderWorked: 'Shipped the full OKR alignment panel with zero lint errors; streak rate is soaring!',
    whatBlockedLabel: 'Were there minor friction points or things you successfully bypassed?',
    placeholderBlocked: 'Felt slight fatigue after lunch, but countered it with a brisk 5-minute walk instead of browsing.',
    whatSurprisedLabel: 'What creative insights did this success unlock?',
    placeholderSurprised: 'Slicing component types early eliminated 90% of structural errors. High type-safety pays off!',
    whatToDoDifferentlyLabel: 'How can you duplicate or amplify this victory tomorrow?',
    placeholderDifferently: 'Repeat the early-morning walk + spec planning routine. Prepare file schemas tonight.'
  },
  {
    id: 'crisis',
    name: 'Obstacle Decoder',
    description: 'Deconstruct a high-stress horizon, fatigue patterns, or focus leaks.',
    emoji: '🚨',
    defaultTag: 'Blocker',
    whatWorkedLabel: 'What did you still manage to handle gracefully despite these bottlenecks?',
    placeholderWorked: 'Triaged and closed 3 key tickets early; maintained professional composure during database lag.',
    whatBlockedLabel: 'What threw off your focus? (the core blocker, distraction, spec-gap)',
    placeholderBlocked: 'Severe lack of API clear guidelines; took 4 hours of trial and error to resolve standard headers.',
    whatSurprisedLabel: 'What stress triggers or neurological signals did you notice today?',
    placeholderSurprised: 'A tight chest signal is a sure sign I am overcharging my mind without structured timers.',
    whatToDoDifferentlyLabel: 'What pre-emptive boundaries will you establish to protect your focus?',
    placeholderDifferently: 'Stop coding immediately when specs are undefined; schedule a direct clarifying call instead.'
  },
  {
    id: 'creative',
    name: 'Creative Drift & Spark',
    description: 'Record unexpected random insights, brainstorming, and curiosity lanes.',
    emoji: '✨',
    defaultTag: 'Insight',
    whatWorkedLabel: 'What creative solutions or rabbit-holes did you map?',
    placeholderWorked: 'Explored a fast local sentiment scoring heuristic that takes mood levels into account.',
    whatBlockedLabel: 'What filters or chore-tasks stood in the way of deep experimentation?',
    placeholderBlocked: 'Felt guilty diving into side ideas; had to force myself to finish the basic manual config blocks first.',
    whatSurprisedLabel: 'What unexpected serendipitous connection did you discover?',
    placeholderSurprised: 'Discovered that journaling with explicit prompt fields feels 5x more encouraging than raw blank boxes.',
    whatToDoDifferentlyLabel: 'How can you weave this creative spark into daily structured goals?',
    placeholderDifferently: 'Integrate the pattern alerts panel into the morning review deck.'
  }
];

const PRESET_PHOTOS = [
  { name: 'Deep Focus Slate', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80', description: 'Deep ocean serene twilight' },
  { name: 'Tokyo Pixel Lights', url: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&w=600&q=80', description: 'Vibrant neon electronic dusk' },
  { name: 'Silent Forest Peak', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80', description: 'Calming green misty woods' },
  { name: 'Brutalist Workspace', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80', description: 'Clean modern focus studio' }
];

export function ReflectionsPage({
  reflections = [],
  allTasks = [],
  onAddReflection,
  onDeleteReflection
}: ReflectionsPageProps) {
  // Navigation & View Toggle States
  const [activeTabFilter, setActiveTabFilter] = useState<'ALL' | ReflectionTag>('ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState<'7' | '30' | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<ReflectionTemplate>(TEMPLATES[0]);
  const [expandedReflectionId, setExpandedReflectionId] = useState<string | null>(null);

  // Guided Journaling states
  const [whatWorked, setWhatWorked] = useState('');
  const [whatBlocked, setWhatBlocked] = useState('');
  const [whatSurprised, setWhatSurprised] = useState('');
  const [whatToDoDifferently, setWhatToDoDifferently] = useState('');
  const [moodEnergy, setMoodEnergy] = useState<number>(7);
  const [stressLevel, setStressLevel] = useState<number>(3);
  const [selectedTag, setSelectedTag] = useState<ReflectionTag>('Insight');
  const [relatedTaskId, setRelatedTaskId] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [customPhotoInput, setCustomPhotoInput] = useState(false);
  const [journalBrief, setJournalBrief] = useState(''); // Brief entry headline

  // quick snap journaling states (single-text fallback)
  const [quickReflectionOpen, setQuickReflectionOpen] = useState(false);
  const [quickText, setQuickText] = useState('');
  const [quickTag, setQuickTag] = useState<ReflectionTag>('Insight');

  // Sentiment Analyzer Heuristic
  const parseSentiment = (ref: Reflection) => {
    const textGroup = [ref.text, ref.whatWorked, ref.whatBlocked, ref.whatSurprised, ref.whatToDoDifferently]
      .join(' ')
      .toLowerCase();

    const positiveWords = ['win', 'victory', 'achieved', 'proud', 'happy', 'crushed', 'finished', 'solved', 'completed', 'great', 'wonderful', 'breakthrough', 'love', 'good', 'perfect', 'awesome', 'speed', 'clear', 'calm'];
    const negativeWords = ['blocked', 'stress', 'distracted', 'failed', 'stuck', 'meeting', 'exhausted', 'unplanned', 'delay', 'mistake', 'error', 'poor', 'bad', 'hard', 'wasted', 'friction', 'anxious'];

    let posCount = 0;
    let negCount = 0;

    positiveWords.forEach(w => {
      const matches = textGroup.match(new RegExp(`\\b${w}\\b`, 'g'));
      if (matches) posCount += matches.length;
    });

    negativeWords.forEach(w => {
      const matches = textGroup.match(new RegExp(`\\b${w}\\b`, 'g'));
      if (matches) negCount += matches.length;
    });

    const score = (ref.moodEnergy - ref.stressLevel) + (posCount - negCount);

    if (score > 1) return { label: 'Positive', emoji: '😊', color: 'text-emerald-400 bg-emerald-950/20 border-emerald-500/20' };
    if (score < -1) return { label: 'Negative', emoji: '😟', color: 'text-rose-400 bg-rose-950/20 border-rose-500/20' };
    return { label: 'Neutral', emoji: '😐', color: 'text-zinc-400 bg-zinc-950/40 border-zinc-500/10' };
  };

  // Blocker Pattern Detection
  const blockerPatterns = useMemo(() => {
    const blockMap: { [key: string]: number } = {};
    const blockerKeywords = [
      { key: 'meeting', label: 'Meetings & Syncs' },
      { key: 'distract', label: 'Distractions / Focus Leak' },
      { key: 'fatigue', label: 'Fatigue / Energy Lows' },
      { key: 'exhausted', label: 'Fatigue / Energy Lows' },
      { key: 'noise', label: 'Digital noise / Notifications' },
      { key: 'slack', label: 'Slack / Communication chores' },
      { key: 'social', label: 'Social media browsing' },
      { key: 'unplanned', label: 'Unplanned scale drift' },
      { key: 'spec', label: 'Vague specs / documentation gaps' },
      { key: 'procrastinat', label: 'Procrastination loops' },
      { key: 'perfect', label: 'Over-engineering traps' },
      { key: 'overthink', label: 'Over-engineering traps' }
    ];

    reflections.forEach(ref => {
      const blockText = (ref.whatBlocked || '').toLowerCase() + ' ' + (ref.text || '').toLowerCase();
      blockerKeywords.forEach(keyword => {
        if (blockText.includes(keyword.key)) {
          blockMap[keyword.label] = (blockMap[keyword.label] || 0) + 1;
        }
      });
    });

    return Object.entries(blockMap)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }, [reflections]);

  // Filter reflection stack
  const filteredReflections = useMemo(() => {
    return reflections.filter(ref => {
      // 1. Tag filter
      if (activeTabFilter !== 'ALL' && ref.tag !== activeTabFilter) return false;

      // 2. DateRange filter
      if (dateRangeFilter !== 'ALL') {
        const thresholdDays = parseInt(dateRangeFilter);
        const refTime = ref.createdAt || new Date(ref.date).getTime();
        const diffDays = (Date.now() - refTime) / (1000 * 60 * 60 * 24);
        if (diffDays > thresholdDays) return false;
      }

      // 3. Search text
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const content = [
          ref.text,
          ref.tag,
          ref.whatWorked,
          ref.whatBlocked,
          ref.whatSurprised,
          ref.whatToDoDifferently
        ].join(' ').toLowerCase();

        if (!content.includes(query)) return false;
      }

      return true;
    });
  }, [reflections, activeTabFilter, dateRangeFilter, searchQuery]);

  // Compute Weekly metrics
  const weeklyDigest = useMemo(() => {
    const last7Days = reflections.filter(r => {
      const refTime = r.createdAt || new Date(r.date).getTime();
      return (Date.now() - refTime) / (1000 * 60 * 60 * 24) <= 7;
    });

    if (last7Days.length === 0) return null;

    const avgMood = last7Days.reduce((acc, r) => acc + (r.moodEnergy || 5), 0) / last7Days.length;
    const avgStress = last7Days.reduce((acc, r) => acc + (r.stressLevel || 5), 0) / last7Days.length;

    // Collect aggregate highlights
    const topInsights = last7Days.filter(r => r.tag === 'Insight').map(r => r.whatSurprised || r.text).filter(Boolean);
    const topBlockers = last7Days.filter(r => r.tag === 'Blocker' || r.whatBlocked).map(r => r.whatBlocked).filter(Boolean);
    const topImprovements = last7Days.map(r => r.whatToDoDifferently).filter(Boolean);

    return {
      count: last7Days.length,
      avgMood: avgMood.toFixed(1),
      avgStress: avgStress.toFixed(1),
      insights: topInsights.slice(0, 3),
      blockers: topBlockers.slice(0, 3),
      improvements: topImprovements.slice(0, 3)
    };
  }, [reflections]);

  // Handle template switch
  const handleApplyTemplate = (tpl: ReflectionTemplate) => {
    setActiveTemplate(tpl);
    setSelectedTag(tpl.defaultTag);
    // Suggest brief headlines matching theme
    setJournalBrief(`Horizon entry: ${tpl.name}`);
  };

  const handleGuidedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalBrief = journalBrief.trim() || `Journal entry (${new Date().toLocaleDateString()})`;
    onAddReflection(
      finalBrief,
      selectedTag,
      whatWorked.trim(),
      whatBlocked.trim(),
      whatSurprised.trim(),
      whatToDoDifferently.trim(),
      moodEnergy,
      stressLevel,
      photoUrl || null,
      relatedTaskId || null,
      activeTemplate.id
    );

    // Reset Form fields
    setWhatWorked('');
    setWhatBlocked('');
    setWhatSurprised('');
    setWhatToDoDifferently('');
    setMoodEnergy(7);
    setStressLevel(3);
    setPhotoUrl('');
    setRelatedTaskId('');
    setJournalBrief('');
    setShowAddForm(false);
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickText.trim()) {
      onAddReflection(
        `Quick Snap: ${quickText.trim().substring(0, 30)}...`,
        quickTag,
        quickText.trim(), // fill as whatWorked
        '',
        '',
        '',
        6, // default mood
        4, // default stress
        null,
        null,
        'quick'
      );
      setQuickText('');
      setQuickReflectionOpen(false);
    }
  };

  // Custom SVG Trend Line Renderer
  const svgTrendData = useMemo(() => {
    // Sort reflections chronologically for trends
    const sorted = [...reflections]
      .filter(r => r.createdAt)
      .sort((a, b) => a.createdAt - b.createdAt)
      .slice(-10); // Look at last 10 logs

    if (sorted.length < 2) return null;

    const width = 500;
    const height = 120;
    const padding = 15;

    const pointsMood = sorted.map((ref, idx) => {
      const x = padding + (idx / (sorted.length - 1)) * (width - padding * 2);
      const y = height - padding - ((ref.moodEnergy - 1) / 9) * (height - padding * 2);
      return { x, y, val: ref.moodEnergy };
    });

    const pointsStress = sorted.map((ref, idx) => {
      const x = padding + (idx / (sorted.length - 1)) * (width - padding * 2);
      const y = height - padding - ((ref.stressLevel - 1) / 9) * (height - padding * 2);
      return { x, y, val: ref.stressLevel };
    });

    const moodPath = pointsMood.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const stressPath = pointsStress.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    return { moodPath, stressPath, pointsMood, pointsStress, width, height, dataLength: sorted.length };
  }, [reflections]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="space-y-6 text-white pb-10"
    >
      {/* 1. Header with floating action buttons */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center bg-zinc-950/20 py-4 border-b border-white/5 gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-orange-500 font-black block">
            NEUROLOGICAL SIGNAL JOURNALING
          </span>
          <h2 className="text-2xl font-black tracking-tighter uppercase text-white">
            Structured Reflections
          </h2>
          <p className="text-[11px] text-zinc-500">
            Guided review to decode cognitive blockers, capture victory trends, and calibrate neurological stress ratios.
          </p>
        </div>

        {/* Floating actions wrapper */}
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setQuickReflectionOpen(true)}
            className="p-1 px-3 border border-orange-500/20 hover:border-orange-500 font-mono text-[9px] uppercase tracking-widest text-orange-400 bg-orange-950/10 flex items-center gap-1.5 transition-all"
          >
            ⚡ Quick Snap Journal
          </button>
          
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              if (!showAddForm) {
                // Pre-populate with first template format defaults
                handleApplyTemplate(TEMPLATES[0]);
              }
            }}
            className="p-2 px-4 bg-white text-black font-mono text-[9px] uppercase tracking-widest font-black flex items-center gap-1.5 hover:opacity-90 transition-all"
          >
            {showAddForm ? 'Close Journal Form' : '✍️ Open Guided Journal'}
          </button>
        </div>
      </section>

      {/* 2. Interactive Guided Reflection Capture Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border border-white/10 bg-zinc-950 p-5 space-y-5"
          >
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-500" />
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold block">
                  Interactive Guided Journaleer
                </span>
              </div>
              <button 
                onClick={() => setShowAddForm(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Template select tabs */}
            <div className="space-y-1">
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Choose guided layout template:</span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {TEMPLATES.map(tpl => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleApplyTemplate(tpl)}
                    className={`p-2.5 border text-left transition-all relative ${
                      activeTemplate.id === tpl.id 
                        ? 'border-white bg-white/5 text-white' 
                        : 'border-white/5 text-zinc-400 bg-zinc-900/10 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{tpl.emoji}</span>
                      <span className="text-[10px] font-bold font-mono tracking-wide uppercase truncate block">{tpl.name}</span>
                    </div>
                    <p className="text-[8px] text-zinc-500 leading-tight mt-1 line-clamp-2 pr-1">{tpl.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleGuidedSubmit} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Headline input */}
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">
                    Journal Headline/Key Lesson Logged
                  </label>
                  <input
                    type="text"
                    required
                    value={journalBrief}
                    onChange={(e) => setJournalBrief(e.target.value)}
                    placeholder="e.g. Code mapping sprint; fatigue trigger hit at 4PM"
                    className="w-full bg-[#050505] p-3 border border-white/5 text-xs text-white focus:border-white outline-none font-mono"
                  />
                </div>

                {/* Primary Tag selection */}
                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">Primary Classification Tag</label>
                  <div className="grid grid-cols-5 gap-1 bg-[#050505] border border-white/5 p-1">
                    {(['Insight', 'Reminder', 'Mistake', 'Victory', 'Blocker'] as ReflectionTag[]).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSelectedTag(t)}
                        title={t}
                        className={`py-1.5 text-center text-[7px] tracking-tighter uppercase font-mono border ${
                          selectedTag === t 
                            ? 'bg-white text-black border-white font-bold' 
                            : 'border-transparent text-zinc-500 hover:text-white'
                        }`}
                      >
                        {t.substring(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4 Interactive prompts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/5 pt-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-zinc-400 capitalize flex items-center gap-1.5 font-bold">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    {activeTemplate.whatWorkedLabel}
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={whatWorked}
                    onChange={(e) => setWhatWorked(e.target.value)}
                    placeholder={activeTemplate.placeholderWorked}
                    className="w-full bg-[#050505] p-3 border border-white/5 text-xs text-zinc-200 focus:border-white outline-none font-mono placeholder:text-zinc-650 resize-none h-20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-zinc-400 capitalize flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    {activeTemplate.whatBlockedLabel}
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={whatBlocked}
                    onChange={(e) => setWhatBlocked(e.target.value)}
                    placeholder={activeTemplate.placeholderBlocked}
                    className="w-full bg-[#050505] p-3 border border-white/5 text-xs text-zinc-200 focus:border-white outline-none font-mono placeholder:text-zinc-650 resize-none h-20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-zinc-400 capitalize flex items-center gap-1.5 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    {activeTemplate.whatSurprisedLabel}
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={whatSurprised}
                    onChange={(e) => setWhatSurprised(e.target.value)}
                    placeholder={activeTemplate.placeholderSurprised}
                    className="w-full bg-[#050505] p-3 border border-white/5 text-xs text-zinc-200 focus:border-white outline-none font-mono placeholder:text-zinc-650 resize-none h-20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-zinc-400 capitalize flex items-center gap-1.5 font-bold">
                    <ArrowRight className="w-3.5 h-3.5 text-sky-450 shrink-0" />
                    {activeTemplate.whatToDoDifferentlyLabel}
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={whatToDoDifferently}
                    onChange={(e) => setWhatToDoDifferently(e.target.value)}
                    placeholder={activeTemplate.placeholderDifferently}
                    className="w-full bg-[#050505] p-3 border border-white/5 text-xs text-zinc-200 focus:border-white outline-none font-mono placeholder:text-zinc-650 resize-none h-20"
                  />
                </div>
              </div>

              {/* Sliders for mood, stress, related task and photos */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-white/5 pt-4">
                
                {/* Mood rating scales */}
                <div className="space-y-1.5 bg-zinc-900/20 p-3 border border-white/5">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider font-bold">Mood / Energy Rating</span>
                    <span className="text-xs font-mono text-emerald-400 font-black">{moodEnergy}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={moodEnergy}
                    onChange={(e) => setMoodEnergy(parseInt(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[8px] font-mono text-zinc-550">
                    <span>1: Exhausted</span>
                    <span>10: Vibrant</span>
                  </div>
                </div>

                {/* Stress rating scales */}
                <div className="space-y-1.5 bg-zinc-900/20 p-3 border border-white/5">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider font-bold">Stress Index</span>
                    <span className="text-xs font-mono text-rose-450 font-black">{stressLevel}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={stressLevel}
                    onChange={(e) => setStressLevel(parseInt(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                  />
                  <div className="flex justify-between text-[8px] font-mono text-zinc-550">
                    <span>1: Serene</span>
                    <span>10: Extreme</span>
                  </div>
                </div>

                {/* Related tasks association Link */}
                <div className="space-y-1.5 bg-zinc-900/20 p-3 border border-white/5">
                  <label className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider block font-bold flex items-center gap-1.5">
                    <Target className="w-3 h-3 text-zinc-500" />
                    Link to Specific Task
                  </label>
                  <select
                    value={relatedTaskId}
                    onChange={(e) => setRelatedTaskId(e.target.value)}
                    className="w-full bg-zinc-950 p-2 border border-white/5 text-[10px] font-mono text-zinc-300 outline-none focus:border-white h-8 block"
                  >
                    <option value="">-- No Direct Task Link --</option>
                    {allTasks.map(t => (
                      <option key={t.id} value={t.id}>
                        [{t.status.toUpperCase()}] {t.text.substring(0, 30)}...
                      </option>
                    ))}
                  </select>
                </div>

                {/* Photographic / atmospheric selections */}
                <div className="space-y-1.5 bg-zinc-900/20 p-3 border border-white/5">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider block font-bold flex items-center gap-1.5">
                      <Image className="w-3 h-3 text-zinc-500" />
                      Visual Mood Board
                    </label>
                    <button
                      type="button"
                      onClick={() => setCustomPhotoInput(!customPhotoInput)}
                      className="text-[8px] font-mono text-zinc-500 hover:text-white uppercase underline"
                    >
                      {customPhotoInput ? 'Themes' : 'Custom URL'}
                    </button>
                  </div>

                  {!customPhotoInput ? (
                    <select
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      className="w-full bg-zinc-950 p-2 border border-white/5 text-[10px] font-mono text-zinc-300 outline-none focus:border-white h-8 block"
                    >
                      <option value="">-- No visual mood attachment --</option>
                      {PRESET_PHOTOS.map(p => (
                        <option key={p.url} value={p.url}>{p.name} (Background)</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      placeholder="Paste Unsplash or base64 image URL"
                      className="w-full bg-zinc-950 p-1.5 border border-white/5 text-[9px] font-mono text-zinc-300 outline-none focus:border-white h-8 block"
                    />
                  )}
                </div>
              </div>

              {photoUrl && (
                <div className="border border-white/5 bg-zinc-900 p-2 flex items-center gap-4 relative">
                  <img src={photoUrl} alt="Preview Attachment" referrerPolicy="no-referrer" className="w-16 h-10 object-cover border border-white/10" />
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest block">Aesthetic Attachment Selected</span>
                    <p className="text-[8px] text-zinc-500 max-w-md truncate">{photoUrl}</p>
                  </div>
                  <button type="button" onClick={() => setPhotoUrl('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-red-400">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-white text-black font-black font-mono text-xs uppercase tracking-[0.2em] hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
              >
                💾 Commit Guided Journal Log
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2.1 Quick single text fall-back capture overlay */}
      <AnimatePresence>
        {quickReflectionOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border border-white/10 max-w-md w-full p-6 space-y-4"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-[10px] font-mono text-orange-400 uppercase tracking-widest font-black">⚡ Quick Snap Journal Capture</span>
                <button onClick={() => setQuickReflectionOpen(false)} className="text-zinc-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleQuickSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block leading-tight">Write lesson learned or insight instantly:</label>
                  <textarea
                    required
                    value={quickText}
                    onChange={(e) => setQuickText(e.target.value)}
                    placeholder="We fixed the async loop error by preventing local state update before promise resolution."
                    className="w-full bg-black p-3 border border-white/5 text-xs text-zinc-200 outline-none focus:border-orange-500 h-24 resize-none font-mono"
                    maxLength={300}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex gap-1.5">
                    {(['Insight', 'Reminder', 'Mistake'] as ReflectionTag[]).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setQuickTag(t)}
                        className={`text-[8px] font-mono px-2 py-1 border ${
                          quickTag === t ? 'border-orange-500 bg-orange-950/20 text-orange-400 font-bold' : 'border-zinc-800 text-zinc-500 hover:text-zinc-350'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  <button
                    type="submit"
                    className="py-1.5 px-4 bg-orange-500 text-black font-mono text-[9px] font-black uppercase tracking-widest hover:opacity-90"
                  >
                    Save Log
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Reflections Mining Dashboard */}
      {reflections.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Growth & Bio-telemetry SVG graph */}
          <div className="p-4 border border-white/5 bg-zinc-950/40 md:col-span-2 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-black block">Neurological Trend Indicators</span>
              <div className="flex gap-3 text-[8px] font-mono">
                <span className="text-emerald-400">● Mood/Energy</span>
                <span className="text-rose-400">▲ Stress Index</span>
              </div>
            </div>

            {svgTrendData ? (
              <div className="space-y-2">
                <div className="w-full overflow-x-auto overflow-y-hidden pt-1">
                  <svg viewBox={`0 0 ${svgTrendData.width} ${svgTrendData.height}`} className="w-full h-24 stroke-linecap-round font-mono">
                    <line x1="15" y1="60" x2="485" y2="60" stroke="rgba(255,255,255,0.02)" strokeDasharray="2" />
                    <line x1="15" y1="15" x2="485" y2="15" stroke="rgba(255,255,255,0.01)" />
                    <line x1="15" y1="105" x2="485" y2="105" stroke="rgba(255,255,255,0.01)" />

                    {/* Mood curve */}
                    <path
                      d={svgTrendData.moodPath}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                    />

                    {/* Stress curve */}
                    <path
                      d={svgTrendData.stressPath}
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="2"
                    />

                    {/* Plot node circles */}
                    {svgTrendData.pointsMood.map((p, idx) => (
                      <circle
                        key={`m-${idx}`}
                        cx={p.x}
                        cy={p.y}
                        r="3.5"
                        fill="#050505"
                        stroke="#10b981"
                        strokeWidth="1.5"
                        className="cursor-pointer group"
                      >
                        <title>Mood rating: {p.val}/10</title>
                      </circle>
                    ))}

                    {svgTrendData.pointsStress.map((p, idx) => (
                      <polygon
                        key={`s-${idx}`}
                        points={`${p.x},${p.y - 3} ${p.x - 3},${p.y + 3} ${p.x + 3},${p.y + 3}`}
                        fill="#050505"
                        stroke="#f43f5e"
                        strokeWidth="1.5"
                        className="cursor-pointer"
                      >
                        <title>Stress Level: {p.val}/10</title>
                      </polygon>
                    ))}
                  </svg>
                </div>
                <div className="flex justify-between items-center text-[8px] text-zinc-650 font-mono">
                  <span>← Previous Logs</span>
                  <span>Average Signal Variance Rate calibrated (based on {svgTrendData.dataLength} records)</span>
                  <span>Active Horizon →</span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-[10px] font-mono text-zinc-650 uppercase">
                Add 2 or more guided logs with rating ratings to load trend paths.
              </div>
            )}
          </div>

          {/* Pattern alerts block */}
          <div className="p-4 border border-white/5 bg-zinc-950/40 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-black block">Blocker Pattern Miner</span>
              <div className="space-y-2 max-h-[110px] overflow-y-auto pr-1">
                {blockerPatterns.slice(0, 3).map((pat, idx) => (
                  <div key={pat.label} className="p-2 border border-white/5 bg-black/40 flex justify-between items-center text-[10px]">
                    <span className="font-mono text-zinc-350">{pat.label}</span>
                    <span className="px-1.5 py-0.5 font-bold font-mono text-zinc-400 bg-white/5 text-[9px]">
                      {pat.count} logs
                    </span>
                  </div>
                ))}

                {blockerPatterns.length === 0 && (
                  <div className="text-center py-6 text-[10px] font-mono text-zinc-600 uppercase tracking-wider">
                    No focus blockers evaluated yet. Keep logging!
                  </div>
                )}
              </div>
            </div>

            {/* General recommendation advice */}
            {blockerPatterns.length > 0 && (
              <div className="border-t border-white/5 pt-2.5 flex items-start gap-1.5 text-[9px] text-zinc-500 font-mono leading-tight">
                <AlertTriangle className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                <p>
                  Frequent mentions of <strong className="text-zinc-400 font-bold">"{blockerPatterns[0].label}"</strong> are disrupting progression timelines.
                </p>
              </div>
            )}
          </div>

        </section>
      )}

      {/* 4. Weekly Digest panel */}
      {weeklyDigest ? (
        <section className="p-5 border border-amber-500/10 bg-amber-950/5 relative overflow-hidden">
          <div className="absolute right-3 top-3 opacity-15">
            <Heart className="w-16 h-16 text-amber-500" />
          </div>

          <div className="space-y-3.5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 pb-2.5 gap-2">
              <div className="space-y-0.5">
                <span className="text-[8px] font-mono bg-amber-505/10 border border-amber-500/20 text-amber-400 py-0.5 px-1.5 uppercase tracking-widest font-black rounded-none">
                  Weekly Journal Accountability Digest
                </span>
                <h4 className="text-sm font-black uppercase tracking-tight text-white mt-1">Mental Health & Performance Horizon</h4>
              </div>
              
              <div className="flex gap-4 font-mono text-[9px] text-zinc-450 uppercase tracking-widest shrink-0">
                <span>logs this week: <strong>{weeklyDigest.count}</strong></span>
                <span>avg energy: <strong className="text-emerald-400">{weeklyDigest.avgMood}/10</strong></span>
                <span>avg stress: <strong className="text-rose-450">{weeklyDigest.avgStress}/10</strong></span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Insight list */}
              <div className="space-y-1 bg-black/25 p-3 border border-white/5">
                <div className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-400 uppercase font-black tracking-widest">
                  <Smile className="w-3.5 h-3.5 text-emerald-400" />
                  Top Insights & Learnings
                </div>
                <div className="pt-1.5 space-y-1.5">
                  {weeklyDigest.insights.map((ins, i) => (
                    <p key={`ins-${i}`} className="text-[10px] text-zinc-350 leading-relaxed font-sans pl-2 border-l border-emerald-500/30">
                      "{ins}"
                    </p>
                  ))}
                  {weeklyDigest.insights.length === 0 && <p className="text-[9px] font-mono text-zinc-600 italic">No Insights logged yet this cycle.</p>}
                </div>
              </div>

              {/* Blockers list */}
              <div className="space-y-1 bg-black/25 p-3 border border-white/5">
                <div className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-440 uppercase font-black tracking-widest">
                  <Frown className="w-3.5 h-3.5 text-rose-400" />
                  Blockers & Focus Gaps
                </div>
                <div className="pt-1.5 space-y-1.5">
                  {weeklyDigest.blockers.map((blk, i) => (
                    <p key={`blk-${i}`} className="text-[10px] text-zinc-350 leading-relaxed font-sans pl-2 border-l border-rose-500/30">
                      "{blk}"
                    </p>
                  ))}
                  {weeklyDigest.blockers.length === 0 && <p className="text-[9px] font-mono text-zinc-600 italic">No blockers evaluated this week.</p>}
                </div>
              </div>

              {/* Action items list */}
              <div className="space-y-1 bg-black/25 p-3 border border-white/5">
                <div className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-400 uppercase font-black tracking-widest">
                  <Activity className="w-3.5 h-3.5 text-sky-400" />
                  Pivots & Daily Adjustments
                </div>
                <div className="pt-1.5 space-y-1.5">
                  {weeklyDigest.improvements.map((imp, i) => (
                    <p key={`imp-${i}`} className="text-[10px] text-zinc-350 leading-relaxed font-sans pl-2 border-l border-sky-550/30">
                      "To do differently: {imp}"
                    </p>
                  ))}
                  {weeklyDigest.improvements.length === 0 && <p className="text-[9px] font-mono text-zinc-600 italic">No action indicators logged this sweep.</p>}
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="p-4 border border-zinc-800/50 bg-zinc-950/10 text-center text-zinc-550 py-6 text-[10px] font-mono uppercase tracking-widest">
          ⚠️ Journal weekly digest unlocks once you log reflections within a 7-day window.
        </section>
      )}

      {/* 5. Custom Search filters & Search box */}
      <section className="space-y-3.5 border-t border-white/5 pt-4">
        <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block font-black">
          Timeline Filter & History Log Range
        </label>

        <div className="flex flex-col md:flex-row gap-3">
          {/* Quick Filter tabs */}
          <div className="flex flex-wrap gap-2 flex-1">
            {['ALL', 'Insight', 'Reminder', 'Mistake', 'Victory', 'Blocker'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTabFilter(tab as any)}
                className={`px-3 py-1.5 text-[9px] font-mono uppercase tracking-widest border transition-all ${
                  activeTabFilter === tab 
                    ? 'border-orange-500 bg-orange-950/20 text-orange-400 font-bold' 
                    : 'border-white/5 text-zinc-500 bg-transparent hover:text-white hover:border-white/20'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {/* Horizon selectors */}
            <select
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value as any)}
              className="bg-zinc-950 border border-white/5 p-2 text-[9px] font-mono text-zinc-400 uppercase outline-none focus:border-white cursor-pointer"
            >
              <option value="ALL">All Horizons</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
            </select>

            {/* Keyword Input search box */}
            <div className="relative w-44">
              <input
                type="text"
                placeholder="Search index keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#050505] pl-8 pr-3 py-2 border border-white/5 text-[10px] font-mono text-white placeholder-zinc-650 uppercase tracking-wide outline-none focus:border-white"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-650" />
            </div>
          </div>
        </div>
      </section>

      {/* 6. Main Journals Timeline list container */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredReflections.map(ref => {
            const sentiment = parseSentiment(ref);
            const isExpanded = expandedReflectionId === ref.id;
            const hasExtraContent = ref.whatWorked || ref.whatBlocked || ref.whatSurprised || ref.whatToDoDifferently;
            const relatedTaskName = ref.relatedTaskId ? allTasks.find(t => t.id === ref.relatedTaskId)?.text : null;

            return (
              <motion.div
                layoutId={`ref-${ref.id}`}
                key={ref.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="border border-white/5 bg-zinc-950/40 relative group overflow-hidden"
              >
                {/* Optional atmospheric image visual background layout */}
                {ref.photo && (
                  <div className="absolute right-0 top-0 bottom-0 w-32 md:w-56 overflow-hidden pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity">
                    <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 to-transparent z-10" />
                    <img src={ref.photo} alt="Texture backdrop" referrerPolicy="no-referrer" className="w-full h-full object-cover grayscale brightness-50" />
                  </div>
                )}

                <div className="p-4 space-y-3">
                  {/* Top line metadata elements */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[8px] font-mono uppercase tracking-widest px-1.5 py-0.5 border ${
                        ref.tag === 'Victory' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-950/10' :
                        ref.tag === 'Blocker' ? 'border-rose-500/20 text-rose-400 bg-rose-950/10' :
                        ref.tag === 'Insight' ? 'border-sky-500/25 text-sky-400 bg-sky-950/10' :
                        ref.tag === 'Reminder' ? 'border-orange-500/20 text-orange-400 bg-orange-950/10' :
                        'border-zinc-500/20 text-zinc-400 bg-zinc-950/20'
                      }`}>
                        {ref.tag}
                      </span>

                      {/* Sentiment Badge on each reflection */}
                      <span className={`text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 border ${sentiment.color} flex items-center gap-1`}>
                        <span>{sentiment.emoji}</span>
                        <span>{sentiment.label}</span>
                      </span>

                      {/* Score metrics */}
                      {(ref.moodEnergy || ref.stressLevel) && (
                        <span className="text-[8px] font-mono text-zinc-500 uppercase flex items-center gap-1 bg-white/[0.01] px-1 border border-white/5">
                          <span>mood: <strong>{ref.moodEnergy || 5}</strong></span>
                          <span>|</span>
                          <span>stress: <strong>{ref.stressLevel || 5}</strong></span>
                        </span>
                      )}

                      {/* Template label */}
                      {ref.templateId && ref.templateId !== 'quick' && (
                        <span className="text-[7px] font-mono text-zinc-650 bg-white/5 px-1 py-0.5 uppercase tracking-widest">
                          🧩 {ref.templateId} pattern
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1 text-[9px] text-zinc-500 font-mono">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(ref.createdAt || ref.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      
                      <button
                        onClick={() => onDeleteReflection(ref.id)}
                        className="p-1 text-zinc-700 hover:text-red-400 transition-colors border border-transparent hover:border-white/5"
                        title="Delete log permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Primary text content or Headline summary */}
                  <div className="space-y-1 my-1 pr-32 md:pr-56">
                    <h3 className="text-sm font-black font-mono uppercase text-white leading-tight">
                      "{ref.text}"
                    </h3>
                  </div>

                  {/* Expandable sub parts (4 questions structure) */}
                  {hasExtraContent && (
                    <div className="pt-1.5 space-y-3.5 border-t border-white/5">
                      {isExpanded ? (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono"
                        >
                          {ref.whatWorked && (
                            <div className="space-y-1 bg-zinc-950/60 p-3 pt-2.5 border-l-2 border-emerald-500">
                              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">What worked:</span>
                              <p className="text-zinc-300 font-sans leading-relaxed">{ref.whatWorked}</p>
                            </div>
                          )}

                          {ref.whatBlocked && (
                            <div className="space-y-1 bg-zinc-950/60 p-3 pt-2.5 border-l-2 border-rose-500">
                              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">What blocked:</span>
                              <p className="text-zinc-300 font-sans leading-relaxed">{ref.whatBlocked}</p>
                            </div>
                          )}

                          {ref.whatSurprised && (
                            <div className="space-y-1 bg-zinc-950/60 p-3 pt-2.5 border-l-2 border-amber-500">
                              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">Surprised / Insights:</span>
                              <p className="text-zinc-300 font-sans leading-relaxed">{ref.whatSurprised}</p>
                            </div>
                          )}

                          {ref.whatToDoDifferently && (
                            <div className="space-y-1 bg-zinc-950/60 p-3 pt-2.5 border-l-2 border-sky-500">
                              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">Pivots for tomorrow:</span>
                              <p className="text-zinc-300 font-sans leading-relaxed">{ref.whatToDoDifferently}</p>
                            </div>
                          )}
                        </motion.div>
                      ) : (
                        <p className="text-xs text-zinc-400 font-sans leading-relaxed line-clamp-2">
                          {ref.whatWorked || ref.whatBlocked || ref.whatSurprised || ref.whatToDoDifferently}
                        </p>
                      )}

                      {/* Expand Toggle */}
                      <button
                        onClick={() => setExpandedReflectionId(isExpanded ? null : ref.id)}
                        className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-3.5 h-3.5" />
                            Collapse Structured Audit
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5" />
                            Expand Guided 4-Question Audit ({ref.templateId || 'Standard'})
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Related Tasks displays link */}
                  {relatedTaskName && (
                    <div className="flex items-center gap-1.5 pt-1.5 text-[9px] font-mono text-zinc-550 border-t border-white/[0.03]">
                      <Target className="w-3 h-3 text-zinc-650" />
                      <span>Linked Task Focus:</span>
                      <span className="bg-white/5 px-2 py-0.5 border border-white/5 text-zinc-400">{relatedTaskName}</span>
                    </div>
                  )}

                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredReflections.length === 0 && (
          <div className="py-20 text-center text-zinc-500 border border-dashed border-white/5 max-w-sm mx-auto space-y-3.5">
            <BookOpen className="w-12 h-12 mx-auto opacity-15 stroke-1" />
            <div className="space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-widest font-black text-zinc-400">All journal pages are unwritten</p>
              <p className="text-[11px] text-zinc-650 font-sans max-w-xs mx-auto">
                No reflections found under filtered parameters. Document your focus signals to avoid cognitive pollution.
              </p>
            </div>
            <button
              onClick={() => {
                setShowAddForm(true);
                handleApplyTemplate(TEMPLATES[0]);
              }}
              className="py-1 px-3 border border-orange-500/20 bg-orange-950/10 text-orange-400 text-[10px] font-mono uppercase tracking-widest hover:border-orange-500"
            >
              ✍️ Write First Log
            </button>
          </div>
        )}
      </div>

    </motion.div>
  );
}
