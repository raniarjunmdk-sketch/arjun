/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, Sparkles, Check, Shuffle, ShieldCheck } from 'lucide-react';

interface UsernameModalProps {
  isOpen: boolean;
  currentUsername: string;
  isInitialOnboarding?: boolean;
  onSave: (newUsername: string) => void;
  onClose?: () => void;
}

const SAMPLE_NAMES = [
  'Royal_Ace',
  'Hazari_King',
  'Card_Master',
  'Lucky_Player',
  'Tas_Pro',
  'Zen_Gamer',
  'Victory_Champ',
  'Gold_Dealer',
];

export const UsernameModal: React.FC<UsernameModalProps> = ({
  isOpen,
  currentUsername,
  isInitialOnboarding = false,
  onSave,
  onClose,
}) => {
  const [usernameInput, setUsernameInput] = useState<string>(currentUsername || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRandomize = () => {
    const random = SAMPLE_NAMES[Math.floor(Math.random() * SAMPLE_NAMES.length)];
    const num = Math.floor(10 + Math.random() * 90);
    setUsernameInput(`${random}_${num}`);
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = usernameInput.trim();
    if (!trimmed) {
      setErrorMsg('Username cannot be empty.');
      return;
    }
    if (trimmed.length < 3) {
      setErrorMsg('Username must be at least 3 characters long.');
      return;
    }
    if (trimmed.length > 20) {
      setErrorMsg('Username cannot exceed 20 characters.');
      return;
    }

    // Save and mark onboarding complete in localStorage
    localStorage.setItem('solis_username_created', 'true');
    onSave(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-gradient-to-b from-[#0d281a] via-[#0a1e13] to-[#07150d] border border-amber-500/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col items-center text-center gap-3">
          {/* Badge Icon */}
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-inner">
            <User className="w-8 h-8" />
          </div>

          <div>
            <h2 className="font-display text-xl font-black text-white">
              {isInitialOnboarding ? 'Welcome! Create Your Username' : 'Edit Your Username'}
            </h2>
            <p className="text-xs text-emerald-300/80 mt-1 leading-relaxed">
              {isInitialOnboarding
                ? 'Choose a display name for card tables and friend invites. You can change this anytime in Settings.'
                : 'Update your display name across Hazari tables and friend rankings.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                Your Player Name
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={usernameInput}
                  onChange={e => {
                    setUsernameInput(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="e.g. Hazari_King"
                  maxLength={20}
                  className="flex-1 px-4 py-3 rounded-xl bg-black/60 border border-emerald-700/60 font-bold text-white placeholder:text-slate-500 text-sm outline-none focus:border-amber-400 transition-colors"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleRandomize}
                  className="p-3 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/50 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1 transition-transform active:scale-95"
                  title="Generate Random Name"
                >
                  <Shuffle className="w-4 h-4" />
                </button>
              </div>
              {errorMsg && (
                <span className="text-xs text-rose-400 font-semibold mt-1">
                  {errorMsg}
                </span>
              )}
            </div>

            {/* Account Bonus Notice */}
            <div className="p-3 rounded-xl bg-emerald-900/30 border border-emerald-500/30 flex items-center gap-2.5 text-left">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="text-[11px] text-emerald-200">
                <span className="font-bold text-amber-300">1,000 Starting Coins</span> added to your wallet automatically upon registration!
              </div>
            </div>

            <div className="flex items-center gap-2.5 mt-1">
              {!isInitialOnboarding && onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-transform"
              >
                <Check className="w-4 h-4" />
                <span>{isInitialOnboarding ? 'Start Playing' : 'Save Username'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
