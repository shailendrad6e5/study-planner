/**
 * AI Study Suggestions Engine
 * Simple rule-based logic to prioritize studying.
 */

export function generateAITimetable(inputs) {
  // inputs: { subjects: [{ name, examDate, difficulty, totalTopics }], dailyHours: number, analyticsData: [] (optional) }
  const slots = [];
  const today = new Date();
  let aiMessage = "";
  let urgentExams = [];
  
  // 1. Calculate Priority Scores (Exam Proximity + Difficulty)
  const evaluatedSubjects = inputs.subjects.map(subject => {
    const daysUntilExam = (new Date(subject.examDate) - today) / (1000 * 60 * 60 * 24);
    
    // Base score from difficulty
    let score = subject.difficulty * 10;
    
    // Proximity multiplier
    if (daysUntilExam < 0) score = 0; // Past exam
    else if (daysUntilExam < 3) {
      score += 100;
      urgentExams.push(subject.name);
    }
    else if (daysUntilExam < 7) score += 50;
    else if (daysUntilExam < 14) score += 20;

    // Weak Subject Detection Mock (If implemented in real data, read from analytics)
    // For now we assume high totalTopics equates to higher need if difficulty is also high
    if (subject.totalTopics > 15 && subject.difficulty >= 2) {
       score += 15;
    }

    return { ...subject, daysUntilExam, score };
  })
  .filter(s => s.score > 0)
  .sort((a, b) => b.score - a.score);

  // Determine top-level message
  if (urgentExams.length > 0) {
    aiMessage = `${urgentExams.join(' and ')} ${urgentExams.length > 1 ? 'exams are' : 'exam is'} very near! I have prioritized heavy revision sessions.`;
  } else if (evaluatedSubjects[0]) {
    aiMessage = `Based on your syllabus, ${evaluatedSubjects[0].name} requires the most attention right now. Spread your focus.`;
  } else {
    aiMessage = "Your schedule looks clear. Maintained balanced study blocks across all subjects.";
  }

  // 2. Distribute Hours (Overload Prevention & Distribution)
  let hoursRemaining = inputs.dailyHours;
  let timeOffset = 9; // Start at 9:00 AM
  let subjectFrequency = {}; // Track repeats to avoid burning out on one subject

  // Helper loop to allocate
  let iteration = 0;
  while (hoursRemaining > 0 && iteration < 10) { // Safety break
    let allocatedThisRound = false;

    for (const subject of evaluatedSubjects) {
      if (hoursRemaining <= 0) break;
      
      // Limit 2 sessions per subject per day
      if ((subjectFrequency[subject.id] || 0) >= 2) continue;

      // 3. Difficulty block weighting
      let allocateHours = 0;
      if (subject.daysUntilExam < 7) {
        allocateHours = 2; // Urgent gets big blocks
      } else if (subject.difficulty === 3) {
        allocateHours = 1.5; // Hard subjects
      } else {
        allocateHours = 1; // Easy subjects get shorter frequency
      }

      if (allocateHours > hoursRemaining) allocateHours = hoursRemaining;
      
      // Convert time offset
      const hour24 = Math.floor(timeOffset);
      const minutes = Math.round((timeOffset - hour24) * 60);
      const ampm = hour24 >= 12 ? 'PM' : 'AM';
      let displayHour = hour24 > 12 ? hour24 - 12 : hour24;
      if (displayHour === 0) displayHour = 12; 
      const displayTime = `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;

      // Insert study slot
      slots.push({
        time: displayTime,
        subject: subject.name,
        topic: subject.daysUntilExam < 7 ? "Mock Exams & Past Papers" : "Chapter Review & Practice",
        type: subject.daysUntilExam < 7 ? "Urgent Revision" : "Deep Study",
        hours: allocateHours,
        color: subject.color || 'bg-blue-500'
      });

      timeOffset += allocateHours;
      hoursRemaining -= allocateHours;
      subjectFrequency[subject.id] = (subjectFrequency[subject.id] || 0) + 1;
      allocatedThisRound = true;

      // Insert break if there are still hours left
      if (hoursRemaining > 0) {
        const breakHours = 0.25; // 15 minute break
        timeOffset += breakHours;
        // Not adjusting hours remaining, breaks don't count towards study quota.
      }
    }

    if (!allocatedThisRound) break; // Couldn't allocate anywhere
    iteration++;
  }

  return {
    slots,
    aiMessage
  };
}

export function getAIInsights(analyticsData, tasks, subjects) {
  const insights = [];
  
  // Rule 1: Neglected subject (No completion in recent tasks)
  const neglected = subjects.find(sub => {
    const subTasks = tasks.filter(t => t.subjectId === sub.id && t.completed);
    return subTasks.length === 0;
  });

  if (neglected) {
    insights.push(`You are ignoring ${neglected.name}! Recommend adding an extra 1h session today.`);
  }

  // Rule 2: Focus hours low? (Assume daily goal is 4 hours)
  const todayEntry = analyticsData[analyticsData.length - 1]; // Assume last is today for mock
  if (todayEntry && todayEntry.hours < 2) {
    insights.push(`Your focus hours are low today (${todayEntry.hours}h). Try to complete at least one more Pomodoro cycle.`);
  }

  return insights;
}
