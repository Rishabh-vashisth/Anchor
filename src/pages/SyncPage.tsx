import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cloud, 
  CloudOff, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  User, 
  Smartphone, 
  Laptop, 
  History, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Lock, 
  Database, 
  Network, 
  Braces, 
  FileText, 
  Check, 
  ArrowRight, 
  LockKeyhole, 
  Cpu, 
  ShieldCheck,
  Globe,
  Settings,
  Zap,
  Radio,
  FileCode,
  ListRestart
} from 'lucide-react';
import { Calendar as CalendarIcon, Key, Link2, RefreshCw as LoopIcon, Copy, HelpCircle, LogOut } from 'lucide-react';
import { Task, Goal, NotificationSettings, TimeBlock, GoogleCalendarSettings, GoogleCalendarEvent, GoogleSyncLog } from '../types';
import { 
  getGoogleAuthUrl, 
  fetchCalendarList, 
  createAnchorCalendar, 
  fetchCalendarEvents, 
  writeBlocksToCalendar,
  detectTimeConflicts
} from '../utils/googleCalendarService';

interface SyncPageProps {
  key?: string;
  tasks: Task[];
  goals: Goal[];
  streak: number;
  timeBlocks: TimeBlock[];
  googleCalendarSettings?: GoogleCalendarSettings;
  googleCachedToken?: string | null;
  googleTokenExpiry?: number | null;
  googleCalendarEvents: GoogleCalendarEvent[];
  googleSyncLogs: GoogleSyncLog[];
  updateGoogleCalendarSettings: (settings: Partial<GoogleCalendarSettings>) => void;
  disconnectCalendar: () => void;
  addGoogleSyncLog: (type: 'info' | 'success' | 'warn' | 'error', message: string) => void;
  clearGoogleSyncLogs: () => void;
  saveGoogleCalendarEvents: (events: GoogleCalendarEvent[]) => void;
}

interface SimulatedDevice {
  id: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet';
  lastActive: string;
  ipAddress: string;
  current: boolean;
}

interface QueueItem {
  id: string;
  action: 'ADD_TASK' | 'UPDATE_TASK' | 'DELETE_TASK' | 'CREATE_GOAL' | 'SYNC_SETTINGS';
  details: string;
  timestamp: number;
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
}

interface SyncHistoryLog {
  id: string;
  type: 'auth' | 'sync_push' | 'sync_pull' | 'conflict_resolve' | 'device_access';
  message: string;
  timestamp: number;
  status: 'success' | 'warning' | 'error';
}

