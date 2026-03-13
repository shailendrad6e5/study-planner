# AI Study Planner 🎓

A modern, intelligent web application designed for college students to manage their study schedule smartly. 
The app features an AI-driven smart timetable generator, an integrated focus timer, and insightful productivity analytics, all wrapped in a beautifully crafted responsive interface.

## ✨ Core Features

1. **Smart Timetable Generator**: Describe your subjects, their difficulty, and exam dates. The AI logic will allocate optimal daily study hours prioritizing urgent and hard subjects.
2. **Focus Timer (Pomodoro)**: A sleek built-in timer that cycles between intense 25-minute focus blocks and 5-minute breaks.
3. **Productivity Analytics**: Visualize your study consistency over the week with beautiful gradient area charts.
4. **Task & Topic Tracker**: Track your syllabus progression directly from the dynamic dashboard.
5. **AI Insights**: Smart alerts that notify you when you are neglecting a subject.

## 🚀 Tech Stack

- **Frontend**: React + Vite
- **Routing**: React Router DOM (v6)
- **Styling**: Tailwind CSS (v3) + Glassmorphism UI
- **Icons**: Lucide React
- **Charts**: Recharts
- **Backend/Auth Service Prepared**: Firebase

## 📦 Getting Started

### 1. Install Dependencies
Make sure you have Node.js installed. In the project directory, run:

```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser to view the app.

### 3. Connect to Firebase (Optional / Production)
The app is currently configured to run entirely via local mock data to allow for immediate testing. 
To connect a real backend:
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Open `src/services/firebase.js`
3. Replace the placeholder config with your actual Firebase project settings.
4. Update `src/context/AuthContext.jsx` to actively use `signInWithEmailAndPassword` from Firebase.

## 🎨 Design Guide
The application utilizes a `primary` (blue) and `secondary` (purple) color palette configured within `tailwind.config.js`. You can globally change the theme by adjusting the hex values there. Components heavily utilize the `@apply` directive in `src/index.css` for consistent hover effects (`.card-hover`).

Created by an expert full-stack developer. Enjoy studying smarter!
