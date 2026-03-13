import { 
  collection, doc, addDoc, setDoc, getDoc, getDocs, 
  updateDoc, deleteDoc, query, where, serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';

// ─── SUBJECTS ────────────────────────────────────────────────────────────────

export async function addSubject(userId, subjectData) {
  console.log('[Firestore] addSubject for uid:', userId, subjectData);
  const ref = await addDoc(collection(db, 'subjects'), {
    userId,
    ...subjectData,
    createdAt: serverTimestamp(),
  });
  console.log('[Firestore] Subject saved with id:', ref.id);
  return ref.id;
}

export async function getSubjects(userId) {
  console.log('[Firestore] getSubjects for uid:', userId);
  // IMPORTANT: No orderBy — avoids requiring Firestore composite index.
  // Sort client-side instead.
  const q = query(
    collection(db, 'subjects'),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  const results = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  // Sort by createdAt ascending (serverTimestamp may be null on first write, handle gracefully)
  results.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() ?? 0;
    const bTime = b.createdAt?.toMillis?.() ?? 0;
    return aTime - bTime;
  });
  console.log('[Firestore] getSubjects returned:', results.length, 'docs');
  return results;
}

export async function deleteSubject(subjectId) {
  console.log('[Firestore] deleteSubject:', subjectId);
  await deleteDoc(doc(db, 'subjects', subjectId));
}

// ─── TASKS ────────────────────────────────────────────────────────────────────

export async function addTask(userId, taskData) {
  console.log('[Firestore] addTask for uid:', userId, taskData);
  const ref = await addDoc(collection(db, 'tasks'), {
    userId,
    ...taskData,
    completed: false,
    createdAt: serverTimestamp(),
  });
  console.log('[Firestore] Task saved with id:', ref.id);
  return ref.id;
}

export async function getTasks(userId) {
  console.log('[Firestore] getTasks for uid:', userId);
  const q = query(
    collection(db, 'tasks'),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  const results = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  results.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() ?? 0;
    const bTime = b.createdAt?.toMillis?.() ?? 0;
    return aTime - bTime;
  });
  console.log('[Firestore] getTasks returned:', results.length, 'docs');
  return results;
}

export async function updateTask(taskId, updates) {
  console.log('[Firestore] updateTask:', taskId, updates);
  await updateDoc(doc(db, 'tasks', taskId), updates);
  console.log('[Firestore] Task updated successfully');
}

export async function deleteTask(taskId) {
  console.log('[Firestore] deleteTask:', taskId);
  await deleteDoc(doc(db, 'tasks', taskId));
}

// ─── STUDY SESSIONS ───────────────────────────────────────────────────────────

export async function addStudySession(userId, sessionData) {
  console.log('[Firestore] addStudySession for uid:', userId, sessionData);
  const ref = await addDoc(collection(db, 'studySessions'), {
    userId,
    ...sessionData,
    completedAt: serverTimestamp(),
  });
  console.log('[Firestore] Session saved with id:', ref.id);
  return ref.id;
}

