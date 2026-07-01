import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

// Translate every Firebase auth error into a plain-English fix
function getLoginError(code) {
  switch (code) {
    case 'auth/user-not-found':
      return { text: 'No account found with this email. Did you mean to sign up?', field: 'email' };
    case 'auth/wrong-password':
      return { text: 'Wrong password. Try again or use "Continue with Google" if you signed up that way.', field: 'password' };
    case 'auth/invalid-credential':
      return { text: 'Email or password is incorrect. Double-check both and try again.', field: 'both' };
    case 'auth/invalid-email':
      return { text: 'Enter a valid email like name@gmail.com', field: 'email' };
    case 'auth/too-many-requests':
      return { text: 'Too many failed attempts. Your account is temporarily locked — try again in a few minutes or reset your password.', field: null };
    case 'auth/user-disabled':
      return { text: 'This account has been disabled. Contact support.', field: null };
    case 'auth/network-request-failed':
      return { text: 'No internet connection. Check your network and try again.', field: null };
    default:
      return { text: 'Sign in failed. Check your email and password.', field: null };
  }
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signInWithGoogle, currentUser } = useAuth();

  const from = location.state?.from?.pathname || '/dashboard';

  // Auto-redirect if already logged in (handles Google Redirect result)
  useEffect(() => {
    if (currentUser) {
      navigate(from, { replace: true });
    }
  }, [currentUser, navigate, from]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null); // { text, field }
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });

  // Inline validators
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const emailError = touched.email && email && !emailValid ? 'Enter a valid email (e.g. name@gmail.com)' : null;
  const passwordError = touched.password && password && password.length < 6 ? 'Password must be at least 6 characters' : null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    if (!emailValid) return setError({ text: 'Enter a valid email address (e.g. name@gmail.com)', field: 'email' });
    if (password.length < 6) return setError({ text: 'Password must be at least 6 characters long', field: 'password' });
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err.code, err.message);
      setError(getLoginError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate(from, { replace: true });
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        console.error('Google sign-in error:', err.code, err.message);
        setError({ text: 'Google sign-in failed: ' + err.message, field: null });
      }
    } finally {
      setLoading(false);
    }
  };

  const fieldBorder = (field) => {
    if (error?.field === field || error?.field === 'both') return 'border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-red-500/20';
    return 'border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-primary-500/20';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-50 dark:from-primary-900/20 via-gray-50 dark:via-gray-950 to-white dark:to-gray-950 transition-colors duration-200 px-4">
      <div className="max-w-md w-full p-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-800/50">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400">
            AI Study Planner
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Welcome back! Ready to continue studying?
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
        <form onSubmit={handleLogin} className="space-y-5" noValidate>
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, email: true }))}
              className={`w-full px-4 py-3 rounded-xl border ${fieldBorder('email')} focus:ring-2 bg-gray-50/50 dark:bg-gray-800/50 dark:text-white dark:placeholder-gray-500 outline-none transition`}
              placeholder="you@gmail.com"
            />
            {emailError && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{emailError}</p>}
            {touched.email && email && emailValid && <p className="mt-1 text-xs text-green-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Looks good!</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, password: true }))}
                className={`w-full px-4 py-3 rounded-xl border ${fieldBorder('password')} focus:ring-2 bg-gray-50/50 dark:bg-gray-800/50 dark:text-white dark:placeholder-gray-500 outline-none transition pr-12`}
                placeholder="Your password (min. 6 characters)"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {passwordError && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{passwordError}</p>}
            <div className="flex justify-end mt-2">
              <Link to="/forgot-password" className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-500 transition-colors">
                Forgot password?
              </Link>
            </div>
          </div>

          {/* Hint box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl px-4 py-3 text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <p className="font-semibold mb-1">Sign-in rules:</p>
            <p>• Email: must be a valid format — e.g. <strong>name@gmail.com</strong></p>
            <p>• Password: at least <strong>6 characters</strong></p>
            <p>• Forgot password? Click the <strong>Forgot password?</strong> link above to reset it.</p>
          </div>

          <button type="submit" disabled={loading}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all disabled:opacity-70 disabled:pointer-events-none">
            {loading
              ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <><LogIn className="w-4 h-4" /> Sign In</>}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">OR</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* Google Sign-In */}
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
          Don't have an account?{' '}
          <Link to="/signup" className="font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 transition-colors">
            Create one free →
          </Link>
        </p>
      </div>
    </div>
  );
}
