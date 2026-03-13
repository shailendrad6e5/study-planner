import React, { useState, useEffect } from 'react';
import { generateAITimetable } from '../utils/aiEngine';
import { Calendar as CalendarIcon, Clock, BookOpen, AlertCircle, Printer, Save, Download, LayoutDashboard, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getSubjects, saveTimetable, getTimetable } from '../services/firestoreService';

const SUBJECT_COLORS = [
  'bg-blue-500', 'bg-purple-500', 'bg-indigo-500', 'bg-green-500',
  'bg-orange-500', 'bg-pink-500', 'bg-teal-500', 'bg-red-500',
];

export default function Timetable() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [dailyHours, setDailyHours] = useState(4);
  const [schedule, setSchedule] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  // Load subjects from Firestore on mount — same data as TaskTracker on Dashboard
  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      setLoadingSubjects(true);
      try {
        const fetched = await getSubjects(currentUser.uid);
        setSubjects(fetched.map(s => ({
          ...s,
          examDate: s.examDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          totalTopics: s.totalTopics || 10,
          difficulty: s.difficulty || 2,
          color: s.color || 'bg-blue-500',
        })));
      } catch (err) {
        console.error('Error loading subjects:', err);
      }
      setLoadingSubjects(false);
    };
    load();
  }, [currentUser]);

  const updateSubjectConfig = (id, field, value) => {
    setSubjects(subjects.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeSubject = (id) => {
    setSubjects(subjects.filter(s => s.id !== id));
  };

  const handleGenerate = () => {
    if (subjects.length === 0) return;
    setIsGenerating(true);
    setTimeout(() => {
      const newSchedule = generateAITimetable({ subjects, dailyHours });
      setSchedule(newSchedule);
      setIsGenerating(false);
    }, 1200);
  };

  const handleSaveTimetable = async () => {
    if (!schedule || !currentUser) return;
    setIsSaving(true);
    try {
      await saveTimetable(currentUser.uid, schedule);
      alert('Timetable saved successfully! ✅');
    } catch (error) {
      console.error('Error saving timetable:', error);
      alert('Failed to save timetable.');
    }
    setIsSaving(false);
  };

  const handleLoadTimetable = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const saved = await getTimetable(currentUser.uid);
      if (saved) {
        setSchedule(saved);
      } else {
        alert('No saved timetable found.');
      }
    } catch (error) {
      console.error('Error loading timetable:', error);
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Smart Timetable</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Let AI organize your schedule for optimal retention.</p>
        </div>
        <div className="flex gap-3">
          {schedule && (
            <>
              <button onClick={handleSaveTimetable} disabled={isSaving}
                className="hidden md:flex bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 px-4 py-2.5 rounded-xl font-medium shadow-sm transition-all items-center gap-2">
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save'}</span>
              </button>
              <button onClick={() => window.print()}
                className="hidden md:flex bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 px-4 py-2.5 rounded-xl font-medium shadow-sm transition-all items-center gap-2">
                <Printer className="w-4 h-4" />
                <span>Export PDF</span>
              </button>
            </>
          )}
          <button onClick={handleLoadTimetable} disabled={isLoading}
            className="flex bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 px-4 py-2.5 rounded-xl font-medium shadow-sm transition-all items-center gap-2">
            <Download className="w-4 h-4" />
            <span>{isLoading ? 'Loading...' : 'Load Saved'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Parameters Column */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-6 h-fit print:hidden transition-colors">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary-500 dark:text-primary-400" />
              AI Parameters
            </h3>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Daily Study Hours</label>
            <div className="flex items-center gap-4">
              <input type="range" min="1" max="12" step="0.5" value={dailyHours}
                onChange={e => setDailyHours(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600" />
              <span className="font-bold text-lg text-primary-600 dark:text-primary-400 w-12">{dailyHours}h</span>
            </div>
          </div>

          <hr className="border-gray-100 dark:border-gray-800" />

          <div className="space-y-4">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Subject Priorities</label>
            
            {loadingSubjects ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
                <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                Loading your subjects...
              </div>
            ) : subjects.length === 0 ? (
              <div className="text-center py-4 space-y-2">
                <p className="text-gray-400 dark:text-gray-500 text-sm">No subjects found.</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs">Add subjects in the Task Tracker on your Dashboard first.</p>
                <button onClick={() => navigate('/dashboard')}
                  className="mt-2 flex items-center gap-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline mx-auto">
                  <LayoutDashboard className="w-3.5 h-3.5" /> Go to Dashboard
                </button>
              </div>
            ) : (
              subjects.map(sub => (
                <div key={sub.id} className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
                      <span className={`w-3 h-3 rounded-full ${sub.color}`}></span>
                      {sub.name}
                    </div>
                    <button onClick={() => removeSubject(sub.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Exam Date</span>
                      <input type="date" value={sub.examDate}
                        onChange={e => updateSubjectConfig(sub.id, 'examDate', e.target.value)}
                        className="w-full text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-white" />
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Difficulty</span>
                        <select value={sub.difficulty} onChange={e => updateSubjectConfig(sub.id, 'difficulty', parseInt(e.target.value))}
                          className="w-full text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-white">
                          <option value={1}>Easy</option>
                          <option value={2}>Medium</option>
                          <option value={3}>Hard</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Total Topics</span>
                        <input type="number" min="1" max="100" value={sub.totalTopics || 10}
                          onChange={e => updateSubjectConfig(sub.id, 'totalTopics', parseInt(e.target.value) || 1)}
                          className="w-full text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <button onClick={handleGenerate} disabled={isGenerating || subjects.length === 0}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white px-5 py-3 rounded-xl font-bold shadow-md shadow-primary-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:pointer-events-none">
            {isGenerating ? (
              <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating...</>
            ) : (
              <>✨ Generate Optimal Schedule</>
            )}
          </button>
        </div>

        {/* Schedule Output Column */}
        <div className="col-span-2">
          {schedule ? (
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm animate-in fade-in zoom-in duration-500 transition-colors">
              <div className="flex items-center justify-between mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <CalendarIcon className="w-6 h-6 text-primary-500 dark:text-primary-400" />
                  Your AI Schedule for Today
                </h3>
                <button onClick={() => setSchedule(null)} className="text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1 rounded-lg transition-colors">
                  Discard
                </button>
              </div>

              {schedule.aiMessage && (
                <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/40 dark:to-secondary-900/40 border border-primary-100 dark:border-primary-800 flex items-start gap-3">
                  <span className="text-xl">✨</span>
                  <p className="text-sm font-medium text-primary-800 dark:text-primary-200">
                    <span className="font-bold">AI Insight:</span> {schedule.aiMessage}
                  </p>
                </div>
              )}

              <div className="relative">
                <div className="absolute left-16 top-0 bottom-0 w-0.5 bg-gray-100 dark:bg-gray-800"></div>
                <div className="space-y-1">
                  {schedule.slots.map((item, idx) => (
                    <div key={idx} className="relative flex items-center py-4 group">
                      <div className="w-16 flex-shrink-0 text-right pr-4">
                        <span className="text-sm font-bold text-gray-400 dark:text-gray-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                          {item.time.split(' ')[0]}
                          <span className="text-xs ml-1">{item.time.split(' ')[1]}</span>
                        </span>
                      </div>
                      <div className={`absolute left-16 -ml-[5px] w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${item.color} shadow-sm z-10 scale-100 group-hover:scale-125 transition-transform`}></div>
                      <div className="flex-1 ml-6 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-primary-100 dark:hover:border-primary-800 hover:shadow-md bg-white dark:bg-gray-800/30 transition-all">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                            {item.subject}
                          </h4>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${item.type.includes('Urgent') ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'}`}>
                            {item.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{item.topic}</p>
                        <div className="flex items-center gap-3 text-sm font-medium text-gray-400 dark:text-gray-500">
                          <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-lg">
                            <Clock className="w-4 h-4" /> {item.hours} hours
                          </span>
                          <span onClick={() => navigate('/focus')} className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-600 cursor-pointer transition-colors">
                            <BookOpen className="w-4 h-4" /> Start Focus Session
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm text-center h-full flex flex-col items-center justify-center min-h-[400px] transition-colors">
              <div className="w-24 h-24 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/30 dark:to-secondary-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl animate-bounce">🤖</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">AI is ready</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                {subjects.length === 0 
                  ? 'Add subjects in the Task Tracker on your Dashboard, then come back to generate your schedule.'
                  : 'Adjust your parameters on the left and click generate.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
