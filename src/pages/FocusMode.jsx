import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Square, Check, Clock, Loader2, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSubjects, addStudySession, getStudySessions } from '../services/firestoreService';

// ─── SVG Circular Timer ───────────────────────────────────────────────────────
function CircularTimer({ progress, timeLeft, isBreak, isActive, subject }) {
  const size = 280;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Background glow */}
      <div className={`absolute inset-4 rounded-full blur-2xl opacity-20 transition-colors duration-700 ${isBreak ? 'bg-green-400' : 'bg-primary-400'}`} />
      
      <svg width={size} height={size} className="absolute rotate-[-90deg]">
        {/* Track */}
        <circle cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-100 dark:text-gray-800"
        />
        {/* Progress */}
        <circle cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`transition-all duration-1000 ease-linear ${isBreak ? 'stroke-green-500' : 'stroke-primary-500'}`}
        />
      </svg>

      {/* Inner content */}
      <div className="z-10 text-center select-none">
        <div className="text-xs font-bold tracking-widest uppercase text-gray-400 dark:text-gray-500 mb-1">
          {isBreak ? '☕ Break' : (subject || '📚 Focus')}
        </div>
        <div className={`text-6xl font-extralight tabular-nums tracking-tight ${isBreak ? 'text-green-600 dark:text-green-400' : 'text-primary-600 dark:text-primary-400'}`}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {isActive ? 'in progress' : 'ready'}
        </div>
      </div>
    </div>
  );
}

// ─── Completion Modal ─────────────────────────────────────────────────────────
function CompletionModal({ onClose, subject, duration }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 mx-4 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-300 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Session Complete!</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
          <strong className="text-gray-900 dark:text-white">{subject || 'Study'}</strong> · {duration} min
        </p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">Great work! Take a moment to rest. 🌟</p>
        <button onClick={onClose}
          className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
          <Check className="w-5 h-5" /> Awesome, continue!
        </button>
      </div>
    </div>
  );
}

