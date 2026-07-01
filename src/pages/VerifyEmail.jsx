import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../services/firebase';
import { sendEmailVerification } from 'firebase/auth';
import { Mail, LogOut, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function VerifyEmail() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState(null); // { text, type: 'error' | 'success' }
  const [cooldown, setCooldown] = useState(0);

  // Cooldown timer for resending
  useEffect(() => {
    if (cooldown === 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // If the user somehow verified, redirect immediately
  useEffect(() => {
    if (currentUser?.emailVerified) {
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, navigate]);

  const handleCheckVerification = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    setMessage(null);
    try {
      // Force reload user auth state from Firebase
      await auth.currentUser.reload();
      const updatedUser = auth.currentUser;

      if (updatedUser.emailVerified) {
        setMessage({ text: 'Email verified successfully! Redirecting...', type: 'success' });
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
          // Reload page to ensure App state gets the updated user
          window.location.reload();
        }, 1500);
      } else {
        setMessage({ text: 'Email is not verified yet. Please click the link sent to your email.', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Error checking verification. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!auth.currentUser || cooldown > 0) return;
    setResending(true);
    setMessage(null);
    try {
      await sendEmailVerification(auth.currentUser);
      setMessage({ text: 'Verification email sent! Check your inbox.', type: 'success' });
      setCooldown(60); // 60 seconds cooldown
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to send email. Try again in a few minutes.', type: 'error' });
    } finally {
      setResending(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-50 dark:from-primary-900/20 via-gray-50 dark:via-gray-950 to-white dark:to-gray-950 transition-colors duration-200 px-4">
      <div className="max-w-md w-full p-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-800/50 text-center space-y-6">
        
        {/* Verification Icon */}
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/20">
          <Mail className="w-8 h-8" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Verify Your Email</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            We sent a verification link to: <br />
            <strong className="text-gray-800 dark:text-gray-200">{currentUser?.email}</strong>
          </p>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl text-xs text-amber-700 dark:text-amber-400">
            ⚠️ <strong>Tip:</strong> Agar email inbox mein nahi mila, toh please apne <strong>Spam</strong> ya <strong>Junk</strong> folder ko check karein aur use <strong>"Not Spam"</strong> mark karein.
          </div>
        </div>

        {/* Notification banner */}
        {message && (
          <div className={`p-4 rounded-xl border text-sm flex items-start gap-2 text-left ${
            message.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300' 
              : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleCheckVerification}
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all disabled:opacity-75"
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              'I have verified my email'
            )}
          </button>

          <button
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="w-full py-2.5 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
          >
            {resending ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Verification Email'}
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-200 dark:bg-gray-800" />

        {/* Back to Login */}
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 font-semibold transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out / Use different email
        </button>

      </div>
    </div>
  );
}
