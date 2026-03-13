import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, X } from 'lucide-react';

export default function WelcomeModal({ onClose }) {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    onClose();
    navigate('/timetable');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 max-w-md w-full p-8 animate-in zoom-in-95 duration-300">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="w-16 h-16 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/40 dark:to-secondary-900/40 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-8 h-8 text-primary-600 dark:text-primary-400" />
        </div>

        {/* Content */}
        <div className="text-center">
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-3">
            Welcome to AI Study Planner! 🎉
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-2">
            Your personalized study workspace is ready.
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-8">
            <strong className="text-gray-900 dark:text-white">Get started</strong> by adding your subjects and exam dates to generate your first AI-powered smart timetable.
          </p>

          {/* Steps */}
          <div className="text-left space-y-3 mb-8">
            {[
              { step: '1', label: 'Go to Timetable page' },
              { step: '2', label: 'Enter subject names, exam dates & difficulty' },
              { step: '3', label: 'Click Generate — AI does the rest!' },
            ].map(({ step, label }) => (
              <div key={step} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-primary-600 dark:bg-primary-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {step}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">{label}</p>
              </div>
            ))}
          </div>

          <button
            onClick={handleGetStarted}
            className="w-full py-3 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-500/30"
          >
            ✨ Generate My First Timetable
          </button>
          <button
            onClick={onClose}
            className="mt-3 w-full py-2 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            I'll explore on my own
          </button>
        </div>
      </div>
    </div>
  );
}