// ─── Partial Save Modal ───────────────────────────────────────────────────────
function PartialSaveModal({ onSave, onDiscard }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 mx-4 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-300 text-center">
        <div className="text-5xl mb-4">⏱️</div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Save partial session?</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          You stopped before finishing. Would you like to save progress?
        </p>
        <div className="flex gap-3">
          <button onClick={onDiscard}
            className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Discard
          </button>
          <button onClick={onSave}
            className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors">
            Save Partial
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Duration presets ─────────────────────────────────────────────────────────
const PRESETS = [
  { label: '25 min', value: 25 },
  { label: '45 min', value: 45 },
  { label: '1 hr', value: 60 },
  { label: '90 min', value: 90 },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function FocusMode() {
  const { currentUser } = useAuth();

  // Setup state
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [customInput, setCustomInput] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  // Timer state
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [totalTime, setTotalTime] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Modals
  const [showComplete, setShowComplete] = useState(false);
  const [showPartial, setShowPartial] = useState(false);

  // History
  const [sessions, setSessions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [saving, setSaving] = useState(false);

  const intervalRef = useRef(null);

  // ─── Load data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      setLoadingHistory(true);
      try {
        const [fetchedSubjects, fetchedSessions] = await Promise.all([
          getSubjects(currentUser.uid),
          getStudySessions(currentUser.uid),
        ]);
        setSubjects(fetchedSubjects);
        if (fetchedSubjects.length > 0) setSelectedSubject(fetchedSubjects[0].name);
        setSessions(fetchedSessions.slice(0, 5));
      } catch (err) {
        console.error('Error loading Focus Mode:', err);
      }
      setLoadingHistory(false);
    };
    load();
  }, [currentUser]);

  // ─── Sync timer with duration choice ────────────────────────────────────────
  const applyDuration = useCallback((mins) => {
    setDurationMinutes(mins);
    setTimeLeft(mins * 60);
    setTotalTime(mins * 60);
    setHasStarted(false);
    setIsActive(false);
    setElapsedSeconds(0);
    setIsBreak(false);
  }, []);

  // ─── Tick ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => t - 1);
        setElapsedSeconds(e => e + 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      // Session complete
      setIsActive(false);
      handleSessionComplete(true);
    }
    return () => clearInterval(intervalRef.current);
  }, [isActive, timeLeft]);

  // ─── Play sound ─────────────────────────────────────────────────────────────
  const playSound = (freq = 800) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
      osc.start(); osc.stop(ctx.currentTime + 1);
    } catch {}
  };

  // ─── Save session to Firestore ───────────────────────────────────────────────
  const saveSession = async (completed) => {
    if (!currentUser) return;
    const actualMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
    setSaving(true);
    try {
      const sessionData = {
        type: 'Focus',
        subjectName: selectedSubject || 'General',
        durationMinutes: completed ? durationMinutes : actualMinutes,
        completed,
        date: new Date().toISOString(),
      };
      const saved = await addStudySession(currentUser.uid, sessionData);
      // Prepend to local history
      setSessions(prev => [{
        id: saved,
        ...sessionData,
        completedAt: { toDate: () => new Date() },
      }, ...prev].slice(0, 5));
    } catch (err) {
      console.error('Error saving session:', err);
    }
    setSaving(false);
  };

  // ─── Session complete ────────────────────────────────────────────────────────
  const handleSessionComplete = async (completed) => {
    clearInterval(intervalRef.current);
    playSound(completed ? 880 : 440);
    await saveSession(completed);
    if (completed) {
      setShowComplete(true);
      // Break time
      setIsBreak(true);
      setTimeLeft(5 * 60);
      setTotalTime(5 * 60);
      setElapsedSeconds(0);
    }
    setHasStarted(false);
    setIsActive(false);
  };

  // ─── Controls ────────────────────────────────────────────────────────────────
  const handleStart = () => {
    setHasStarted(true);
    setIsActive(true);
  };

  const handlePause = () => setIsActive(false);
  const handleResume = () => setIsActive(true);

  const handleStop = () => {
    if (!hasStarted || elapsedSeconds < 30) {
      handleReset();
      return;
    }
    setIsActive(false);
    setShowPartial(true);
  };

  const handleReset = () => {
    clearInterval(intervalRef.current);
    setIsActive(false);
    setHasStarted(false);
    setIsBreak(false);
    setElapsedSeconds(0);
    setTimeLeft(durationMinutes * 60);
    setTotalTime(durationMinutes * 60);
  };

  const handlePartialSave = async () => {
    setShowPartial(false);
    await saveSession(false);
    handleReset();
  };

  const handlePartialDiscard = () => {
    setShowPartial(false);
    handleReset();
  };

  const handleCompleteClose = () => {
    setShowComplete(false);
    setIsBreak(false);
    setTimeLeft(durationMinutes * 60);
    setTotalTime(durationMinutes * 60);
  };

  const progress = totalTime > 0 ? (totalTime - timeLeft) / totalTime : 0;

  return (
    <div className="min-h-screen relative space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 md:pb-8">
      {/* Modals */}
      {showComplete && <CompletionModal onClose={handleCompleteClose} subject={selectedSubject} duration={durationMinutes} />}
      {showPartial && <PartialSaveModal onSave={handlePartialSave} onDiscard={handlePartialDiscard} />}

      <header>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Focus Mode</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Deep work, your way. Set your time, pick your subject.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Left: Setup + Timer ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Setup panel — hide when active */}
          {!hasStarted && (
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-5 transition-colors animate-in fade-in duration-300">
              {/* Subject */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">📚 Subject</label>
                {subjects.length === 0 ? (
                  <div className="text-sm text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                    No subjects added yet. Add them in <strong>Task Tracker</strong> on the Dashboard first.
                  </div>
                ) : (
                  <div className="relative">
                    <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}
                      className="w-full appearance-none px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-white text-sm font-semibold outline-none pr-10">
                      {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                )}
              </div>

              {/* Duration presets */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">⏱️ Duration</label>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map(p => (
                    <button key={p.value} onClick={() => { applyDuration(p.value); setShowCustom(false); }}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${durationMinutes === p.value && !showCustom
                        ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-500/30'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-primary-300'}`}>
                      {p.label}
                    </button>
                  ))}
                  <button onClick={() => setShowCustom(v => !v)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${showCustom
                      ? 'bg-secondary-600 text-white border-secondary-600'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-secondary-300'}`}>
                    Custom
                  </button>
                </div>

                {/* Custom input */}
                {showCustom && (
                  <div className="mt-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <input
                      type="number" min="5" max="180"
                      value={customInput}
                      onChange={e => setCustomInput(e.target.value)}
                      placeholder="Enter minutes (5–180)"
                      className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white text-sm outline-none"
                    />
                    <button
                      onClick={() => {
                        const v = parseInt(customInput);
                        if (v >= 5 && v <= 180) { applyDuration(v); setShowCustom(false); }
                      }}
                      className="px-5 py-2.5 bg-secondary-600 hover:bg-secondary-700 text-white rounded-xl text-sm font-bold transition-colors">
                      Set
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timer card */}
          <div className={`bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm transition-colors flex flex-col items-center gap-8`}>
            
            {/* Session label when active */}
            {hasStarted && (
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 animate-in fade-in duration-300">
                <span className={`w-2 h-2 rounded-full animate-pulse ${isBreak ? 'bg-green-500' : 'bg-primary-500'}`}></span>
                {isBreak ? 'Break time' : `Studying: ${selectedSubject || 'General'}`}
                {saving && <span className="text-xs text-gray-400">· saving...</span>}
              </div>
            )}

            {/* Circular timer */}
            <CircularTimer
              progress={progress}
              timeLeft={timeLeft}
              isBreak={isBreak}
              isActive={isActive}
              subject={selectedSubject}
            />

            {/* Controls */}
            <div className="flex items-center gap-3 flex-wrap justify-center">
              {!hasStarted ? (
                <button onClick={handleStart}
                  className="px-10 py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl shadow-xl shadow-primary-500/30 transition-all flex items-center gap-2 text-base">
                  <Play className="w-5 h-5 fill-current" /> Start Session
                </button>
              ) : (
                <>
                  {isActive ? (
                    <button onClick={handlePause}
                      className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl shadow-xl shadow-orange-500/30 transition-all flex items-center gap-2">
                      <Pause className="w-5 h-5" /> Pause
                    </button>
                  ) : (
                    <button onClick={handleResume}
                      className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl shadow-xl shadow-primary-500/30 transition-all flex items-center gap-2">
                      <Play className="w-5 h-5 fill-current" /> Resume
                    </button>
                  )}
                  <button onClick={handleStop}
                    className="px-6 py-4 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-bold rounded-2xl transition-all flex items-center gap-2 border border-red-100 dark:border-red-800">
                    <Square className="w-5 h-5" /> Stop
                  </button>
                  <button onClick={handleReset}
                    className="p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-2xl transition-all border border-gray-200 dark:border-gray-700">
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Elapsed */}
            {hasStarted && elapsedSeconds > 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s elapsed
              </p>
            )}
          </div>
        </div>

        {/* ── Right: Session History ── */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm transition-colors">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary-500" />
              Recent Sessions
            </h3>

            {loadingHistory ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading...
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-6 text-gray-400 dark:text-gray-500">
                <p className="text-3xl mb-2">📭</p>
                <p className="text-sm">No sessions yet.</p>
                <p className="text-xs mt-1">Start the timer to log your first!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session, i) => {
                  const date = session.completedAt?.toDate?.() || new Date(session.date || Date.now());
                  return (
                    <div key={session.id || i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${session.completed !== false ? 'bg-green-500' : 'bg-orange-400'}`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {session.subjectName || 'General'}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {session.durationMinutes || 25}m · {session.completed !== false ? '✅ Done' : '⏸ Partial'}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                        {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tips card */}
          <div className="bg-gradient-to-br from-primary-600 to-secondary-600 rounded-3xl p-5 text-white shadow-lg">
            <h4 className="font-bold mb-2">💡 Study Tips</h4>
            <ul className="text-primary-50 text-sm space-y-1.5">
              <li>• 25 min sessions = peak focus</li>
              <li>• Take 5 min breaks between sessions</li>
              <li>• Silence your phone during focus</li>
              <li>• Hydrate before starting!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
