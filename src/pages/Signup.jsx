import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

function getSignupError(code) {
  switch (code) {
    case 'auth/email-already-in-use':
      return { text: 'An account already exists with this email. Try signing in instead, or use Google.', field: 'email' };
    case 'auth/invalid-email':
      return { text: 'Enter a valid email — e.g. name@gmail.com', field: 'email' };
    case 'auth/weak-password':
      return { text: 'Password is too weak. Use at least 6 characters with a mix of letters and numbers.', field: 'password' };
    case 'auth/network-request-failed':
      return { text: 'No internet connection. Check your network and try again.', field: null };
    default:
      return { text: 'Failed to create account. Please try again.', field: null };
  }
}

// Password strength: 0-4
function getPasswordStrength(pwd) {
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9!@#$%^&*]/.test(pwd)) score++;
  return score;
}

const STRENGTH_LABEL = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLOR = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-500'];

export default function Signup() {
  const navigate = useNavigate();
  const { signup, signInWithGoogle } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ name: false, email: false, password: false });

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const emailError = touched.email && email && !emailValid ? 'Enter a valid email (e.g. name@gmail.com)' : null;
  const nameError = touched.name && !name.trim() ? 'Name is required' : null;
  const passwordStrength = getPasswordStrength(password);
  const passwordError = touched.password && password && password.length < 6
    ? 'Password must be at least 6 characters' : null;

  const fieldBorder = (field) => {
    if (error?.field === field) return 'border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-red-500/20';
    return 'border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-primary-500/20';
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError({ text: 'Please enter your full name.', field: 'name' });
    if (!emailValid) return setError({ text: 'Enter a valid email address (e.g. name@gmail.com)', field: 'email' });
    if (password.length < 6) return setError({ text: 'Password must be at least 6 characters long.', field: 'password' });
    setLoading(true);
    try {
      await signup(email, password, name.trim());
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error(err.code, err.message);
      setError(getSignupError(err.code));
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError({ text: 'Google sign-in failed. Try again.', field: null });
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-secondary-50 dark:from-secondary-900/20 via-gray-50 dark:via-gray-950 to-white dark:to-gray-950 transition-colors duration-200 px-4 py-8">
      <div className="max-w-md w-full p-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-800/50">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400">
            Create Account
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Join thousands of students studying smarter with AI.
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error.text}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSignup} className="space-y-5" noValidate>
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
            <input type="text" value={name}
              onChange={e => setName(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, name: true }))}
              className={`w-full px-4 py-3 rounded-xl border ${fieldBorder('name')} focus:ring-2 bg-gray-50/50 dark:bg-gray-800/50 dark:text-white dark:placeholder-gray-500 outline-none transition`}
              placeholder="e.g. Shailendra Kumar"
            />
            {nameError && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{nameError}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email address</label>
            <input type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, email: true }))}
              className={`w-full px-4 py-3 rounded-xl border ${fieldBorder('email')} focus:ring-2 bg-gray-50/50 dark:bg-gray-800/50 dark:text-white dark:placeholder-gray-500 outline-none transition`}
              placeholder="you@gmail.com"
            />
            {emailError && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{emailError}</p>}
            {touched.email && email && emailValid && <p className="mt-1 text-xs text-green-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Valid email ✓</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, password: true }))}
                className={`w-full px-4 py-3 rounded-xl border ${fieldBorder('password')} focus:ring-2 bg-gray-50/50 dark:bg-gray-800/50 dark:text-white dark:placeholder-gray-500 outline-none transition pr-12`}
                placeholder="Min. 6 characters"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Strength bar */}
            {password.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= passwordStrength ? STRENGTH_COLOR[passwordStrength] : 'bg-gray-200 dark:bg-gray-700'}`} />
                  ))}
                </div>
                <p className={`text-xs font-medium ${passwordStrength <= 1 ? 'text-red-500' : passwordStrength <= 2 ? 'text-yellow-500' : passwordStrength === 3 ? 'text-blue-500' : 'text-green-500'}`}>
                  {STRENGTH_LABEL[passwordStrength]} password
                </p>
              </div>
            )}

            {passwordError && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{passwordError}</p>}
          </div>

          {/* Rules hint */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl px-4 py-3 text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <p className="font-semibold mb-1">Password requirements:</p>
            <p className={password.length >= 6 ? 'text-green-600 dark:text-green-400' : ''}>
              {password.length >= 6 ? '✅' : '○'} At least <strong>6 characters</strong>
            </p>
            <p className={password.length >= 10 ? 'text-green-600 dark:text-green-400' : ''}>
              {password.length >= 10 ? '✅' : '○'} 10+ characters (recommended)
            </p>
            <p className={/[A-Z]/.test(password) ? 'text-green-600 dark:text-green-400' : ''}>
              {/[A-Z]/.test(password) ? '✅' : '○'} At least one <strong>uppercase letter</strong>
            </p>
            <p className={/[0-9!@#$%^&*]/.test(password) ? 'text-green-600 dark:text-green-400' : ''}>
              {/[0-9!@#$%^&*]/.test(password) ? '✅' : '○'} At least one <strong>number or symbol</strong>
            </p>
          </div>

          <button type="submit" disabled={loading}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all disabled:opacity-70 disabled:pointer-events-none">
            {loading
              ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <><UserPlus className="w-4 h-4" /> Create Account</>}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">OR</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* Google */}
        <button onClick={handleGoogleSignIn} disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-70 disabled:pointer-events-none">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 transition-colors">
            Sign in →
          </Link>
        </p>
      </div>
    </div>
  );
}
