import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Plus, Book, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  getSubjects, addSubject, deleteSubject,
  getTasks, addTask, updateTask, deleteTask 
} from '../services/firestoreService';

const SUBJECT_COLORS = [
  'bg-blue-500', 'bg-purple-500', 'bg-indigo-500', 'bg-green-500',
  'bg-orange-500', 'bg-pink-500', 'bg-teal-500', 'bg-red-500',
];

export default function TaskTracker({ onDataChange }) {
  const { currentUser } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [showAddSubject, setShowAddSubject] = useState(false);

  // Load subjects and tasks from Firestore on mount
  useEffect(() => {
    if (!currentUser) return;
    const loadData = async () => {
      setLoading(true);
      try {
        const [fetchedSubjects, fetchedTasks] = await Promise.all([
          getSubjects(currentUser.uid),
          getTasks(currentUser.uid),
        ]);
        setSubjects(fetchedSubjects);
        setTasks(fetchedTasks);
        if (fetchedSubjects.length > 0) setSelectedSubject(fetchedSubjects[0].id);
      } catch (err) {
        console.error('Error loading TaskTracker data:', err);
      }
      setLoading(false);
    };
    loadData();
  }, [currentUser]);

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubjectName.trim() || !currentUser) return;
    const colorIndex = subjects.length % SUBJECT_COLORS.length;
    const newData = {
      name: newSubjectName.trim(),
      color: SUBJECT_COLORS[colorIndex],
      difficulty: 2,
    };
    try {
      const id = await addSubject(currentUser.uid, newData);
      const newSubject = { id, userId: currentUser.uid, ...newData };
      const updated = [...subjects, newSubject];
      setSubjects(updated);
      setSelectedSubject(id);
      setNewSubjectName('');
      setShowAddSubject(false);
      onDataChange?.();
    } catch (err) {
      console.error('Error adding subject:', err);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !selectedSubject || !currentUser) return;
    const subject = subjects.find(s => s.id === selectedSubject);
    const taskData = {
      subjectId: selectedSubject,
      subjectName: subject?.name || '',
      title: newTaskTitle.trim(),
    };
    try {
      const id = await addTask(currentUser.uid, taskData);
      setTasks(prev => [...prev, { id, userId: currentUser.uid, ...taskData, completed: false }]);
      setNewTaskTitle('');
      onDataChange?.();
    } catch (err) {
      console.error('Error adding task:', err);
    }
  };

  const handleToggleTask = async (task) => {
    const newCompleted = !task.completed;
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: newCompleted } : t));
    try {
      await updateTask(task.id, { completed: newCompleted });
      onDataChange?.();
    } catch (err) {
      console.error('Error updating task:', err);
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: task.completed } : t));
    }
  };

  const handleDeleteTask = async (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    try {
      await deleteTask(taskId);
      onDataChange?.();
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const handleDeleteSubject = async (subjectId) => {
    setSubjects(prev => prev.filter(s => s.id !== subjectId));
    const removedTasks = tasks.filter(t => t.subjectId === subjectId);
    setTasks(prev => prev.filter(t => t.subjectId !== subjectId));
    setSelectedSubject(prev => prev === subjectId ? '' : prev);
    try {
      await deleteSubject(subjectId);
      await Promise.all(removedTasks.map(t => deleteTask(t.id)));
      onDataChange?.();
    } catch (err) {
      console.error('Error deleting subject:', err);
    }
  };

  // Progress per subject
  const progressMap = subjects.reduce((acc, sub) => {
    const subTasks = tasks.filter(t => t.subjectId === sub.id);
    const completed = subTasks.filter(t => t.completed).length;
    const total = subTasks.length;
    acc[sub.id] = { completed, total, percentage: total === 0 ? 0 : Math.round((completed / total) * 100) };
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm mt-8 flex items-center justify-center min-h-[200px]">
        <div className="flex flex-col items-center gap-3 text-gray-400 dark:text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm mt-8 transition-colors">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight flex items-center gap-2">
            <Book className="w-5 h-5 text-primary-500 dark:text-primary-400" />
            Task & Topic Tracker
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Add subjects and study tasks</p>
        </div>
        <button
          onClick={() => setShowAddSubject(v => !v)}
          className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Subject
        </button>
      </div>

      <div className="space-y-6">
        {/* Add Subject Form */}
        {showAddSubject && (
          <form onSubmit={handleAddSubject} className="flex gap-2 p-4 rounded-xl border border-primary-100 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-900/20">
            <input
              type="text"
              autoFocus
              value={newSubjectName}
              onChange={e => setNewSubjectName(e.target.value)}
              placeholder="Subject name (e.g. Mathematics)"
              className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 outline-none"
            />
            <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Add</button>
            <button type="button" onClick={() => setShowAddSubject(false)} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Cancel</button>
          </form>
        )}

        {/* Subject Progress Bars */}
        {subjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {subjects.map(subject => (
              <div key={subject.id} className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 group relative">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate flex-1">{subject.name}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{progressMap[subject.id]?.percentage || 0}%</span>
                    <button
                      onClick={() => handleDeleteSubject(subject.id)}
                      title="Delete subject"
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-500 transition-all rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full ${subject.color} transition-all duration-500`}
                    style={{ width: `${progressMap[subject.id]?.percentage || 0}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {progressMap[subject.id]?.completed || 0} of {progressMap[subject.id]?.total || 0} tasks done
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-400 dark:text-gray-500">
            <p className="text-sm">No subjects yet. Click <strong className="text-gray-600 dark:text-gray-300">"Add Subject"</strong> to get started!</p>
          </div>
        )}

        <hr className="border-gray-100 dark:border-gray-800" />

        {/* Add Task Form */}
        {subjects.length > 0 && (
          <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm dark:text-white outline-none"
            >
              <option value="">Select subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <div className="flex gap-2 w-full">
              <input
                type="text"
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                placeholder="E.g., Complete Chapter 3..."
                className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 outline-none"
              />
              <button type="submit" className="flex-shrink-0 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl flex items-center justify-center transition-colors shadow-sm">
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </form>
        )}

        {/* Task List */}
        <div className="space-y-2 mt-2 max-h-72 overflow-y-auto pr-1">
          {tasks.length === 0 ? (
            <p className="text-center text-gray-400 dark:text-gray-500 py-6 text-sm">
              {subjects.length === 0 ? 'Add a subject first, then add your tasks.' : 'No tasks yet. Add your first task above!'}
            </p>
          ) : (
            tasks.map(task => {
              const subject = subjects.find(s => s.id === task.subjectId);
              return (
                <div key={task.id} className={`flex items-center justify-between p-3 rounded-xl border ${task.completed ? 'bg-gray-50 dark:bg-gray-800/30 border-gray-100 dark:border-gray-800/50' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-800'} transition-all group`}>
                  <div className="flex items-center gap-3 flex-1 overflow-hidden cursor-pointer" onClick={() => handleToggleTask(task)}>
                    <button className={`flex-shrink-0 transition-colors ${task.completed ? 'text-green-500' : 'text-gray-300 dark:text-gray-600 hover:text-primary-500'}`}>
                      {task.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                    </button>
                    <div className="truncate">
                      <p className={`text-sm font-medium ${task.completed ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-gray-100'}`}>
                        {task.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${subject?.color || 'bg-gray-400'}`}></span>
                        {subject?.name || task.subjectName || 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