export function SyncPage({ 
  tasks = [], 
  goals = [], 
  timeBlocks = [],
  googleCalendarSettings,
  googleCachedToken = null,
  googleTokenExpiry = null,
  googleCalendarEvents = [],
  googleSyncLogs = [],
  updateGoogleCalendarSettings,
  disconnectCalendar,
  addGoogleSyncLog,
  clearGoogleSyncLogs,
  saveGoogleCalendarEvents
}: SyncPageProps) {
  // Navigation tabs for the technical specs
  const [activeSpecTab, setActiveSpecTab] = useState<'FRONTEND' | 'API' | 'SCHEMA' | 'OFFLINE_STRATEGY'>('FRONTEND');

  // Simulated live states
  const [networkStatus, setNetworkStatus] = useState<'ONLINE' | 'OFFLINE'>('ONLINE');
  const [syncStatus, setSyncStatus] = useState<'SYNCED' | 'SYNCING' | 'PENDING' | 'ERROR'>('SYNCED');

  // Google Calendar Integration states
  const currentSettings = googleCalendarSettings || {
    connected: false,
    clientId: '',
    calendarId: 'primary',
    calendarName: 'Primary Calendar',
    syncEnabled: false,
    syncConflictsWarn: true,
    lastSynced: null,
  };

  const [clientIdInput, setClientIdInput] = useState(currentSettings.clientId);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
  const [calendarOptions, setCalendarOptions] = useState<{ id: string; summary: string }[]>([]);
  const [loadingCalendars, setLoadingCalendars] = useState(false);
  const [copiedUri, setCopiedUri] = useState(false);

  useEffect(() => {
    if (googleCachedToken && googleTokenExpiry && Date.now() < googleTokenExpiry) {
      setLoadingCalendars(true);
      fetchCalendarList(googleCachedToken)
        .then(list => {
          setCalendarOptions(list);
        })
        .catch(err => {
          console.error(err);
          addGoogleSyncLog('error', `Could not list calendars. Token may be expired: ${err.message}`);
        })
        .finally(() => {
          setLoadingCalendars(false);
        });
    }
  }, [googleCachedToken]);

  const handleGoogleConnect = () => {
    if (!clientIdInput.trim()) {
      addGoogleSyncLog('error', 'Google Cloud OAuth Client ID is required to initiate connection.');
      return;
    }
    
    updateGoogleCalendarSettings({ clientId: clientIdInput.trim() });
    
    const redirectUri = window.location.origin + window.location.pathname;
    const authUrl = getGoogleAuthUrl(clientIdInput.trim(), redirectUri);
    
    addGoogleSyncLog('info', 'Redirecting to Google Accounts for OAuth verification...');
    window.location.href = authUrl;
  };

  const handleSyncBlocksNow = async () => {
    if (!googleCachedToken) {
      addGoogleSyncLog('error', 'Sync aborted. Authenticated token is missing or expired.');
      return;
    }
    
    setIsSyncingCalendar(true);
    addGoogleSyncLog('info', 'Initiating block synchronization transaction with Google Calendar API...');
    
    try {
      addGoogleSyncLog('info', 'Downloading primary meetings calendar for conflict scanning...');
      const events = await fetchCalendarEvents(googleCachedToken, 'primary', 14);
      saveGoogleCalendarEvents(events);
      addGoogleSyncLog('success', `Fetched ${events.length} upcoming meetings/events for contextual display.`);

      const targetId = currentSettings.calendarId;
      addGoogleSyncLog('info', `Deploying focus blocks in the week range to Selected Calendar...`);
      
      const syncedCount = await writeBlocksToCalendar(googleCachedToken, targetId, timeBlocks);
      
      updateGoogleCalendarSettings({ lastSynced: Date.now() });
      addGoogleSyncLog('success', `Transaction success! Synchronized ${syncedCount} focus blocks to your calendar.`);

      const conflicts = detectTimeConflicts(timeBlocks, events);
      if (conflicts.length > 0) {
        addGoogleSyncLog('warn', `Checked conflicts: Found ${conflicts.length} schedule overlaps with external meetings! Check Dashboard alerts.`);
      } else {
        addGoogleSyncLog('success', 'Focus check: Zero schedule conflicts detected with external meetings!');
      }
    } catch (err: any) {
      addGoogleSyncLog('error', `Google Calendar Sync Error: ${err.message}`);
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  const handleCreateCustomCalendar = async () => {
    if (!googleCachedToken) return;
    setLoadingCalendars(true);
    addGoogleSyncLog('info', 'Creating secondary "Anchor Blocks" calendar in your Google account...');
    try {
      const cal = await createAnchorCalendar(googleCachedToken);
      updateGoogleCalendarSettings({
        calendarId: cal.id,
        calendarName: cal.summary,
      });
      setCalendarOptions(prev => [...prev, cal]);
      addGoogleSyncLog('success', `Successfully created standalone calendar: "${cal.summary}"! Connected.`);
    } catch (err: any) {
      addGoogleSyncLog('error', `Failed to create secondary calendar: ${err.message}`);
    } finally {
      setLoadingCalendars(false);
    }
  };

  const copyRedirectUriToClipboard = () => {
    const redirectUri = window.location.origin + window.location.pathname;
    navigator.clipboard.writeText(redirectUri);
    setCopiedUri(true);
    setTimeout(() => setCopiedUri(false), 2000);
  };
  
  // Auth control
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [authMethod, setAuthMethod] = useState<'EMAIL' | 'GOOGLE' | 'GITHUB' | null>('GOOGLE');
  const [userProfile, setUserProfile] = useState({
    name: 'Rishabh Vashisth',
    email: 'vashisthrishabh146@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    joined: '2026-03-10'
  });

  // Client states
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Device Management
  const [devices, setDevices] = useState<SimulatedDevice[]>([
    { id: 'dev-1', name: 'MacBook Pro 16" (Current)', type: 'desktop', lastActive: 'Just Now', ipAddress: '154.66.192.12', current: true },
    { id: 'dev-2', name: 'iPhone 15 Pro Max', type: 'mobile', lastActive: '3 minutes ago', ipAddress: '172.56.21.90', current: false },
    { id: 'dev-3', name: 'Work Linux PC', type: 'desktop', lastActive: '2 hours ago', ipAddress: '192.164.1.4', current: false },
    { id: 'dev-4', name: 'iPad Air Workspace', type: 'tablet', lastActive: 'Yesterday', ipAddress: '192.164.1.8', current: false }
  ]);

  // Selective Sync Settings
  const [selectiveSync, setSelectiveSync] = useState({
    tasks: true,
    ideas: true,
    goals: true,
    reflections: true,
    timeBlocks: true,
    blockTemplates: true
  });

  const [conflictStrategy, setConflictStrategy] = useState<'LWW' | 'MANUAL'>('MANUAL');

  // Interactive replication queue
  const [replicationQueue, setReplicationQueue] = useState<QueueItem[]>([
    { id: 'q-1', action: 'UPDATE_TASK', details: 'Completed "Establish visual telemetry grids"', timestamp: Date.now() - 60000 * 5, status: 'SYNCED' },
    { id: 'q-2', action: 'CREATE_GOAL', details: 'Added Goal "Finish Cloud Security Specs"', timestamp: Date.now() - 60000 * 2, status: 'SYNCED' }
  ]);

  // Interactive sync history
  const [syncHistory, setSyncHistory] = useState<SyncHistoryLog[]>([
    { id: 'log-1', type: 'auth', message: 'User authenticated successfully via Google OpenID provider', timestamp: Date.now() - 3600000 * 4, status: 'success' },
    { id: 'log-2', type: 'sync_pull', message: 'Pull transaction matched server state (18 items verified)', timestamp: Date.now() - 3600000 * 3, status: 'success' },
    { id: 'log-3', type: 'device_access', message: 'Registered connection channel for iPad Air Workspace', timestamp: Date.now() - 3600000 * 2, status: 'success' },
    { id: 'log-4', type: 'sync_push', message: 'Pushed local tracking cache to Firestore remote endpoint', timestamp: Date.now() - 60000 * 5, status: 'success' }
  ]);

  // Input for custom replication queue simulation
  const [simulatedActionText, setSimulatedActionText] = useState('');
  const [simulatedActionType, setSimulatedActionType] = useState<QueueItem['action']>('ADD_TASK');

  // Trigger interactive conflict popup
  const [activeConflict, setActiveConflict] = useState<{
    id: string;
    field: string;
    localValue: string;
    localTime: string;
    serverValue: string;
    serverTime: string;
  } | null>(null);

  // Handle Log Out / In Simulations
  const handleSignOut = () => {
    setIsLoggedIn(false);
    setAuthMethod(null);
    setSyncHistory(prev => [
      { id: `log-${Date.now()}`, type: 'auth', message: 'Session terminated. Access tokens flushed locally.', timestamp: Date.now(), status: 'warning' },
      ...prev
    ]);
  };

  const handleSignInSimulate = (method: 'EMAIL' | 'GOOGLE' | 'GITHUB') => {
    setAuthMethod(method);
    setIsLoggedIn(true);
    if (method === 'EMAIL') {
      setUserProfile({
        name: emailInput.split('@')[0] || 'New Explorer',
        email: emailInput || 'explorer@anchor.dev',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
        joined: new Date().toISOString().split('T')[0]
      });
    } else if (method === 'GOOGLE') {
      setUserProfile({
        name: 'Rishabh Vashisth',
        email: 'vashisthrishabh146@gmail.com',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        joined: '2026-03-10'
      });
    } else {
      setUserProfile({
        name: 'rishabh-vashisth-git',
        email: 'vashisthrishabh146@gmail.com',
        avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=200',
        joined: '2026-04-01'
      });
    }
    setSyncHistory(prev => [
      { id: `log-${Date.now()}`, type: 'auth', message: `Authenticated via ${method} auth credentials. Issued JWT secure context.`, timestamp: Date.now(), status: 'success' },
      ...prev
    ]);
    setEmailInput('');
    setPasswordInput('');
  };

  // Revoke device
  const handleRevokeDevice = (id: string, name: string) => {
    setDevices(prev => prev.filter(d => d.id !== id));
    setSyncHistory(prev => [
      { id: `log-${Date.now()}`, type: 'device_access', message: `Revoked access of device "${name}". Session keys expired.`, timestamp: Date.now(), status: 'warning' },
      ...prev
    ]);
  };

  // Add items while offline / online
  const handleCreateSimulatedChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulatedActionText.trim()) return;

    const newId = `q-${Math.random().toString(36).substr(2, 9)}`;
    const newItem: QueueItem = {
      id: newId,
      action: simulatedActionType,
      details: simulatedActionText.trim(),
      timestamp: Date.now(),
      status: networkStatus === 'ONLINE' ? 'SYNCING' : 'PENDING'
    };

    setReplicationQueue(prev => [newItem, ...prev]);

    if (networkStatus === 'ONLINE') {
      setSyncStatus('SYNCING');
      setSyncHistory(prev => [
        { id: `log-${Date.now()}`, type: 'sync_push', message: `Queue push initiated for raw action "${simulatedActionType}".`, timestamp: Date.now(), status: 'success' },
        ...prev
      ]);

      // Simulate network processing delay
      setTimeout(() => {
        setReplicationQueue(currentQueue => 
          currentQueue.map(item => item.id === newId ? { ...item, status: 'SYNCED' } : item)
        );
        setSyncStatus('SYNCED');
        setSyncHistory(prev => [
          { id: `log-${Date.now()}`, type: 'sync_push', message: `Successfully committed ${simulatedActionType}: "${simulatedActionText}" to Cloud Repository.`, timestamp: Date.now(), status: 'success' },
          ...prev
        ]);
      }, 1500);
    } else {
      setSyncStatus('PENDING');
      setSyncHistory(prev => [
        { id: `log-${Date.now()}`, type: 'sync_push', message: `Queue cached offline: "${simulatedActionType}" postponed [No active transport].`, timestamp: Date.now(), status: 'warning' },
        ...prev
      ]);
    }

    setSimulatedActionText('');
  };

  // Turn connection state On / Off
  const toggleNetworkStatus = () => {
    if (networkStatus === 'OFFLINE') {
      // Reconnecting! Process all pending items in queue
      setNetworkStatus('ONLINE');
      const pendingCount = replicationQueue.filter(item => item.status === 'PENDING').length;
      
      if (pendingCount > 0) {
        setSyncStatus('SYNCING');
        setSyncHistory(prev => [
          { id: `log-${Date.now()}`, type: 'sync_push', message: `Socket connection re-established. Flushing ${pendingCount} buffered queue frames...`, timestamp: Date.now(), status: 'success' },
          ...prev
        ]);

        // Process sequentially
        setReplicationQueue(currentQueue => 
          currentQueue.map(item => item.status === 'PENDING' ? { ...item, status: 'SYNCING' } : item)
        );

        setTimeout(() => {
          setReplicationQueue(currentQueue => 
            currentQueue.map(item => item.status === 'SYNCING' ? { ...item, status: 'SYNCED' } : item)
          );
          setSyncStatus('SYNCED');
          setSyncHistory(prev => [
            { id: `log-${Date.now()}`, type: 'sync_push', message: `All ${pendingCount} offline buffered items replication transaction complete. Cache matching cloud version 100%.`, timestamp: Date.now(), status: 'success' },
            ...prev
          ]);
        }, 2000);
      } else {
        setSyncStatus('SYNCED');
        setSyncHistory(prev => [
          { id: `log-${Date.now()}`, type: 'sync_pull', message: `Reconnected. Pulled incremental delta changes: 0 modifications detected.`, timestamp: Date.now(), status: 'success' },
          ...prev
        ]);
      }
    } else {
      // Disconnecting
      setNetworkStatus('OFFLINE');
      setSyncHistory(prev => [
        { id: `log-${Date.now()}`, type: 'sync_pull', message: `Transport connection disconnected. Enabling offline sandboxing module. All mutations writing to local IndexedDB fallback queue.`, timestamp: Date.now(), status: 'warning' },
        ...prev
      ]);
    }
  };

  // Simulate Conflict trigger
  const triggerConflictSimulation = () => {
    setActiveConflict({
      id: 'task-104',
      field: 'title',
      localValue: 'Draft Architecture with Drizzle & JWT Specs',
      localTime: '12:10:04 PM (Your Device - Local changes)',
      serverValue: 'Draft Secure Token Backend Integration (Google Auth)',
      serverTime: '12:10:01 PM (Macbook Pro - Saved on Cloud)'
    });
    setSyncHistory(prev => [
      { id: `log-${Date.now()}`, type: 'conflict_resolve', message: `Detected merge write execution collision on Task #104. Transport lock initialized.`, timestamp: Date.now(), status: 'warning' },
      ...prev
    ]);
  };

  // Resolve conflict
  const resolveConflictChoice = (winner: 'LOCAL' | 'SERVER') => {
    if (!activeConflict) return;

    const chosenVal = winner === 'LOCAL' ? activeConflict.localValue : activeConflict.serverValue;
    
    setSyncHistory(prev => [
      { id: `log-${Date.now()}`, type: 'conflict_resolve', message: `Merge collision on Task #104 resolved successfully using ${winner === 'LOCAL' ? 'Client Local override' : 'Server Cloud authority'}. Committed final string: "${chosenVal}".`, timestamp: Date.now(), status: 'success' },
      ...prev
    ]);

    // Push resolution notification to replication queue
    const conflictLogItem: QueueItem = {
      id: `q-${Math.random().toString(36).substr(2, 9)}`,
      action: 'UPDATE_TASK',
      details: `Collision override resolved: "${chosenVal}"`,
      timestamp: Date.now(),
      status: 'SYNCED'
    };

    setReplicationQueue(prev => [conflictLogItem, ...prev]);
    setActiveConflict(null);
  };

  // Run auto Last-Write-Wins logic demo
  const triggerLwwSimulation = () => {
    const timeLocal = Date.now();
    const timeServer = Date.now() - 3000; // Server is older

    setSyncHistory(prev => [
      { id: `log-${Date.now()}`, type: 'conflict_resolve', message: `Collision trigger on Goal #15: local modification (${new Date(timeLocal).toLocaleTimeString()}) compared to older cloud revision (${new Date(timeServer).toLocaleTimeString()}).`, timestamp: Date.now(), status: 'warning' },
      ...prev
    ]);

    setTimeout(() => {
      setSyncHistory(prev => [
        { id: `log-${Date.now()}`, type: 'conflict_resolve', message: `LWW Engine Auto-Resolved: Overwrote Server file with Client State (Client is +3000ms newer). Broadcasted frame update.`, timestamp: Date.now(), status: 'success' },
        ...prev
      ]);
    }, 1000);
  };

  // Delete log item
  const handleDeleteLogItem = (id: string) => {
    setSyncHistory(prev => prev.filter(l => l.id !== id));
  };

  // Clear all log items safely
  const handleClearHistory = () => {
    setSyncHistory([]);
  };

  return (
    <div className="space-y-6 font-mono text-white p-4 max-w-full select-text pb-20">
      
      {/* Title block */}
      <div className="border border-white/5 bg-zinc-950/40 p-4 space-y-1.5 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-48 h-48 bg-orange-500/5 blur-3xl rounded-full" />
        <div className="flex items-center gap-2 text-orange-500">
          <Cloud className="w-5 h-5" />
          <span className="text-[10px] tracking-[0.2em] uppercase font-black">Anchor Core Telemetry</span>
        </div>
        <h2 className="text-xl font-black uppercase text-white tracking-tight">
          Cloud Synchronizer & Backend Architecture Suite
        </h2>
        <p className="text-xs text-zinc-400 font-sans leading-relaxed max-w-2xl">
          Anchor leverages real-time distributed IndexedDB queuing paired with server-side WebSocket state syncing. This sandbox simulates the end-to-end multi-device replication layer, offline caching states, and conflict resolution protocols, integrated with our high-fidelity database schema blueprints.
        </p>
      </div>

      {/* Grid: Toggler and Interactive Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Simulation Control panel */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section: Live Connection Status Box */}
          <div className="border border-white/5 bg-zinc-950/60 p-4 space-y-4">
            <div className="flex justify-between items-center bg-zinc-900/60 -m-4 mb-2 px-4 py-2.5 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-zinc-500 animate-pulse" />
                <span className="text-[10px] uppercase font-black text-zinc-400">Live Infrastructure Sandbox</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Visual indicator (🔄 syncing, ✓ synced, ⚠️ pending) */}
                {networkStatus === 'OFFLINE' ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-amber-500/30 text-amber-500 text-[9px] bg-amber-500/5">
                    <CloudOff className="w-2.5 h-2.5 animate-pulse" /> OFFLINE BUFFERING
                  </span>
                ) : syncStatus === 'SYNCING' ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-blue-500/30 text-blue-400 text-[9px] bg-blue-500/5">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" /> 🔄 SYNCING TO CLOUD
                  </span>
                ) : syncStatus === 'PENDING' ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-amber-400/30 text-amber-400 text-[9px] bg-amber-450/5">
                    <AlertTriangle className="w-2.5 h-2.5 animate-bounce" /> ⚠️ SYNC PENDING
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-emerald-500/30 text-emerald-400 text-[9px] bg-emerald-500/5">
                    <CheckCircle2 className="w-2.5 h-2.5" /> ✓ SECURELY SYNCED
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              Test transparent offline storage. Toggle the connection state to **Offline** and modify data parameters. System mutations immediately buffer, queuing safely until recovery protocols kick in.
            </p>

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                onClick={toggleNetworkStatus}
                className={`py-1.5 px-4 text-xs font-black uppercase tracking-widest border transition-all flex items-center gap-2 cursor-pointer ${
                  networkStatus === 'ONLINE'
                    ? 'bg-emerald-950/20 border-emerald-500 text-emerald-400 hover:bg-emerald-950/40'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'
                }`}
              >
                {networkStatus === 'ONLINE' ? (
                  <>
                    <Wifi className="w-3.5 h-3.5 animate-pulse" /> Transport Online
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-zinc-500" /> Go Online
                  </>
                )}
              </button>

              <button
                onClick={toggleNetworkStatus}
                className={`py-1.5 px-4 text-xs font-black uppercase tracking-widest border transition-all flex items-center gap-2 cursor-pointer ${
                  networkStatus === 'OFFLINE'
                    ? 'bg-amber-950/20 border-amber-500 text-amber-500 hover:bg-amber-950/40'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'
                }`}
              >
                {networkStatus === 'OFFLINE' ? (
                  <>
                    <CloudOff className="w-3.5 h-3.5" /> Client Offline
                  </>
                ) : (
                  <>
                    <Cloud className="w-3.5 h-3.5 text-zinc-500" /> Simulate Offline
                  </>
                )}
              </button>
            </div>
          </div>

          {/* User Sign-In simulation panel */}
          <div className="border border-white/5 bg-zinc-950/40 p-4 space-y-4">
            <span className="text-[10px] uppercase font-black text-zinc-500 tracking-wider block">1. Authentication & Profiling Layer</span>
            
            <AnimatePresence mode="wait">
              {isLoggedIn ? (
                /* Profile view */
                <motion.div
                  key="profile-active"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-3.5 p-3.5 bg-white/[0.01] border border-white/5">
                    <img
                      src={userProfile.avatar}
                      referrerPolicy="no-referrer"
                      alt={userProfile.name}
                      className="w-12 h-12 border border-white/10 shrink-0 object-cover"
                    />
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black uppercase tracking-tight text-white truncate">
                          {userProfile.name}
                        </h4>
                        <span className="text-[7.5px] uppercase font-bold px-1.5 py-0.5 bg-orange-600/10 border border-orange-500/20 text-orange-400">
                          Active Client
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 truncate">{userProfile.email}</p>
                      <div className="flex gap-2 text-[8.5px] text-zinc-500 font-mono">
                        <span>Identity Provider: {authMethod}</span>
                        <span>•</span>
                        <span>Registered: {userProfile.joined}</span>
                      </div>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="shrink-0 text-[9px] border border-red-500/20 text-zinc-400 hover:text-red-400 hover:bg-red-500/[0.02] px-2.5 py-1.5 font-bold uppercase transition-all"
                    >
                      Sign Out
                    </button>
                  </div>

                  {/* Device listing section */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] uppercase font-black text-zinc-400 tracking-widest">
                        🛡️ Target Active Device Topology ({devices.length})
                      </span>
                      <span className="text-[8px] text-zinc-500 uppercase">Revoke to invalidate session tokens</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {devices.map(device => (
                        <div key={device.id} className="p-2.5 border border-white/5 bg-zinc-950/60 flex items-start gap-2.5">
                          {device.type === 'desktop' ? (
                            <Laptop className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                          ) : (
                            <Smartphone className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                          )}
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <span className="text-xs font-bold text-white truncate block">{device.name}</span>
                            <span className="text-[8px] tracking-wide text-zinc-500 block font-mono">
                              IP: {device.ipAddress} • {device.lastActive}
                            </span>
                            {device.current ? (
                              <span className="text-[7.5px] px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase font-black tracking-widest mt-1 inline-block">
                                This Device
                              </span>
                            ) : (
                              <button
                                onClick={() => handleRevokeDevice(device.id, device.name)}
                                className="text-[7.5px] text-red-400 hover:underline uppercase font-bold tracking-widest mt-1 block hover:text-red-300 transition-all text-left"
                              >
                                Revoke Session ✕
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* Logout Form view */
                <motion.div
                  key="auth-auth"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-4"
                >
                  <p className="text-[10px] text-zinc-500 leading-normal font-sans">
                    Authenticate to activate cloud backup bridges. Credentials produce valid sandbox authorization nodes.
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleSignInSimulate('GOOGLE')}
                      className="py-2 px-3 border border-red-500/10 bg-red-950/10 space-y-1 text-center hover:border-red-500/30 transition-all"
                    >
                      <span className="text-xs text-red-400 font-bold block uppercase tracking-wider">OAuth Google API</span>
                      <span className="text-[8px] text-zinc-500 block">Single sign-on</span>
                    </button>
                    <button
                      onClick={() => handleSignInSimulate('GITHUB')}
                      className="py-2 px-3 border border-zinc-700 bg-zinc-900/40 space-y-1 text-center hover:border-white/30 transition-all"
                    >
                      <span className="text-xs text-white font-bold block uppercase tracking-wider">OAuth GitHub ID</span>
                      <span className="text-[8px] text-zinc-500 block font-mono">Secure SSH proxy</span>
                    </button>
                  </div>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-white/5"></div>
                    <span className="flex-shrink mx-3 text-[8.5px] uppercase text-zinc-600 tracking-widest">Or authenticate natively</span>
                    <div className="flex-grow border-t border-white/5"></div>
                  </div>

                  <form className="space-y-3.5" onSubmit={(e) => { e.preventDefault(); handleSignInSimulate('EMAIL'); }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[8px] text-zinc-500 uppercase tracking-widest">Secure Client Email</label>
                        <input
                          type="email"
                          required
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          placeholder="client@anchor-vault.com"
                          className="w-full bg-black border border-white/10 px-2.5 py-1.5 text-xs text-white placeholder-zinc-700 outline-none focus:border-white/30 font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] text-zinc-500 uppercase tracking-widest">Account Encryption Access key</label>
                        <input
                          type="password"
                          required
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full bg-black border border-white/10 px-2.5 py-1.5 text-xs text-white placeholder-zinc-700 outline-none focus:border-white/30 font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setIsRegistering(!isRegistering)}
                        className="text-[9px] uppercase tracking-wider text-zinc-500 hover:text-white underline transition-all"
                      >
                        {isRegistering ? "Existing account? Sign In" : "Need credentials? Sign Up"}
                      </button>
                      
                      <button
                        type="submit"
                        disabled={!emailInput}
                        className="bg-white text-black font-black uppercase text-[10px] tracking-widest px-4 py-2 hover:bg-zinc-200 transition-all disabled:opacity-50"
                      >
                        {isRegistering ? "Submit Sign Up ➔" : "Access Console Vault ➔"}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Section 2: Datasets Mutations Queue */}
          <div className="border border-white/5 bg-zinc-950/40 p-4 space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-[10px] uppercase font-black text-zinc-500 tracking-wider">
                2. Local Caching & Mutation Replication Queue
              </span>
              <span className="text-[8.5px] uppercase tracking-widest text-[#93c5fd]">IndexedDB Buffer</span>
            </div>

            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              Queue custom mock mutations from the client editor and observe processing states inside the local queue. If **Transport is Offline**, raw changes append securely in ⚠️ PENDING state.
            </p>

            <form onSubmit={handleCreateSimulatedChange} className="flex gap-2">
              <select
                value={simulatedActionType}
                onChange={(e) => setSimulatedActionType(e.target.value as any)}
                className="bg-black border border-white/10 px-2.5 py-1.5 text-[9px] text-white focus:border-white/30 font-mono outline-none uppercase tracking-wide cursor-pointer text-zinc-300"
              >
                <option value="ADD_TASK">ADD_TASK</option>
                <option value="UPDATE_TASK">UPDATE_TASK</option>
                <option value="DELETE_TASK">DELETE_TASK</option>
                <option value="CREATE_GOAL">CREATE_GOAL</option>
                <option value="SYNC_SETTINGS">SYNC_SETTINGS</option>
              </select>

              <input
                type="text"
                required
                value={simulatedActionText}
                onChange={(e) => setSimulatedActionText(e.target.value)}
                placeholder="Log mock task value e.g 'Validate secure rate limits'"
                className="flex-1 bg-black border border-white/10 px-2.5 py-1.5 text-xs text-white placeholder-zinc-700 outline-none focus:border-white/30 font-mono h-8"
              />

              <button
                type="submit"
                className="px-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-[9px] font-mono h-8 uppercase tracking-widest transition-colors flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Queue
              </button>
            </form>

            {/* Simulated Queue render */}
            <div className="space-y-2 max-h-[148px] overflow-y-auto pr-1">
              {replicationQueue.length === 0 ? (
                <div className="p-4 border border-zinc-900 border-dashed text-center text-zinc-600 text-[10px] uppercase tracking-widest leading-relaxed">
                  IndexedDB Replication Frame Queue Empty
                </div>
              ) : (
                replicationQueue.map(item => (
                  <div key={item.id} className="p-2 border border-white/5 bg-zinc-950/80 flex justify-between items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[8px] px-1 bg-zinc-900 text-zinc-400 font-mono font-bold uppercase tracking-wide border border-white/10">
                          {item.action}
                        </span>
                        <span className="text-[8px] text-zinc-500 font-mono">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-300 font-sans leading-relaxed block truncate">
                        {item.details}
                      </span>
                    </div>

                    <div className="shrink-0 flex items-center">
                      {item.status === 'PENDING' && (
                        <span className="text-[8px] font-mono text-amber-500 border border-amber-500/20 px-1 bg-amber-500/5 uppercase font-bold animate-pulse">
                          ⚠️ Pending
                        </span>
                      )}
                      {item.status === 'SYNCING' && (
                        <span className="text-[8px] font-mono text-blue-400 border border-blue-500/20 px-1 bg-blue-500/5 uppercase font-bold tracking-wider inline-flex items-center gap-1">
                          <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Syncing
                        </span>
                      )}
                      {item.status === 'SYNCED' && (
                        <span className="text-[8px] font-mono text-emerald-400 border border-emerald-500/20 px-1 bg-emerald-500/5 uppercase font-bold inline-flex items-center gap-1">
                          ✓ Synced
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Conflict engine & Sync settings Control panel */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Section: Selective datasets list sync */}
          <div className="border border-white/5 bg-zinc-950/40 p-4 space-y-4">
            <span className="text-[10px] uppercase font-black text-zinc-500 tracking-wider block">3. Selective Data Replication</span>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              Flag endpoints to include within the background automated cloud replication network layer. Offscreen modules persist offline only.
            </p>

            <div className="space-y-2 text-xs">
              {Object.keys(selectiveSync).map((key) => (
                <div key={key} className="flex justify-between items-center p-2 border border-white/5 bg-zinc-950/60 font-mono">
                  <span className="uppercase text-zinc-300 tracking-wide">{key} dataset</span>
                  <button
                    onClick={() => setSelectiveSync(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                    className={`px-2 py-0.5 text-[8.5px] font-mono font-bold uppercase border transition-all ${
                      selectiveSync[key as keyof typeof selectiveSync]
                        ? 'border-emerald-500/30 text-emerald-400 bg-emerald-950/10'
                        : 'border-zinc-800 text-zinc-600'
                    }`}
                  >
                    {selectiveSync[key as keyof typeof selectiveSync] ? 'Syncing ✓' : 'Local Only'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Conflict Resolution Playground */}
          <div className="border border-white/5 bg-zinc-950/40 p-4 space-y-4">
            <span className="text-[10px] uppercase font-black text-zinc-500 tracking-wider block">4. Conflict Resolution Protocol Playground</span>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              Verify how the sync service resolves merge writing collisions under different policies: **Last-Write-Wins (LWW)** or interactive client prompts.
            </p>

            {/* Resolution Strategy switch */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-black border border-white/15">
              <button
                onClick={() => setConflictStrategy('LWW')}
                className={`py-1 text-[9px] uppercase font-mono tracking-widest text-center font-bold transition-all ${
                  conflictStrategy === 'LWW' 
                    ? 'bg-zinc-800 text-white' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Last-Write-Wins (LWW)
              </button>
              <button
                onClick={() => setConflictStrategy('MANUAL')}
                className={`py-1 text-[9px] uppercase font-mono tracking-widest text-center font-bold transition-all ${
                  conflictStrategy === 'MANUAL' 
                    ? 'bg-zinc-800 text-white' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                User Choice Prompt
              </button>
            </div>

            <div className="flex gap-2 text-xs">
              <button
                onClick={triggerLwwSimulation}
                className="flex-1 py-1.5 border border-white/10 hover:border-white transition-all bg-black text-[9px] uppercase tracking-wide flex items-center justify-center gap-1"
              >
                Simulate Auto LWW
              </button>
              <button
                onClick={triggerConflictSimulation}
                className="flex-1 py-1.5 border border-orange-500/20 text-orange-400 hover:border-orange-500 transition-all bg-orange-950/5 text-[9px] uppercase tracking-wide flex items-center justify-center gap-1"
              >
                Trigger Collision Modal
              </button>
            </div>

            {/* Interactive Conflict Choices popup mock */}
            <AnimatePresence>
              {activeConflict && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="p-3.5 border border-orange-500/25 bg-orange-950/10 space-y-3"
                >
                  <div className="flex gap-2 text-orange-400 items-start">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[9px] uppercase tracking-wider font-bold block">Concurrence Collision Warning</span>
                      <p className="text-[9.5px]/relaxed text-zinc-400 font-sans font-medium">
                        Both Local Storage & Cloud Server registered edits to **Task #104 (Subtask specification)** concurrently. Choose target mapping to keep:
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-[10px]">
                    <button
                      onClick={() => resolveConflictChoice('LOCAL')}
                      className="w-full p-2 border border-white/10 hover:border-white bg-black hover:bg-white/[0.01] transition-all text-left space-y-0.5 uppercase block"
                    >
                      <span className="text-zinc-500 text-[8px] font-mono block">Keep local storage cache (Recommended)</span>
                      <span className="text-white text-[9.5px] font-bold block truncate">Local: "{activeConflict.localValue}"</span>
                      <span className="text-[7.5px] text-zinc-500 font-mono block">Timestamp match: {activeConflict.localTime}</span>
                    </button>

                    <button
                      onClick={() => resolveConflictChoice('SERVER')}
                      className="w-full p-2 border border-white/10 hover:border-white bg-black hover:bg-white/[0.01] transition-all text-left space-y-0.5 uppercase block"
                    >
                      <span className="text-purple-400 text-[8px] font-mono block">Keep remote cloud server override</span>
                      <span className="text-white text-[9.5px] font-bold block truncate">Server: "{activeConflict.serverValue}"</span>
                      <span className="text-[7.5px] text-indigo-400 font-mono block">Timestamp match: {activeConflict.serverTime}</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Section: Google Calendar Integration Suite */}
          <div className="border border-white/5 bg-zinc-950/40 p-4 space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-orange-500" />
                <span className="text-[10px] uppercase font-black text-zinc-300 tracking-wider">
                  5. Google Calendar Synchronization Layer
                </span>
              </div>
              <div>
                {currentSettings.connected ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] uppercase font-black tracking-wider">
                    ● Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-500 text-[9px] uppercase font-bold tracking-wider">
                    Disabled
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              Link Anchor with Google Calendar to write focus blocks, view upcoming meetings in your dashboard, and proactively ward off time conflicts.
            </p>

            {!currentSettings.connected ? (
              // Unconnected Setup Guide View
              <div className="space-y-4 pt-1">
                <div className="p-3 bg-zinc-900/60 border border-white/5 space-y-2 text-[10px]/relaxed font-sans text-zinc-400">
                  <div className="flex gap-1.5 items-center font-bold text-white uppercase tracking-wider text-[9px]">
                    <HelpCircle className="w-3.5 h-3.5 text-orange-400" />
                    How to setup in 1 minute:
                  </div>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="text-orange-400 hover:underline font-mono">Google Cloud Console</a>.</li>
                    <li>Create an <strong>OAuth 2.0 Web Application</strong> client credentials pair.</li>
                    <li>
                      Add this exact Redirect URI to your Authorized list:
                      <div className="flex gap-1 items-center mt-1 bg-black p-1 font-mono text-[9px] border border-white/10 select-text text-zinc-300 break-all">
                        <span>{window.location.origin + window.location.pathname}</span>
                        <button 
                          onClick={copyRedirectUriToClipboard}
                          className="p-1 text-zinc-500 hover:text-white border border-white/5 hover:border-white/20 shrink-0 ml-auto"
                        >
                          {copiedUri ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </li>
                    <li>Paste your generated Client ID in the field below and authorize.</li>
                  </ol>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[8px] text-zinc-500 uppercase tracking-widest block font-bold">
                    OAuth Client ID (Required)
                  </label>
                  <input
                    type="text"
                    value={clientIdInput}
                    onChange={(e) => setClientIdInput(e.target.value)}
                    placeholder="12345678-abcdef.apps.googleusercontent.com"
                    className="w-full bg-black border border-white/10 px-2.5 py-1.5 text-xs text-white placeholder-zinc-700 outline-none focus:border-white/30 font-mono"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleConnect}
                  disabled={!clientIdInput.trim()}
                  className="w-full py-2 bg-white text-black font-black uppercase text-[10px] tracking-widest hover:bg-zinc-200 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Link2 className="w-3.5 h-3.5" /> Authorize & Connect ➔
                </button>
              </div>
            ) : (
              // Connected Management View
              <div className="space-y-4 pt-1">
                {/* Config Row: Calendar Selector */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[8.5px] uppercase tracking-widest font-bold">
                    <span className="text-zinc-400">Target Google Calendar</span>
                    {loadingCalendars ? (
                      <span className="text-zinc-500 flex items-center gap-1"><LoopIcon className="w-2.5 h-2.5 animate-spin" /> Fetching...</span>
                    ) : (
                      <button 
                        type="button"
                        onClick={handleCreateCustomCalendar}
                        className="text-orange-400 hover:underline"
                      >
                        + Create Standalone "Anchor Blocks" Calendar
                      </button>
                    )}
                  </div>

                  <select
                    value={currentSettings.calendarId}
                    onChange={(e) => {
                      const selected = calendarOptions.find(o => o.id === e.target.value);
                      updateGoogleCalendarSettings({
                        calendarId: e.target.value,
                        calendarName: selected ? selected.summary : e.target.value
                      });
                      addGoogleSyncLog('info', `Switched target calendar to: "${selected ? selected.summary : e.target.value}"`);
                    }}
                    className="w-full bg-black border border-white/10 px-2.5 py-1.5 text-[11px] text-zinc-200 focus:border-white/30 font-mono outline-none cursor-pointer"
                  >
                    <option value="primary">Primary Calendar (Meetings Calendar)</option>
                    {calendarOptions.filter(o => o.id !== 'primary').map(cal => (
                      <option key={cal.id} value={cal.id}>{cal.summary}</option>
                    ))}
                  </select>
                </div>

                {/* Conflict override toggle */}
                <div className="flex items-center justify-between p-2 border border-white/5 bg-zinc-950/60 text-xs font-mono">
                  <span className="text-zinc-300 font-sans">Conflict overlay safety warnings</span>
                  <button
                    type="button"
                    onClick={() => updateGoogleCalendarSettings({ syncConflictsWarn: !currentSettings.syncConflictsWarn })}
                    className={`px-2 py-0.5 text-[8.5px] font-mono font-bold uppercase border transition-all ${
                      currentSettings.syncConflictsWarn
                        ? 'border-orange-500/30 text-orange-400 bg-orange-950/10'
                        : 'border-zinc-805 text-zinc-650'
                    }`}
                  >
                    {currentSettings.syncConflictsWarn ? 'ENABLED' : 'MUTED'}
                  </button>
                </div>

                {/* Primary sync trigger button */}
                <button
                  type="button"
                  onClick={handleSyncBlocksNow}
                  disabled={isSyncingCalendar}
                  className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <LoopIcon className={`w-3.5 h-3.5 ${isSyncingCalendar ? 'animate-spin' : ''}`} />
                  {isSyncingCalendar ? 'Synchronizing Blocks...' : 'Sync Calendar Now ➔'}
                </button>

                {/* Subtext info */}
                <div className="text-[8.5px] text-zinc-500 font-mono flex justify-between">
                  <span>Last synchronized:</span>
                  <span>{currentSettings.lastSynced ? new Date(currentSettings.lastSynced).toLocaleString() : 'Never'}</span>
                </div>

                {/* Connected status action footer */}
                <div className="border-t border-white/5 pt-2.5 flex justify-between items-center text-[9px] font-mono">
                  <span className="text-zinc-500 truncate max-w-[150px]">Client: {currentSettings.clientId.slice(0, 8)}...</span>
                  <button
                    type="button"
                    onClick={disconnectCalendar}
                    className="text-red-400 hover:text-red-300 font-bold uppercase flex items-center gap-1 hover:underline"
                  >
                    <LogOut className="w-3 h-3" /> Revoke Connection ✕
                  </button>
                </div>
              </div>
            )}

            {/* Compact embedded audit of Google Sync Activity */}
            {currentSettings.connected && (
              <div className="pt-2 border-t border-white/5 space-y-2">
                <div className="flex justify-between items-center text-[8.5px] text-zinc-500 uppercase tracking-widest font-black">
                  <span>Google Sync Audit Logs ({googleSyncLogs.length})</span>
                  {googleSyncLogs.length > 0 && (
                    <button type="button" onClick={clearGoogleSyncLogs} className="hover:text-red-400 underline">
                      Clear Logs
                    </button>
                  )}
                </div>
                <div className="max-h-[100px] overflow-y-auto space-y-1 pr-1">
                  {googleSyncLogs.length === 0 ? (
                    <div className="p-2 text-center border border-dashed border-zinc-900 text-zinc-650 text-[8.5px] uppercase">
                      No Google sync activity logs captured yet
                    </div>
                  ) : (
                    googleSyncLogs.map(log => (
                      <div key={log.id} className="text-[9px] flex gap-1 items-start leading-relaxed bg-zinc-900/40 p-1.5 border border-white/[0.02] font-mono">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1 ${
                          log.type === 'success' ? 'bg-emerald-500' : log.type === 'warn' ? 'bg-amber-500' : log.type === 'error' ? 'bg-red-500' : 'bg-cyan-500'
                        }`} />
                        <span className="text-zinc-300 font-sans text-[10px] break-words">{log.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Sync history tab layout */}
      <div className="border border-white/5 bg-zinc-950/40 p-4 space-y-3.5">
        <div className="flex justify-between items-center border-b border-white/5 pb-2">
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-zinc-500 tracking-wider">
            <History className="w-3.5 h-3.5 text-zinc-500" />
            <span>Auditable SQLite Replication Logs ({syncHistory.length})</span>
          </div>
          {syncHistory.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="text-[8.5px] font-mono text-zinc-650 hover:text-red-400 uppercase flex items-center gap-1.5 hover:underline"
            >
              <Trash2 className="w-3 h-3" /> Clear Audit Logs
            </button>
          )}
        </div>

        <div className="space-y-1.5 max-h-[175px] overflow-y-auto pr-1">
          {syncHistory.length === 0 ? (
            <div className="p-4 border border-zinc-900 border-dashed text-center text-zinc-650 text-[10px] uppercase font-mono tracking-widest leading-relaxed">
              Telemetry Sync History Clear. Run simulations above.
            </div>
          ) : (
            syncHistory.map((log) => (
              <div key={log.id} className="p-2 border border-white/5 bg-zinc-950/60 flex items-center justify-between gap-4 text-[10px]">
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className={`w-1.5 h-1.5 rounded-none shrink-0 mt-1.5 ${
                    log.status === 'success' ? 'bg-emerald-500' : log.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                  }`} />
                  <div className="min-w-0">
                    <span className="text-zinc-500 font-mono mr-2 uppercase text-[8px]">
                      [{new Date(log.timestamp).toLocaleTimeString()}]
                    </span>
                    <span className="text-[8.5px] px-1 bg-zinc-950 text-purple-400 border border-white/5 uppercase font-mono font-bold mr-2">
                      {log.type}
                    </span>
                    <span className="text-zinc-300 font-sans leading-relaxed break-words">
                      {log.message}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteLogItem(log.id)}
                  className="text-zinc-600 hover:text-red-400 p-0.5 shrink-0 transition-colors"
                  title="Delete secure telemetry frame"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* System architectural documentation section */}
      <div className="border border-white/5 bg-zinc-950/30 p-4 md:p-6 space-y-6">
        
        <div className="space-y-1.5 border-b border-white/5 pb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <span className="text-[10px] tracking-[0.2em] font-black uppercase text-purple-400">Architecture Specification</span>
          </div>
          <h3 className="text-base font-black uppercase text-white tracking-tight">
            Comprehensive Sync Protocol System Blueprints
          </h3>
          <p className="text-xs text-zinc-400 font-sans leading-relaxed">
            Examine our high-trust enterprise sync design guidelines, endpoints payload standards, soft-deletion tombstone tracking systems, and client resilience mechanics.
          </p>
        </div>

        {/* Specs tabs navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 border border-white/10 p-0.5 bg-black">
          {[
            { id: 'FRONTEND', label: '1. Frontend Service', icon: <Cpu className="w-3.5 h-3.5" /> },
            { id: 'API', label: '2. API Endpoints', icon: <Network className="w-3.5 h-3.5" /> },
            { id: 'SCHEMA', label: '3. DB Schemas', icon: <Database className="w-3.5 h-3.5" /> },
            { id: 'OFFLINE_STRATEGY', label: '4. Offline Logic', icon: <ShieldCheck className="w-3.5 h-3.5" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSpecTab(tab.id as any)}
              className={`py-2 text-[9.5px] uppercase font-mono tracking-widest text-center flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeSpecTab === tab.id 
                  ? 'bg-zinc-800 text-white font-black' 
                  : 'text-zinc-500 hover:text-white hover:bg-white/[0.01]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Specifications tabs contents */}
        <div className="border border-white/5 bg-zinc-950/60 p-4">
          
          <AnimatePresence mode="wait">
            {activeSpecTab === 'FRONTEND' && (
              <motion.div
                key="front-tab"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-tight text-white mb-1 flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-purple-400" /> Shared-Worker State Synchronizer Service
                    </h4>
                    <span className="text-[8.5px] text-zinc-500 uppercase tracking-widest">Client Service Architecture & React Interfacing</span>
                  </div>
                  <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[8.5px] uppercase font-black tracking-wiest">
                    TS Implementation Pattern
                  </span>
                </div>

                <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                  The client state service runs on a main thread hook paired with an IndexedDB storage adapter (`localforage` / standard `idb`). Mutations queue instantly into an outbox, which acts as the thread-safe transactional record. When socket connection establishes, the channel fires frames via transport middleware.
                </p>

                {/* Blueprint container */}
                <div className="bg-black/90 p-4 border border-zinc-900 overflow-x-auto text-[10.5px] leading-relaxed font-mono text-zinc-300 max-h-[350px] overflow-y-auto">
                  <span className="text-[8.5px] text-zinc-650 uppercase block mb-2">// Hook usage: useSyncStateProvider.ts</span>
                  <pre>{`import { useEffect, useState } from 'react';
import { SyncOutboxQueue, LocalIndexedDB } from './storage';

export function useSyncService(userId: string | null) {
  const [syncState, setSyncState] = useState<'IDLE' | 'SYNCING' | 'PENDING' | 'ERROR'>('IDLE');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      flushOutboxQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const dispatchMutation = async (action: string, payload: any) => {
    const mutationFrame = {
      id: crypto.randomUUID(),
      userId,
      action,
      payload,
      timestamp: Date.now(),
      version: await getLocalCacheVersion(action) + 1
    };

    // 1. Instantly write to local UI cache
    await LocalIndexedDB.write(action, payload);

    if (!isOnline) {
      // 2. Buffer to offline outbox index if connection is broken
      await SyncOutboxQueue.push(mutationFrame);
      setSyncState('PENDING');
      return;
    }

    try {
      setSyncState('SYNCING');
      // 3. Replicate immediately via HTTPS secure transport mapping
      await transmitReplicationFrame(mutationFrame);
      setSyncState('IDLE');
    } catch (err) {
      await SyncOutboxQueue.push(mutationFrame);
      setSyncState('ERROR');
    }
  };

  const flushOutboxQueue = async () => {
    const pendingItems = await SyncOutboxQueue.getAllSorted();
    if (pendingItems.length === 0) return;

    setSyncState('SYNCING');
    try {
      for (const frame of pendingItems) {
        await transmitReplicationFrame(frame);
        await SyncOutboxQueue.delete(frame.id);
      }
      setSyncState('IDLE');
    } catch (error) {
      setSyncState('ERROR');
    }
  };

  return { syncState, isOnline, dispatchMutation };
}`}</pre>
                </div>
              </motion.div>
            )}

            {activeSpecTab === 'API' && (
              <motion.div
                key="api-tab"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-tight text-white mb-1 flex items-center gap-1.5">
                      <Network className="w-4 h-4 text-purple-400" /> Secure Synchronization JSON Endpoints
                    </h4>
                    <span className="text-[8.5px] text-zinc-500 uppercase tracking-widest">Enterprise API Payload Contracts & JWT Authentication</span>
                  </div>
                  <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[8.5px] uppercase font-black tracking-wiest">
                    REST Contract Spec
                  </span>
                </div>

                <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                  All requests transmit encrypted over standard HTTPS. Secure endpoints authorize using JSON Web Tokens (`jwt`) bound to user devices. Global Cloud Run instances govern rate limits via response headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`).
                </p>

                {/* Blueprint container */}
                <div className="bg-black/90 p-4 border border-zinc-900 overflow-x-auto text-[10.5px] leading-relaxed font-mono text-zinc-300 max-h-[350px] overflow-y-auto">
                  <span className="text-[8.5px] text-zinc-650 uppercase block mb-2">// Sync Engine API Endpoints Spec</span>
                  <pre>{`1. POST /api/v1/auth/signup-signin
   Description: Authenticative entry point. Generates encrypted JWT keys.
   Rate Limit: 20 invocations / min per IP.
   Payload Header: None
   Payload Body:
   {
     "email": "vashisthrishabh146@gmail.com",
     "password": "hashed_password_client_vault",
     "deviceName": "Macbook Pro 16",
     "deviceType": "desktop"
   }
   Response Codes: 200 OK, 401 Unauthorized, 429 Too Many Requests
   Response Header: X-RateLimit-Limit: 20, X-RateLimit-Remaining: 19
   Response JSON:
   {
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3ItMTA0Iiwi...",
     "expiresIn": 172800,
     "deviceId": "dev-b337-bcf8"
   }

2. POST /api/v1/sync/push
   Description: Client pushing queued outbox delta collection.
   Authorization: Bearer <JWT_TOKEN>
   Payload Body:
   {
     "lastSyncTimestamp": 1780512000000,
     "deviceId": "dev-b337-bcf8",
     "changes": [
       {
         "id": "mutation-frame-10",
         "table": "tasks",
         "recordId": "task-552",
         "action": "INSERT",
         "version": 4,
         "updatedAt": 1780543200900,
         "data": {
           "text": "Write telemetry rate limit specification",
           "status": "pending",
           "category": "KEEP"
         }
       }
     ]
   }
   Response Codes: 200 OK, 409 Conflict (Locks dynamic modal prompts), 401 Unauthorized

3. POST /api/v1/sync/pull
   Description: Fetch changes executed on other client devices.
   Authorization: Bearer <JWT_TOKEN>
   Payload Body:
   {
     "lastSyncTimestamp": 1780512000000,
     "registeredDevices": ["dev-b337-bcf8", "dev-990a"]
   }
   Response JSON:
   {
     "serverTime": 1780543500200,
     "hasUpdates": true,
     "updates": [
       {
         "table": "goals",
         "recordId": "goal-40",
         "action": "UPDATE",
         "version": 9,
         "updatedAt": 1780543300800,
         "data": {
           "status": "completed",
           "completed": true
         }
       }
     ]
   }`}</pre>
                </div>
              </motion.div>
            )}

            {activeSpecTab === 'SCHEMA' && (
              <motion.div
                key="schema-tab"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-tight text-white mb-1 flex items-center gap-1.5">
                      <Database className="w-4 h-4 text-purple-400" /> Drizzle Schema Relational Models
                    </h4>
                    <span className="text-[8.5px] text-zinc-500 uppercase tracking-widest">Metadata, Device Sessions, Soft-Deletion, and Version Tracking Schema</span>
                  </div>
                  <span className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-450 text-[8.5px] uppercase font-black tracking-wiest">
                    Drizzle ORM Schema
                  </span>
                </div>

                <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                  PostgreSQL database structures require robust schema elements. Transactions rely on a `version` column and standard `updated_at` timestamps for automatic LWW matching. Deleted elements never drop from rows—they trigger soft-deletion tags (`is_deleted = true`) so remote offline clients replicate deletion tombstones flawlessly.
                </p>

                {/* Blueprint container */}
                <div className="bg-black/90 p-4 border border-zinc-900 overflow-x-auto text-[10.5px] leading-relaxed font-mono text-zinc-300 max-h-[350px] overflow-y-auto">
                  <span className="text-[8.5px] text-zinc-650 uppercase block mb-2">// Drizzle database schema: schema.ts</span>
                  <pre>{`import { pgTable, text, timestamp, boolean, integer, uuid, bigint } from 'drizzle-orm/pg-core';

// 1. User Account Identity Ledger
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// 2. Authenticated Devices Management & Tokens
export const devices = pgTable('devices', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(), // Macbook Pro, iPhone, etc.
  type: text('type').default('desktop').notNull(),
  ipAddress: text('ip_address'),
  tokenSalt: text('token_salt').notNull(), // Security verification Salt
  lastActive: timestamp('last_active').defaultNow().notNull()
});

// 3. Tasks Table equipped with tombstone parameters for cloud synchronization
export const tasks = pgTable('tasks', {
  id: text('id').primaryKey(), // Matches client uuid string
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  text: text('text').notNull(),
  status: text('status').default('pending').notNull(),
  category: text('category').default('NONE').notNull(),
  estimatedTime: integer('estimated_time').default(45),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  
  // 🔄 REPLICATION METADATA (Included in all synchronized tables)
  version: integer('version').default(1).notNull(),
  updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
  isDeleted: boolean('is_deleted').default(false).notNull() // Soft deletion tombstone
});

// 4. Sync Operations Audit History tracking
export const syncHistoryLogs = pgTable('sync_history_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  deviceId: uuid('device_id').references(() => devices.id, { onDelete: 'cascade' }).notNull(),
  actionType: text('action_type').notNull(), // PULL, PUSH, DUPLICATE_RESOLVE
  logMessage: text('log_message').notNull(),
  payloadSizeInBytes: integer('payload_size_bytes'),
  timestamp: timestamp('timestamp').defaultNow().notNull()
});`}</pre>
                </div>
              </motion.div>
            )}

            {activeSpecTab === 'OFFLINE_STRATEGY' && (
              <motion.div
                key="offline-tab"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-tight text-white mb-1 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-purple-400" /> Resilience Queue Execution Strategy
                    </h4>
                    <span className="text-[8.5px] text-zinc-500 uppercase tracking-widest">Client Outbox Engine, Retry Escalation Parameters, & Data Validation</span>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8.5px] uppercase font-black tracking-wiest">
                    Execution Algorithm
                  </span>
                </div>

                <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                  Network pipelines degrade unheralded. Client software must manage outbox streams gracefully, utilizing **exponential backoff, mathematical retry caps, payload validation constraints**, and robust authentication checks.
                </p>

                {/* Grid spec elements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div className="p-3.5 bg-black border border-white/5 space-y-2">
                    <span className="text-[9.5px] uppercase tracking-wider text-orange-500 block">Exponential Backoff Flow</span>
                    <p className="text-[10px] font-sans leading-relaxed text-zinc-400">
                      When transmit calls error due to server overload (503 Service Unavailable) or internet disruptions, client retries trigger with a backoff calculation:
                    </p>
                    <div className="bg-zinc-950 p-2 border border-zinc-900 rounded-none text-center font-mono text-[10.5px] text-white">
                      t_retry = t_base × 2^attempt + jitter
                    </div>
                    <ul className="text-[9px] font-mono text-zinc-500 space-y-1 list-disc pl-4 leading-relaxed">
                      <li>t_base = 1000ms (1 second starting threshold)</li>
                      <li>Max Attempt Limit = 6 Retries</li>
                      <li>Jitter Range = ± 100ms (avoids server thundering herd)</li>
                    </ul>
                  </div>

                  <div className="p-3.5 bg-black border border-white/5 space-y-2">
                    <span className="text-[9.5px] uppercase tracking-wider text-purple-400 block">Conflict Strategy: User choice</span>
                    <p className="text-[10px] font-sans leading-relaxed text-zinc-400">
                      When client version overlaps server state on the same column elements, the system suspends automatic merge rules to prompt a Choice modal:
                    </p>
                    <ul className="text-[9px] font-mono text-zinc-500 space-y-1 list-decimal pl-4 leading-relaxed">
                      <li>Compare timestamp records of both states</li>
                      <li>Flag differences to the rendering engine page</li>
                      <li>Apply selection, writing chosen value and incrementing the version counter (+1) to resolve downstream nodes</li>
                    </ul>
                  </div>

                </div>

                {/* Validation and Retry pseudocode */}
                <div className="bg-black/90 p-4 border border-zinc-900 overflow-x-auto text-[10.5px] leading-relaxed font-mono text-zinc-300 max-h-[250px] overflow-y-auto">
                  <span className="text-[8.5px] text-zinc-650 uppercase block mb-1">// Outbox queue processor with backoff</span>
                  <pre>{`async function processQueueWithBackoff(queue: MutationFrame[], attempt = 0) {
  const MAX_RETRY_ATTEMPT = 6;
  const BASE_DELAY_MS = 1000;

  if (attempt >= MAX_RETRY_ATTEMPT) {
    console.error('Queue Sync Suspended: Destination Host Unreachable. Queue held in IndexedDB cache.');
    broadcastSyncStatus('PAUSED');
    return;
  }

  try {
    for (const frame of queue) {
      // 🛡️ Client-side Schema and Rate Validation checks
      if (!validateFrameData(frame)) {
        throw new Error(\`Validation Failure: Malformed data schema inside \${frame.table}\`);
      }
      
      const response = await fetch('/api/v1/sync/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${localStorage.getItem('jwt_auth_token')}\`
        },
        body: JSON.stringify(frame)
      });

      if (response.status === 429) {
        console.warn('API Rate Limits Triggered. Backoff triggered.');
        const retryAfter = Number(response.headers.get('Retry-After')) || 60;
        await sleep(retryAfter * 1000);
        return processQueueWithBackoff(queue, attempt + 1);
      }

      if (!response.ok) throw new Error('Host transmit failure.');
    }
  } catch (error) {
    const delay = BASE_DELAY_MS * Math.pow(2, attempt) + (Math.random() * 200 - 100);
    console.log(\`Transmission lost. Retrying in \${delay.toFixed(0)}ms (Attempt \${attempt + 1}/\${MAX_RETRY_ATTEMPT})\`);
    await sleep(delay);
    return processQueueWithBackoff(queue, attempt + 1);
  }
}`}</pre>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>

    </div>
  );
}