export async function getStudySessions(userId) {
  console.log('[Firestore] getStudySessions for uid:', userId);
  const q = query(
    collection(db, 'studySessions'),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  const results = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  // Sort newest first (desc)
  results.sort((a, b) => {
    const aTime = a.completedAt?.toMillis?.() ?? new Date(a.date || 0).getTime();
    const bTime = b.completedAt?.toMillis?.() ?? new Date(b.date || 0).getTime();
    return bTime - aTime;
  });
  console.log('[Firestore] getStudySessions returned:', results.length, 'docs');
  return results;
}

// ─── TIMETABLE ────────────────────────────────────────────────────────────────

export async function saveTimetable(userId, scheduleData) {
  console.log('[Firestore] saveTimetable for uid:', userId);
  await setDoc(doc(db, 'timetable', userId), {
    userId,
    schedule: scheduleData,
    generatedAt: serverTimestamp(),
  });
  console.log('[Firestore] Timetable saved successfully');
}

export async function getTimetable(userId) {
  console.log('[Firestore] getTimetable for uid:', userId);
  const docSnap = await getDoc(doc(db, 'timetable', userId));
  if (docSnap.exists()) {
    console.log('[Firestore] Timetable found');
    return docSnap.data().schedule;
  }
  console.log('[Firestore] No timetable found');
  return null;
}

// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────

export async function getDashboardStats(userId) {
  console.log('[Firestore] getDashboardStats for uid:', userId);
  const [subjects, tasks, sessions] = await Promise.all([
    getSubjects(userId),
    getTasks(userId),
    getStudySessions(userId),
  ]);

  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;

  // Total focus hours
  const totalFocusMinutes = sessions
    .filter(s => s.type === 'Focus')
    .reduce((sum, s) => sum + (s.durationMinutes || 25), 0);
  const totalFocusHours = Math.round((totalFocusMinutes / 60) * 10) / 10;

  // Streak: consecutive days with at least one focus session, starting from today
  const streak = calculateStreak(sessions);

  // Motivation score: % of tasks completed
  const motivationScore = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  console.log('[Firestore] Stats — subjects:', subjects.length, 'tasks:', totalTasks, 'sessions:', sessions.length, 'streak:', streak);

  return { subjects, tasks, sessions, completedTasks, totalTasks, totalFocusHours, streak, motivationScore };
}

// ─── STREAK CALCULATION ───────────────────────────────────────────────────────
// Calculated dynamically from sessions — never stored statically.

export function calculateStreak(sessions) {
  const focusSessions = sessions.filter(s => s.type === 'Focus');
  if (focusSessions.length === 0) return 0;

  // Build a Set of date strings (YYYY-MM-DD) that had at least one session
  const studyDays = new Set(
    focusSessions.map(s => {
      // completedAt is a Firestore Timestamp, date is ISO string fallback
      const date = s.completedAt?.toDate?.() ?? new Date(s.date || s.completedAt);
      return date.toDateString(); // e.g. "Fri Mar 13 2026"
    })
  );

  // Count consecutive days backwards from today
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (studyDays.has(d.toDateString())) {
      streak++;
    } else {
      // Allow today to be missing (user hasn't studied yet today, but had yesterday)
      // Only break if we're past day 0
      if (i > 0) break;
    }
  }
  return streak;
}

// ─── ANALYTICS CHART DATA ─────────────────────────────────────────────────────

export function buildWeeklyChartData(sessions) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hoursPerDay = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 6);
  oneWeekAgo.setHours(0, 0, 0, 0);

  sessions
    .filter(s => s.type === 'Focus')
    .forEach(s => {
      const date = s.completedAt?.toDate?.() ?? new Date(s.date || s.completedAt);
      if (date >= oneWeekAgo) {
        const day = days[date.getDay()];
        hoursPerDay[day] = Math.round((hoursPerDay[day] + (s.durationMinutes || 25) / 60) * 10) / 10;
      }
    });

  // Return ordered from 6 days ago to today
  const todayIdx = new Date().getDay();
  return Array.from({ length: 7 }, (_, i) => {
    const dayIdx = (todayIdx - 6 + i + 7) % 7;
    const dayName = days[dayIdx];
    return { day: dayName, hours: hoursPerDay[dayName] };
  });
}

export function buildHeatmapData(sessions) {
  const dayMap = {};
  sessions
    .filter(s => s.type === 'Focus')
    .forEach(s => {
      const date = s.completedAt?.toDate?.() ?? new Date(s.date || s.completedAt);
      const key = date.toDateString();
      dayMap[key] = (dayMap[key] || 0) + 1;
    });

  return Array.from({ length: 35 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (34 - i));
    const count = dayMap[d.toDateString()] || 0;
    return Math.min(count, 4);
  });
}
