import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { getStudySessions, buildWeeklyChartData, buildHeatmapData } from '../services/firestoreService';
import { Loader2 } from 'lucide-react';

export default function Analytics() {
  const { currentUser } = useAuth();
  const [chartData, setChartData] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [streak, setStreak] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      setLoading(true);
      try {
        const sessions = await getStudySessions(currentUser.uid);
        
        setChartData(buildWeeklyChartData(sessions));
        setHeatmapData(buildHeatmapData(sessions));

        // Total focus hours
        const totalMins = sessions
          .filter(s => s.type === 'Focus')
          .reduce((sum, s) => sum + (s.durationMinutes || 25), 0);
        setTotalHours(Math.round((totalMins / 60) * 10) / 10);

        // Streak: consecutive days from today
        const sessionDays = new Set(
          sessions
            .filter(s => s.type === 'Focus' && s.completedAt?.toDate)
            .map(s => s.completedAt.toDate().toDateString())
        );
        let currentStreak = 0;
        const today = new Date();
        for (let i = 0; i < 365; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          if (sessionDays.has(d.toDateString())) currentStreak++;
          else break;
        }
        setStreak(currentStreak);
      } catch (err) {
        console.error('Error loading analytics:', err);
      }
      setLoading(false);
    };
    load();
  }, [currentUser]);

  const getIntensityColor = (level) => {
    switch(level) {
      case 4: return 'bg-primary-900 dark:bg-primary-300';
      case 3: return 'bg-primary-600 dark:bg-primary-500';
      case 2: return 'bg-primary-400 dark:bg-primary-700';
      case 1: return 'bg-primary-200 dark:bg-primary-900';
      default: return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  const hasData = chartData.some(d => d.hours > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-gray-400 dark:text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm">Loading your analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Track your progress and build consistent habits.</p>
      </header>

      {/* Stats summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Focus Hours', value: `${totalHours}h`, emoji: '⏱️' },
          { label: 'Current Streak', value: `${streak} days`, emoji: '🔥' },
          { label: 'Sessions This Week', value: chartData.reduce((s, d) => s + (d.hours > 0 ? 1 : 0), 0).toString(), emoji: '📚' },
        ].map(({ label, value, emoji }) => (
          <div key={label} className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
            <p className="text-2xl mb-1">{emoji}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Study Hours Chart */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm transition-colors">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Study Hours (This Week)</h3>
        {hasData ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" strokeOpacity={0.3} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dx={-10} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB' }} />
                <Area type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
            <p className="text-4xl mb-3">📊</p>
            <p className="text-sm font-medium">No study sessions this week yet.</p>
            <p className="text-xs mt-1">Complete a Focus session to see your chart!</p>
          </div>
        )}
      </div>

      {/* Study Streak Heatmap */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm transition-colors">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Study Streak</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 flex items-center gap-2">
          <span className="text-orange-500 font-bold flex items-center gap-1">🔥 {streak} {streak === 1 ? 'Day' : 'Days'}</span> current streak
        </p>
        <div className="flex flex-wrap gap-2 justify-start items-center">
          {heatmapData.map((level, idx) => (
            <div key={idx}
              className={`w-5 h-5 md:w-6 md:h-6 rounded-md ${getIntensityColor(level)} transition-colors hover:ring-2 hover:ring-offset-1 hover:ring-primary-500 cursor-pointer`}
              title={`Activity Level: ${level}`}
            ></div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-end gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>Less</span>
          <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800"></div>
          <div className="w-3 h-3 rounded-sm bg-primary-200 dark:bg-primary-900"></div>
          <div className="w-3 h-3 rounded-sm bg-primary-400 dark:bg-primary-700"></div>
          <div className="w-3 h-3 rounded-sm bg-primary-600 dark:bg-primary-500"></div>
          <div className="w-3 h-3 rounded-sm bg-primary-900 dark:bg-primary-300"></div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
