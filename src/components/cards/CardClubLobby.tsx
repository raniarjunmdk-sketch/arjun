/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  Sparkles,
  Play,
  Share2,
  Copy,
  Check,
  ChevronLeft,
  Crown,
  Layers,
  Flame,
  Shield,
  Smartphone,
  Coins,
  Gift,
  ArrowRight,
} from 'lucide-react';
import { CardGameType, TablePreviewInfo } from '../../types/cards';
import { CreateTableModal } from './CreateTableModal';
import { TableJoinModal } from './TableJoinModal';
import { getWalletBalance, claimFreeRefill, getPlayerLevelData, PlayerLevelData } from '../../utils/walletStorage';
import { Star, Zap } from 'lucide-react';

interface CardClubLobbyProps {
  playerName: string;
  onSetPlayerName: (name: string) => void;
  onStartSoloHazari: () => void;
  onStartCallBreak?: () => void;
  onCreateMultiplayerRoom: (gameType: CardGameType, bootAmount: number, isFriendOnly: boolean) => void;
  onJoinMultiplayerRoom: (roomCode: string) => void;
  onBackToZen: () => void;
  onOpenFriends?: () => void;
  onOpenSettings?: () => void;
  onOpenPhoneStorage?: () => void;
}

export const CardClubLobby: React.FC<CardClubLobbyProps> = ({
  playerName,
  onSetPlayerName,
  onStartSoloHazari,
  onStartCallBreak,
  onCreateMultiplayerRoom,
  onJoinMultiplayerRoom,
  onBackToZen,
  onOpenFriends,
  onOpenSettings,
  onOpenPhoneStorage,
}) => {
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showJoinModal, setShowJoinModal] = useState<boolean>(false);
  const [selectedTableCode, setSelectedTableCode] = useState<string>('');
  const [tablePreview, setTablePreview] = useState<TablePreviewInfo | null>(null);
  const [isVerifyingTable, setIsVerifyingTable] = useState<boolean>(false);
  const [tableVerifyError, setTableVerifyError] = useState<string | null>(null);

  const [walletBalance, setWalletBalance] = useState<number>(() => getWalletBalance());
  const [levelData, setLevelData] = useState<PlayerLevelData>(() => getPlayerLevelData());
  const [refillNotice, setRefillNotice] = useState<string | null>(null);

  useEffect(() => {
    const handleWalletUpdate = () => setWalletBalance(getWalletBalance());
    const handleXpUpdate = () => setLevelData(getPlayerLevelData());

    window.addEventListener('solis_wallet_updated', handleWalletUpdate);
    window.addEventListener('solis_xp_updated', handleXpUpdate);

    return () => {
      window.removeEventListener('solis_wallet_updated', handleWalletUpdate);
      window.removeEventListener('solis_xp_updated', handleXpUpdate);
    };
  }, []);

  const handleRefill = () => {
    const res = claimFreeRefill();
    setRefillNotice(res.message);
    setWalletBalance(res.newBalance);
    setTimeout(() => setRefillNotice(null), 3000);
  };

  // Inspect and open Table Join Pop-up
  const handleInspectTable = async (code: string) => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setSelectedTableCode(trimmed);
    setShowJoinModal(true);
    setIsVerifyingTable(true);
    setTableVerifyError(null);

    try {
      const res = await fetch(`/api/rooms/${trimmed}`);
      if (!res.ok) {
        setTableVerifyError(`Table #${trimmed} not found. Please check the Table ID again.`);
        setTablePreview(null);
      } else {
        const data = await res.json();
        setTablePreview(data);
      }
    } catch {
      // Offline / dev fallback: allow joining directly
      setTablePreview({
        code: trimmed,
        gameType: 'hazari',
        bootAmount: 500,
        totalPot: 1000,
        hostName: 'Friend (Host)',
        playersCount: 1,
        players: [{ id: 'host', name: 'Friend', isHost: true }],
        isFriendOnly: true,
        status: 'LOBBY',
      });
    } finally {
      setIsVerifyingTable(false);
    }
  };

  const handleConfirmDirectJoin = (code: string) => {
    setShowJoinModal(false);
    onJoinMultiplayerRoom(code);
  };

  const cardGames = [
    {
      id: 'hazari' as CardGameType,
      title: 'Hazari (1000 Points)',
      tagline: 'Featured Traditional 4-Player Tas Patti',
      description: 'Arrange 13 cards into 4 sets (3+3+3+4). Win tricks with Troys, Runs, and Flushes. 1000 points winner takes the entire Coin Pot!',
      badge: 'Most Popular',
      players: '2-4 Players',
      icon: '👑',
      accentColor: 'from-amber-500 to-amber-700',
    },
    {
      id: 'rummy' as CardGameType,
      title: 'Indian Rummy',
      tagline: '13-Card Sequence & Sets',
      description: 'Form Pure Sequences, Sets, and Impure Sequences. Draw from open/closed deck and declare a valid show.',
      badge: 'Classic',
      players: '2-6 Players',
      icon: '🎴',
      accentColor: 'from-emerald-500 to-emerald-700',
    },
    {
      id: 'teenpatti' as CardGameType,
      title: 'Teen Patti (Flash)',
      tagline: '3-Card Royal Indian Poker',
      description: 'Trail (Trio), Pure Sequence, Color, and High Card. Play Blind or Chaal with stakes!',
      badge: 'Fast Action',
      players: '3-6 Players',
      icon: '✨',
      accentColor: 'from-rose-500 to-rose-700',
    },
    {
      id: 'callbreak' as CardGameType,
      title: 'Call Break (Lakdi)',
      tagline: 'Strategic Trick-Taking Game',
      description: 'Spades are permanent trumps. Bid your hand, follow suits, and fulfill your call contracts.',
      badge: 'Strategy',
      players: '4 Players',
      icon: '♠',
      accentColor: 'from-sky-500 to-sky-700',
    },
    {
      id: 'andarbahar' as CardGameType,
      title: 'Andar Bahar (Katti)',
      tagline: 'Pure Instinct Card Game',
      description: 'The dealer opens the trump card. Guess whether matching rank lands inside (Andar) or outside (Bahar).',
      badge: 'Casino Fun',
      players: 'Solo / Table',
      icon: '⚖',
      accentColor: 'from-purple-500 to-purple-700',
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#08170f] text-slate-100 flex flex-col justify-between relative overflow-x-hidden select-none font-sans">
      {/* Top Bar */}
      <header className="w-full max-w-4xl mx-auto px-4 py-3 flex items-center justify-between border-b border-emerald-900/40 bg-[#0d261a]/90 backdrop-blur-md z-30">
        <div className="flex items-center gap-2">
          <button
            onClick={onBackToZen}
            className="px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-700/40 text-xs font-semibold text-emerald-200 transition-colors"
          >
            ← Solis Zen Puzzles
          </button>
          <div className="flex items-center gap-1.5 text-xs text-emerald-300">
            <span className="font-bold text-amber-400 font-display text-sm tracking-wide">TAS PATTI CLUB</span>
            <span aria-hidden="true">·</span>
            <span>Hazari & Friends</span>
          </div>
        </div>

        {/* User Profile, Level & Wallet */}
        <div className="flex items-center gap-2">
          {/* Player Level Badge */}
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold" title={`Level ${levelData.level}: ${levelData.title} (${levelData.progressPercent}% XP)`}>
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Lv {levelData.level}</span>
          </div>

          {/* Wallet Balance Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 border border-amber-500/40 shadow-inner">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-black text-amber-300">
              🪙 {walletBalance.toLocaleString()}
            </span>
            <button
              onClick={handleRefill}
              className="ml-1 px-1.5 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold"
              title="Free Daily Coins Refill"
            >
              +Free
            </button>
          </div>

          {/* Friends Button */}
          {onOpenFriends && (
            <button
              onClick={onOpenFriends}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 text-xs font-bold flex items-center gap-1 transition-transform active:scale-95"
              title="Friends List & Invites"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Friends</span>
            </button>
          )}

          {/* Settings Button */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-xl bg-black/40 hover:bg-black/60 border border-emerald-800/40 text-slate-200 text-xs font-bold transition-transform active:scale-95"
              title="Settings & Profile"
            >
              ⚙️
            </button>
          )}

          {/* Phone Install Button */}
          {onOpenPhoneStorage && (
            <button
              onClick={onOpenPhoneStorage}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 text-xs font-bold flex items-center gap-1 transition-transform active:scale-95"
              title="Install App to Phone Home Screen"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Install App</span>
            </button>
          )}

          {/* Player Name */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 border border-emerald-800/40">
            <span className="text-amber-400 text-xs">👤</span>
            <input
              type="text"
              value={playerName}
              onChange={e => onSetPlayerName(e.target.value)}
              className="bg-transparent text-xs font-bold text-white max-w-[85px] outline-none"
              placeholder="Your Name"
            />
          </div>
        </div>
      </header>

      {refillNotice && (
        <div className="w-full max-w-md mx-auto px-4 py-1.5 mt-2 z-40">
          <div className="p-2.5 rounded-xl bg-emerald-900/90 border border-emerald-500 text-emerald-200 text-xs font-bold text-center">
            {refillNotice}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="w-full max-w-4xl mx-auto px-4 py-5 flex-1 flex flex-col gap-6 z-10">
        {/* Hero Banner: Hazari, Boot Stakes & Friend Table */}
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#0d2d1e] via-[#123826] to-[#0a2015] border border-emerald-600/30 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-5 relative overflow-hidden">
          <div className="relative z-10 flex flex-col gap-1.5 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[11px] font-bold uppercase tracking-wider">
                Coin Bets & Real Friends
              </span>
              <span className="text-xs text-emerald-300">Winner Takes All Coins!</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
              Hazari (1000 Points) Tas Patti
            </h1>
            <p className="text-xs sm:text-sm text-emerald-200/80 max-w-md leading-relaxed">
              Set your stake price to create a table, share the Table ID with friends, and play live with real players. The winner claims all pot coins in their wallet!
            </p>
          </div>

          {/* Quick CTA Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto shrink-0 relative z-10">
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50 active:scale-95 transition-transform"
            >
              <Crown className="w-4 h-4 fill-current" />
              <span>Create Table & Set Price</span>
            </button>
          </div>
        </div>

        {/* BANKRUPT / OUT OF COINS STRICT ALERT BANNER */}
        {walletBalance < 100 && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950 via-rose-900 to-[#1d0a0f] border-2 border-rose-500 text-rose-100 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/25 border-2 border-rose-400 flex items-center justify-center text-2xl shrink-0 shadow-lg">
                🚫
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-black text-base text-white">BANKRUPT! OUT OF COINS</span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-200 border border-rose-400/50 text-[10px] font-bold">
                    🪙 {walletBalance} Coins Remaining
                  </span>
                </div>
                <p className="text-xs text-rose-200/90 mt-1 leading-relaxed">
                  Aapke paas coins khatam ho gaye hain! Entry fee ke bina aap kisi ke saath bhi Tas Patti nahi khel sakte. Play karne ke liye Daily Bonus claim karein ya Zen Puzzles complete karein.
                </p>
              </div>
            </div>

            <button
              onClick={handleRefill}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black shrink-0 shadow-xl transition-transform active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Gift className="w-4 h-4" />
              <span>+1,000 Bonus Coins</span>
            </button>
          </div>
        )}

        {/* PLAYER LEVEL & XP PROGRESS CARD */}
        <div className="p-4 rounded-2xl bg-[#092216] border border-amber-500/30 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 w-full sm:w-auto">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-300 font-black text-lg shrink-0 shadow-md">
              ⭐ {levelData.level}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-sm text-white">
                  {levelData.title}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/80 text-emerald-300 border border-emerald-700/50 font-bold">
                  Level {levelData.level}
                </span>
              </div>
              <p className="text-xs text-emerald-300/80 mt-0.5">
                Play matches, win tricks, and earn XP to level up! ({levelData.totalXp.toLocaleString()} Total XP)
              </p>
            </div>
          </div>

          <div className="w-full sm:w-56 flex flex-col gap-1.5 shrink-0">
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
              <span>Level {levelData.level} XP Progress</span>
              <span>{levelData.progressPercent}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-black/60 border border-emerald-800/60 p-0.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500"
                style={{ width: `${levelData.progressPercent}%` }}
              />
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0a2216] border border-amber-500/30 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-xl shrink-0">
              🏷️
            </div>
            <div>
              <h3 className="font-display text-sm font-bold text-white">
                Enter Friend's Table ID
              </h3>
              <p className="text-xs text-emerald-300/80">
                Enter table code to view details and join instantly!
              </p>
            </div>
          </div>

          <form
            onSubmit={e => {
              e.preventDefault();
              handleInspectTable(joinCodeInput);
            }}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <input
              type="text"
              value={joinCodeInput}
              onChange={e => setJoinCodeInput(e.target.value.toUpperCase())}
              placeholder="e.g. HAZ88"
              maxLength={7}
              className="w-full sm:w-36 px-3.5 py-2.5 rounded-xl bg-black/60 border border-emerald-700/60 font-mono text-center font-black tracking-widest text-amber-300 placeholder:text-slate-500 text-sm outline-none focus:border-amber-400 transition-colors"
            />
            <button
              type="submit"
              disabled={!joinCodeInput.trim() || walletBalance < 100}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center gap-1.5 shrink-0 transition-transform active:scale-95 shadow-md"
            >
              <span>Join Table</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Card Games Grid */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <span>Tas Patti Game Collection</span>
              <span className="text-xs text-amber-400 font-normal">({cardGames.length} Traditional Games)</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {cardGames.map(game => {
              const isHazari = game.id === 'hazari';

              return (
                <div
                  key={game.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    isHazari
                      ? 'bg-[#0f2c1f] border-emerald-500/60 shadow-lg ring-1 ring-emerald-500/20'
                      : 'bg-[#0c2217] border-emerald-900/40 opacity-90 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-black/40 border border-emerald-700/40 flex items-center justify-center text-2xl shrink-0 shadow-sm">
                        {game.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-bold text-base text-white">{game.title}</h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-300 border border-emerald-700/40">
                            {game.badge}
                          </span>
                        </div>
                        <div className="text-[11px] font-medium text-amber-400/90 mt-0.5">{game.tagline}</div>
                        <p className="text-xs text-emerald-200/70 mt-1 leading-relaxed">{game.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions for this game */}
                  <div className="flex items-center justify-between border-t border-emerald-900/40 pt-3 mt-1">
                    <span className="text-xs text-emerald-400/80 font-medium">
                      {game.players}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (game.id === 'callbreak' && onStartCallBreak) {
                            onStartCallBreak();
                          } else {
                            onStartSoloHazari();
                          }
                        }}
                        disabled={walletBalance < 100}
                        className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold active:scale-95 transition-transform ${
                          walletBalance < 100
                            ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                            : 'bg-emerald-950/80 hover:bg-emerald-900 border-emerald-700/50 text-emerald-200'
                        }`}
                      >
                        {walletBalance < 100 ? '🪙 Needs 100 Coins' : 'Play Solo (AI)'}
                      </button>

                      <button
                        onClick={() => setShowCreateModal(true)}
                        disabled={walletBalance < 100}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-transform ${
                          walletBalance < 100
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>{walletBalance < 100 ? 'Needs Coins' : 'With Friends'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* CREATE TABLE MODAL */}
      {showCreateModal && (
        <CreateTableModal
          gameType="hazari"
          playerName={playerName}
          onConfirmCreate={(gameType, bootAmount, isFriendOnly) => {
            setShowCreateModal(false);
            onCreateMultiplayerRoom(gameType, bootAmount, isFriendOnly);
          }}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* DIRECT TABLE JOIN POP-UP MODAL */}
      {showJoinModal && (
        <TableJoinModal
          tableCode={selectedTableCode}
          tableInfo={tablePreview}
          isLoading={isVerifyingTable}
          errorMessage={tableVerifyError}
          playerName={playerName}
          onConfirmJoin={handleConfirmDirectJoin}
          onClose={() => setShowJoinModal(false)}
        />
      )}
    </div>
  );
};
