/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Smartphone, Download, Share2, X, Sparkles, Check, ArrowRight } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallBannerProps {
  onOpenPhoneStorage?: () => void;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ onOpenPhoneStorage }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [showIOSGuide, setShowIOSGuide] = useState<boolean>(false);

  useEffect(() => {
    // Check if user previously dismissed the prompt in this browser session
    const isDismissed = sessionStorage.getItem('solis_pwa_banner_dismissed') === 'true';

    // Show prompt automatically after 100ms on initial open if not installed and not dismissed
    if (!isInstalled && !isDismissed) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isInstalled]);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('solis_pwa_banner_dismissed', 'true');
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setIsVisible(false);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // Fallback: open phone storage modal with detailed install guidance
      setIsVisible(false);
      if (onOpenPhoneStorage) onOpenPhoneStorage();
    }
  };

  if (isInstalled || !isVisible) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-lg animate-in slide-in-from-top duration-300">
      <div className="bg-gradient-to-r from-[#0d2a1b] via-[#091f13] to-[#07160e] border border-amber-500/50 rounded-2xl p-4 shadow-2xl backdrop-blur-md relative overflow-hidden flex flex-col gap-3">
        {/* Glow decoration */}
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />

        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0 shadow-inner text-xl">
              📱
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/30 text-[10px] font-black uppercase text-amber-300 tracking-wider">
                  Instant App Access
                </span>
                <span className="text-[11px] text-emerald-300 font-semibold">Phone Storage Ready</span>
              </div>
              <h3 className="font-display text-sm font-extrabold text-white mt-0.5">
                Install Solis & Hazari Club on Phone
              </h3>
              <p className="text-[11px] text-emerald-200/80 leading-snug mt-0.5">
                Add to your phone home screen for full-screen offline gameplay without opening a browser!
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg bg-black/40 hover:bg-black/70 text-slate-400 hover:text-white transition-colors shrink-0"
            title="Dismiss for now"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 relative z-10 pt-1">
          {isInstallable ? (
            <button
              onClick={handleInstallClick}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-transform"
            >
              <Download className="w-4 h-4" />
              <span>Install App Now</span>
            </button>
          ) : isIOS ? (
            <button
              onClick={() => setShowIOSGuide(true)}
              className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-transform"
            >
              <Share2 className="w-4 h-4" />
              <span>Install on iPhone (Safari)</span>
            </button>
          ) : (
            <button
              onClick={() => {
                if (onOpenPhoneStorage) onOpenPhoneStorage();
                setIsVisible(false);
              }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-transform"
            >
              <Smartphone className="w-4 h-4" />
              <span>Install to Phone Storage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={handleDismiss}
            className="px-3 py-2.5 rounded-xl bg-black/50 hover:bg-black/70 text-slate-300 text-xs font-semibold transition-colors"
          >
            Later
          </button>
        </div>

        {/* iOS Step Guide Popup */}
        {showIOSGuide && (
          <div className="p-3 rounded-xl bg-black/80 border border-amber-500/40 text-xs text-emerald-100 flex flex-col gap-1.5 animate-in fade-in">
            <div className="font-bold text-amber-300">How to install on iPhone / iPad:</div>
            <ol className="list-decimal pl-4 space-y-1 text-[11px] text-emerald-200/90">
              <li>Tap the <strong>Share</strong> button (📤) in Safari toolbar.</li>
              <li>Scroll down and select <strong>Add to Home Screen</strong>.</li>
              <li>Launch directly from your home screen icon anytime!</li>
            </ol>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-1 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-[11px] font-bold"
            >
              Close Guide
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
