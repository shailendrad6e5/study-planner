import React, { useState, useEffect, useCallback } from 'react';
import { Target, TrendingUp, Clock, Zap, Calendar, Loader2 } from 'lucide-react';
import TaskTracker from '../components/TaskTracker';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import WelcomeModal from '../components/WelcomeModal';
import { getDashboardStats, getTimetable } from '../services/firestoreService';

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser, userProfile, loadUserProfile } = useAuth();

  const displayName = userProfile?.name || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Student';
  const firstName = displayName.split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const [showWelcome, setShowWelcome] = useState(false);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [savedSchedule, setSavedSchedule] = useState(null);

  useEffect(() => {
    if (userProfile?.isNewUser) {
      setShowWelcome(true);
      if (currentUser?.uid) {
        updateDoc(doc(db, 'users', currentUser.uid), { isNewUser: false })
          .then(() => loadUserProfile(currentUser.uid)) // refresh in-memory profile so modal won't re-appear
          .catch(() => {});
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile]);

  const refreshStats = useCallback(async () => {
    if (!currentUser) return;
    try {
      const [data, timetable] = await Promise.all([
        getDashboardStats(currentUser.uid),
        getTimetable(currentUser.uid),
      ]);
      setStats(data);
      if (timetable?.slots) setSavedSchedule(timetable.slots);
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    setLoadingStats(true);
    refreshStats().finally(() => setLoadingStats(false));
  }, [currentUser, refreshStats]);

  const motivationScore = stats?.motivationScore ?? 0;
  const streak = stats?.streak ?? 0;
  const completedTasks = stats?.completedTasks ?? 0;
  const totalTasks = stats?.totalTasks ?? 0;
  const totalFocusHours = stats?.totalFocusHours ?? 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}

      <header>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{greeting}, {firstName}! 👋</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Here is your study overview for today.</p>
      </header>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Motivation Score"
          value={loadingStats ? '—' : `${motivationScore}%`}
          subtitle="Based on task completion"
          icon={<TrendingUp className={`w-6 h-6 ${motivationScore >= 80 ? 'text-green-500' : motivationScore >= 50 ? 'text-orange-500' : 'text-red-500'}`} />}
          trend={motivationScore >= 80 ? '🔥 On Fire!' : ''}
          color={motivationScore >= 80 ? 'bg-green-50 dark:bg-green-900/40' : motivationScore >= 50 ? 'bg-orange-50 dark:bg-orange-900/40' : 'bg-red-50 dark:bg-red-900/40'}
          loading={loadingStats}
        />
        <StatCard
          title="Focus Hours"
          value={loadingStats ? '—' : `${totalFocusHours}h`}
          subtitle="Total sessions completed"
          icon={<Clock className="w-6 h-6 text-primary-500 dark:text-primary-400" />}
          color="bg-primary-50 dark:bg-primary-900/40"
          loading={loadingStats}
        />
        <StatCard
          title="Tasks Completed"
          value={loadingStats ? '—' : `${completedTasks}/${totalTasks}`}
          subtitle="Add tasks below to track"
          icon={<Target className="w-6 h-6 text-secondary-500 dark:text-secondary-400" />}
          color="bg-secondary-50 dark:bg-secondary-900/40"
          loading={loadingStats}
        />
        <StatCard
          title="Study Streak"
          value={loadingStats ? '—' : `${streak} ${streak === 1 ? 'day' : 'days'}`}
          subtitle="Consecutive study days"
          icon={<Zap className="w-6 h-6 text-orange-500 dark:text-orange-400" />}
          trend={streak >= 3 ? '🔥' : ''}
          color="bg-orange-50 dark:bg-orange-900/40"
          loading={loadingStats}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="col-span-2 space-y-6">
          {/* Today's Schedule */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-500 dark:text-primary-400" />
                Today's Schedule
              </h2>
              {savedSchedule && (
                <button onClick={() => navigate('/timetable')}
                  className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline">
                  View Full Timetable →
                </button>
              )}
            </div>

            {loadingStats ? (
              <div className="flex items-center gap-2 text-gray-400 py-6">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading schedule...</span>
              </div>
            ) : savedSchedule && savedSchedule.length > 0 ? (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {savedSchedule.slice(0, 6).map((slot, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${slot.color || 'bg-primary-500'}`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{slot.subject}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{slot.topic}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400">{slot.time}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{slot.hours}h</p>
                    </div>
                  </div>
                ))}
                {savedSchedule.length > 6 && (
                  <p className="text-xs text-center text-gray-400 dark:text-gray-500 pt-1">+{savedSchedule.length - 6} more slots in Timetable</p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                <div className="w-14 h-14 bg-primary-50 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center">
                  <Calendar className="w-7 h-7 text-primary-400 dark:text-primary-500" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">
                  No schedule yet. Generate your personalized AI timetable.
                </p>
                <button onClick={() => navigate('/timetable')}
                  className="mt-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors">
                  ✨ Generate My Schedule
                </button>
              </div>
            )}
          </div>

          <TaskTracker onDataChange={refreshStats} />
        </div>

        {/* AI Insights */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-primary-600 to-secondary-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden card-hover">
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-2">✨ AI Insights</h3>
              <p className="text-primary-50 text-sm leading-relaxed mb-4">
                {totalTasks === 0
                  ? 'Add your first subject and task below to begin tracking your progress!'
                  : motivationScore >= 80
                  ? `Amazing! You've completed ${completedTasks}/${totalTasks} tasks. Keep it up! 🔥`
                  : `You have ${totalTasks - completedTasks} tasks remaining. Generate a timetable to stay on track!`}
              </p>
              <button onClick={() => navigate('/timetable')}
                className="bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-md px-4 py-2 rounded-xl text-sm font-medium w-full">
                {stats?.subjects?.length === 0 ? 'Get Started' : 'Generate Smart Timetable'}
              </button>
            </div>
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/10 blur-2xl"></div>
          </div>

          {/* Quick Stats */}
          {!loadingStats && stats?.subjects?.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-sm">Your Subjects</h3>
              <div className="space-y-2">
                {stats.subjects.slice(0, 5).map(sub => (
                  <div key={sub.id} className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${sub.color || 'bg-blue-500'}`}></span>
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{sub.name}</span>
                  </div>
                ))}
                {stats.subjects.length > 5 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">+{stats.subjects.length - 5} more</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, trend, color, loading }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm card-hover transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          {loading ? (
            <div className="mt-1 w-16 h-7 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          ) : (
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</h3>
          )}
        </div>
        <div className={`p-3 rounded-2xl ${color}`}>{icon}</div>
      </div>
      <div className="mt-4 flex items-center text-sm">
        {trend && <span className="text-green-500 font-medium mr-2">{trend}</span>}
        <span className="text-gray-400 dark:text-gray-500">{subtitle}</span>
      </div>
    </div>
  );
}
