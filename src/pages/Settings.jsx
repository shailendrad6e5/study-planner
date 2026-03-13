import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Check } from 'lucide-react';

export default function Settings() {
  const { currentUser, userProfile, loadUserProfile } = useAuth();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Pre-fill with real user data
  useEffect(() => {
    setName(userProfile?.name || currentUser?.displayName || '');
  }, [userProfile, currentUser]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentUser || !name.trim()) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { name: name.trim() });
      await loadUserProfile(currentUser.uid); // Refresh global auth context
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Error saving profile:', err);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account and app preferences.</p>
      </header>

      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-6 transition-colors">
        
        {/* Profile section */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Profile</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your full name"
                className="block w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 dark:text-white focus:bg-white dark:focus:bg-gray-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input
                type="email"
                value={currentUser?.email || ''}
                disabled
                className="block w-full px-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-100 dark:bg-gray-800/50 text-gray-500 dark:text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Email cannot be changed here.</p>
            </div>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex items-center gap-2 bg-gray-900 dark:bg-white dark:text-gray-900 text-white px-6 py-2.5 rounded-xl font-semibold shadow-sm hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors disabled:opacity-60 disabled:pointer-events-none"
            >
              {saved ? <><Check className="w-4 h-4 text-green-400" /> Saved!</> : saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        <hr className="border-gray-100 dark:border-gray-800" />

        {/* Account info block */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Account Info</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Signed in as</p>
              <p className="font-semibold text-gray-900 dark:text-white truncate">{currentUser?.email || '—'}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Auth Provider</p>
              <p className="font-semibold text-gray-900 dark:text-white capitalize">
                {currentUser?.providerData?.[0]?.providerId?.replace('.com', '') || 'Email'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
