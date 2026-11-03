/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Card,
  Player,
  HazariTrickResult,
  HazariRoundSummary,
} from '../../types/cards';
import {
  dealHazariHands,
  dealHandsForPlayers,
  autoArrangeHazariHand,
  evaluateHazariSet,
  compareHazariSets,
} from '../../utils/cardDeck';
import { PlayingCard } from './PlayingCard';
import { zenAudio } from '../../audio/soundEngine';
import {
  addCoins,
  getWalletBalance,
  addPlayerXP,
  getPlayerLevelData,
  PlayerLevelData,
} from '../../utils/walletStorage';
import {
  Share2,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Trophy,
  ArrowRight,
  Users,
  Coins,
  Crown,
  Volume2,
  VolumeX,
  Play,
  Clock,
  Shield,
  Star,
  Zap,
} from 'lucide-react';

interface HazariBoardProps {
  isMultiplayer: boolean;
  roomCode?: string;
  ws?: WebSocket | null;
  humanPlayerName: string;
  bootAmount?: number;
  totalPot?: number;
  isHost?: boolean;
  isFriendOnly?: boolean;
  onExit: () => void;
}

export const HazariBoard: React.FC<HazariBoardProps> = ({
  isMultiplayer,
  roomCode,
  ws,
  humanPlayerName,
  bootAmount = 500,
  totalPot = 500,
  isHost: initialIsHost = true,
  isFriendOnly = true,
  onExit,
}) => {
  // Game & Table state
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [phase, setPhase] = useState<'LOBBY' | 'ARRANGING' | 'REVEALING_TRICKS' | 'ROUND_SUMMARY' | 'MATCH_OVER'>(
    isMultiplayer ? 'LOBBY' : 'ARRANGING'
  );
  const [potCoins, setPotCoins] = useState<number>(totalPot);
  const [tableBoot, setTableBoot] = useState<number>(bootAmount);
  const [isHostUser, setIsHostUser] = useState<boolean>(initialIsHost);
  const [hostPlayerName, setHostPlayerName] = useState<string>(humanPlayerName);
  const [walletBalance, setWalletBalance] = useState<number>(() => getWalletBalance());
  const [levelData, setLevelData] = useState<PlayerLevelData>(() => getPlayerLevelData());
  const [lastXpAward, setLastXpAward] = useState<{ xpGained: number; didLevelUp: boolean } | null>(null);
  const [potAwarded, setPotAwarded] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // 2 MINUTES Arrangement Timer (120 seconds simultaneous)
  const [timerSeconds, setTimerSeconds] = useState<number>(120);

  const [players, setPlayers] = useState<Player[]>([
    { id: 'p1', name: humanPlayerName || 'You', isHost: initialIsHost, isBot: false, avatarSeed: 'you', cardsCount: 13, score: 0 },
    { id: 'p2', name: 'Vikram', isHost: false, isBot: !isMultiplayer, avatarSeed: 'vikram', cardsCount: 13, score: 0 },
    { id: 'p3', name: 'Priya', isHost: false, isBot: !isMultiplayer, avatarSeed: 'priya', cardsCount: 13, score: 0 },
    { id: 'p4', name: 'Kabir', isHost: false, isBot: !isMultiplayer, avatarSeed: 'kabir', cardsCount: 13, score: 0 },
  ]);

  // Current human player's hand and arranged sets
  const [rawHand, setRawHand] = useState<Card[]>([]);
  const [unassignedCards, setUnassignedCards] = useState<Card[]>([]);
  const [sets, setSets] = useState<[Card[], Card[], Card[], Card[]]>([[], [], [], []]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);

  // Trick resolution
  const [activeTrickIndex, setActiveTrickIndex] = useState<number>(0);
  const [currentRoundTricks, setCurrentRoundTricks] = useState<HazariTrickResult[]>([]);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [matchWinner, setMatchWinner] = useState<{ id: string; name: string; isMe: boolean } | null>(null);

  // Bot submitted sets in offline mode
  const botSetsRef = React.useRef<Record<string, [Card[], Card[], Card[], Card[]]>>({});

  // Format MM:SS for 2-minute timer
  const formatTimerMinSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Initialize a fresh deal (used for offline mode)
  const startFreshDeal = useCallback(() => {
    zenAudio.playCardDeal();
    const hands = dealHazariHands();

    setRawHand(hands.p1);
    // Start with all 13 cards in Unassigned Hand Tray for 100% manual placement
    setUnassignedCards(hands.p1);
    setSets([[], [], [], []]);
    setHasSubmitted(false);
    setSelectedCardId(null);
    setActiveTrickIndex(0);
    setCurrentRoundTricks([]);
    setPhase('ARRANGING');
    setPotAwarded(false);
    setMatchWinner(null);
    setTimerSeconds(120); // Reset 2 Minutes (120s) timer

    if (!isMultiplayer) {
      botSetsRef.current = {
        p2: autoArrangeHazariHand(hands.p2),
        p3: autoArrangeHazariHand(hands.p3),
        p4: autoArrangeHazariHand(hands.p4),
      };
    }
  }, [isMultiplayer]);

  useEffect(() => {
    if (!isMultiplayer) {
      startFreshDeal();
    }
  }, [isMultiplayer, startFreshDeal]);

  // 120-Second (2 Minutes) arrangement countdown timer
  useEffect(() => {
    if (phase !== 'ARRANGING' || hasSubmitted) return;

    const interval = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          // Time expired! Fill any remaining empty slots sequentially without AI optimization
          const currentSets: [Card[], Card[], Card[], Card[]] = [
            [...sets[0]],
            [...sets[1]],
            [...sets[2]],
            [...sets[3]],
          ];
          let remIdx = 0;
          for (let s = 0; s < 4; s++) {
            const maxCap = s === 3 ? 4 : 3;
            while (currentSets[s].length < maxCap && remIdx < unassignedCards.length) {
              currentSets[s].push(unassignedCards[remIdx++]);
            }
          }

          setSets(currentSets);
          setUnassignedCards([]);
          setSelectedCardId(null);
          setHasSubmitted(true);
          setStatusMessage('⏳ 2 Minutes Time Up! Hand locked for this round.');
          setTimeout(() => setStatusMessage(null), 4000);

          if (isMultiplayer && ws && ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: 'SUBMIT_HAZARI_SETS',
                sets: currentSets,
              })
            );
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, hasSubmitted, sets, unassignedCards, isMultiplayer, ws]);

  // WebSocket message listener for multiplayer
  useEffect(() => {
    if (!isMultiplayer || !ws) return;

    const handleMessage = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);

        if (data.type === 'ROOM_UPDATED') {
          if (data.players) setPlayers(data.players);
          if (data.roundNumber) setRoundNumber(data.roundNumber);
          if (data.totalPot) setPotCoins(data.totalPot);
          if (data.bootAmount) setTableBoot(data.bootAmount);
          if (data.hostName) setHostPlayerName(data.hostName);
          if (data.status) {
            if (data.status === 'LOBBY') setPhase('LOBBY');
          }
        } else if (data.type === 'GAME_STARTED' || data.type === 'ROUND_STARTED') {
          if (data.totalPot) setPotCoins(data.totalPot);
          setPhase('ARRANGING');
          setHasSubmitted(false);
          setStatusMessage(null);
        } else if (data.type === 'HAND_DEALT') {
          zenAudio.playCardDeal();
          setRawHand(data.cards);
          // Start with all cards unassigned for manual set assembly
          setUnassignedCards(data.cards);
          setSets([[], [], [], []]);
          setHasSubmitted(false);
          setPhase('ARRANGING');
          if (data.roundNumber) setRoundNumber(data.roundNumber);
          if (data.totalPot) setPotCoins(data.totalPot);
          if (data.bootAmount) setTableBoot(data.bootAmount);
        } else if (data.type === 'ROUND_RESOLVED') {
          const summary: HazariRoundSummary = data.summary;
          setCurrentRoundTricks(summary.tricks);
          setPhase('REVEALING_TRICKS');
          playTrickRevealAnimation(summary, data.potCoinsWon || potCoins);
        } else if (data.type === 'ERROR') {
          setStatusMessage(data.message);
          setTimeout(() => setStatusMessage(null), 4000);
        }
      } catch (err) {
        console.error('WS client error:', err);
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [isMultiplayer, ws, potCoins]);

  // Evaluated hand set metrics
  const evaluatedSets = useMemo(() => {
    return [
      evaluateHazariSet(sets[0]),
      evaluateHazariSet(sets[1]),
      evaluateHazariSet(sets[2]),
      evaluateHazariSet(sets[3]),
    ];
  }, [sets]);

  const totalHandPoints = useMemo(() => {
    return evaluatedSets.reduce((sum, s) => sum + s.totalPoints, 0);
  }, [evaluatedSets]);

  const totalPlacedCount = useMemo(() => {
    return sets[0].length + sets[1].length + sets[2].length + sets[3].length;
  }, [sets]);

  const isSetValidForPlay = useMemo(() => {
    return (
      sets[0].length === 3 &&
      sets[1].length === 3 &&
      sets[2].length === 3 &&
      sets[3].length === 4
    );
  }, [sets]);

  // Handle clicking a card in the unassigned tray
  const handleUnassignedCardClick = (cardId: string) => {
    if (hasSubmitted || phase !== 'ARRANGING') return;
    zenAudio.playCardSelect();

    if (selectedCardId === cardId) {
      setSelectedCardId(null);
    } else {
      setSelectedCardId(cardId);
    }
  };

  // Helper: Move card by ID to target set (works for both tap and drag-and-drop)
  const handleMoveCardToSet = (cardId: string, targetSetIdx: number) => {
    if (hasSubmitted || phase !== 'ARRANGING') return;

    const maxCapacity = targetSetIdx === 3 ? 4 : 3;

    // Check if card is in unassigned
    const unassignedIndex = unassignedCards.findIndex(c => c.id === cardId);
    if (unassignedIndex !== -1) {
      const cardToMove = unassignedCards[unassignedIndex];
      if (sets[targetSetIdx].length < maxCapacity) {
        zenAudio.playCardSelect();
        const nextUnassigned = unassignedCards.filter(c => c.id !== cardId);
        const nextSets: [Card[], Card[], Card[], Card[]] = [
          [...sets[0]],
          [...sets[1]],
          [...sets[2]],
          [...sets[3]],
        ];
        nextSets[targetSetIdx].push(cardToMove);

        setUnassignedCards(nextUnassigned);
        setSets(nextSets);
        setSelectedCardId(null);
      }
      return;
    }

    // Check if card is in another set
    let sourceSetIdx = -1;
    for (let i = 0; i < 4; i++) {
      if (sets[i].some(c => c.id === cardId)) {
        sourceSetIdx = i;
        break;
      }
    }

    if (sourceSetIdx !== -1 && sourceSetIdx !== targetSetIdx) {
      const cardToMove = sets[sourceSetIdx].find(c => c.id === cardId)!;
      if (sets[targetSetIdx].length < maxCapacity) {
        zenAudio.playCardSelect();
        const nextSets: [Card[], Card[], Card[], Card[]] = [
          [...sets[0]],
          [...sets[1]],
          [...sets[2]],
          [...sets[3]],
        ];
        nextSets[sourceSetIdx] = nextSets[sourceSetIdx].filter(c => c.id !== cardId);
        nextSets[targetSetIdx].push(cardToMove);

        setSets(nextSets);
        setSelectedCardId(null);
      }
    }
  };

  // Helper: Move card back to Hand Tray (works for both tap and drag-and-drop)
  const handleDropCardToHand = (cardId: string) => {
    if (hasSubmitted || phase !== 'ARRANGING') return;

    for (let i = 0; i < 4; i++) {
      const found = sets[i].find(c => c.id === cardId);
      if (found) {
        zenAudio.playCardSelect();
        const nextSets: [Card[], Card[], Card[], Card[]] = [
          [...sets[0]],
          [...sets[1]],
          [...sets[2]],
          [...sets[3]],
        ];
        nextSets[i] = nextSets[i].filter(c => c.id !== cardId);
        setSets(nextSets);
        setUnassignedCards(prev => [...prev, found]);
        setSelectedCardId(null);
        break;
      }
    }
  };

  // Handle clicking a target Set box
  const handleSetBoxClick = (targetSetIdx: number) => {
    if (hasSubmitted || phase !== 'ARRANGING') return;

    if (!selectedCardId) {
      setStatusMessage(`💡 Hold & drag card onto Set ${targetSetIdx + 1}, or tap card then tap Set ${targetSetIdx + 1}!`);
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }

    const maxCapacity = targetSetIdx === 3 ? 4 : 3;

    if (sets[targetSetIdx].length >= maxCapacity) {
      if (!sets[targetSetIdx].some(c => c.id === selectedCardId)) {
        setStatusMessage(`⚠️ Set ${targetSetIdx + 1} is full (${maxCapacity}/${maxCapacity})! Tap a card inside Set ${targetSetIdx + 1} to swap or drop on another set.`);
        setTimeout(() => setStatusMessage(null), 3000);
        return;
      }
    }

    handleMoveCardToSet(selectedCardId, targetSetIdx);
  };

  // Handle clicking a card inside a Set box
  const handleSetCardClick = (cardId: string, setIdx: number) => {
    if (hasSubmitted || phase !== 'ARRANGING') return;
    zenAudio.playCardSelect();

    if (!selectedCardId) {
      setSelectedCardId(cardId);
      return;
    }

    if (selectedCardId === cardId) {
      // Unassign card back to hand tray
      const cardToReturn = sets[setIdx].find(c => c.id === cardId);
      if (cardToReturn) {
        const nextSets: [Card[], Card[], Card[], Card[]] = [
          [...sets[0]],
          [...sets[1]],
          [...sets[2]],
          [...sets[3]],
        ];
        nextSets[setIdx] = nextSets[setIdx].filter(c => c.id !== cardId);
        setSets(nextSets);
        setUnassignedCards(prev => [...prev, cardToReturn]);
        setSelectedCardId(null);
      }
      return;
    }

    // Swap selected card with this set card
    let sourceSetIdx = -1;
    let card1: Card | undefined;
    for (let i = 0; i < 4; i++) {
      const found = sets[i].find(c => c.id === selectedCardId);
      if (found) {
        sourceSetIdx = i;
        card1 = found;
        break;
      }
    }

    // If card1 was in unassigned tray
    if (!card1) {
      const unassignedCard = unassignedCards.find(c => c.id === selectedCardId);
      const targetCard = sets[setIdx].find(c => c.id === cardId);

      if (unassignedCard && targetCard) {
        const nextSets: [Card[], Card[], Card[], Card[]] = [
          [...sets[0]],
          [...sets[1]],
          [...sets[2]],
          [...sets[3]],
        ];
        nextSets[setIdx] = nextSets[setIdx].map(c => (c.id === targetCard.id ? unassignedCard : c));
        setSets(nextSets);
        setUnassignedCards(prev => [...prev.filter(c => c.id !== unassignedCard.id), targetCard]);
        setSelectedCardId(null);
      }
      return;
    }

    // If swapping between sets
    const card2 = sets[setIdx].find(c => c.id === cardId);
    if (card1 && card2 && sourceSetIdx !== -1) {
      const nextSets: [Card[], Card[], Card[], Card[]] = [
        [...sets[0]],
        [...sets[1]],
        [...sets[2]],
        [...sets[3]],
      ];

      nextSets[sourceSetIdx] = nextSets[sourceSetIdx].map(c => (c.id === card1!.id ? card2 : c));
      nextSets[setIdx] = nextSets[setIdx].map(c => (c.id === card2.id ? card1! : c));

      setSets(nextSets);
      setSelectedCardId(null);
    }
  };

  const handleClearAllSets = () => {
    zenAudio.playCardDeal();
    setUnassignedCards([...rawHand]);
    setSets([[], [], [], []]);
    setSelectedCardId(null);
  };

  const handleSubmitSets = () => {
    if (!isSetValidForPlay) return;
    zenAudio.playTrickWin();
    setHasSubmitted(true);

    if (isMultiplayer && ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'SUBMIT_HAZARI_SETS',
          sets,
        })
      );
    } else {
      resolveOfflineTricks();
    }
  };

  // Host starts the match
  const handleHostStartGame = () => {
    if (!isHostUser) return;
    if (isMultiplayer && ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'START_GAME' }));
    } else {
      startFreshDeal();
    }
  };

  // Offline Trick Resolution
  const resolveOfflineTricks = () => {
    setPhase('REVEALING_TRICKS');

    const allParticipantSets: Record<string, [Card[], Card[], Card[], Card[]]> = {
      p1: sets,
      p2: botSetsRef.current.p2,
      p3: botSetsRef.current.p3,
      p4: botSetsRef.current.p4,
    };

    const tricks: HazariTrickResult[] = [];
    const addedScores: Record<string, number> = { p1: 0, p2: 0, p3: 0, p4: 0 };
    const updatedPlayers = [...players];

    for (let tIdx = 0; tIdx < 4; tIdx++) {
      let winningPlayerId = 'p1';
      let winningPlayerName = players[0].name;
      let winningSet = evaluateHazariSet(allParticipantSets.p1[tIdx]);
      let pointsWon = winningSet.totalPoints;

      const trickAllSets = [
        { playerId: 'p1', playerName: players[0].name, set: winningSet },
      ];

      ['p2', 'p3', 'p4'].forEach(botId => {
        const botObj = updatedPlayers.find(p => p.id === botId)!;
        const evalSet = evaluateHazariSet(allParticipantSets[botId][tIdx]);
        pointsWon += evalSet.totalPoints;

        trickAllSets.push({
          playerId: botId,
          playerName: botObj.name,
          set: evalSet,
        });

        if (compareHazariSets(evalSet, winningSet) > 0) {
          winningSet = evalSet;
          winningPlayerId = botId;
          winningPlayerName = botObj.name;
        }
      });

      const winnerObj = updatedPlayers.find(p => p.id === winningPlayerId)!;
      winnerObj.score += pointsWon;
      addedScores[winningPlayerId] += pointsWon;

      tricks.push({
        trickIndex: tIdx,
        winnerPlayerId: winningPlayerId,
        winnerPlayerName: winningPlayerName,
        winningSet,
        allSets: trickAllSets,
        pointsWon,
      });
    }

    const isMatchOver = updatedPlayers.some(p => p.score >= 1000);
    const topScorer = [...updatedPlayers].sort((a, b) => b.score - a.score)[0];

    const summary: HazariRoundSummary = {
      roundNumber,
      tricks,
      scoresAdded: addedScores,
      totalScores: updatedPlayers.reduce((acc, p) => ({ ...acc, [p.id]: p.score }), {}),
      isMatchOver,
      matchWinnerId: isMatchOver ? topScorer.id : undefined,
      potCoinsWon: isMatchOver ? potCoins : undefined,
    };

    setPlayers(updatedPlayers);
    setCurrentRoundTricks(tricks);
    playTrickRevealAnimation(summary, potCoins);
  };

  // Trick reveal animation
  const playTrickRevealAnimation = (summary: HazariRoundSummary, totalPotWon: number) => {
    setActiveTrickIndex(0);

    const stepInterval = setInterval(() => {
      setActiveTrickIndex(curr => {
        zenAudio.playTrickWin();
        if (curr < 3) {
          return curr + 1;
        } else {
          clearInterval(stepInterval);
          setTimeout(() => {
            if (summary.isMatchOver) {
              zenAudio.playHazari1000Fanfare();
              setPhase('MATCH_OVER');

              // Determine Winner and award Pot Coins into wallet
              const topWinner = players.find(p => p.id === summary.matchWinnerId) || players[0];
              const isMe = topWinner.id === 'p1' || topWinner.name === humanPlayerName;
              setMatchWinner({ id: topWinner.id, name: topWinner.name, isMe });

              // Calculate XP and award level progression
              const tricksWonByMe = summary.tricks.filter(t => t.winnerPlayerId === 'p1' || t.winnerPlayerName === humanPlayerName).length;
              const xpGained = 50 + (tricksWonByMe * 25) + (isMe ? 250 : 0);
              const xpRes = addPlayerXP(xpGained);
              setLevelData(xpRes.newLevelData);
              setLastXpAward({ xpGained, didLevelUp: xpRes.didLevelUp });

              if (isMe && !potAwarded) {
                setPotAwarded(true);
                const updatedBal = addCoins(totalPotWon);
                setWalletBalance(updatedBal);
              }
            } else {
              setPhase('ROUND_SUMMARY');
            }
          }, 1500);
          return curr;
        }
      });
    }, 2000);
  };

  // Next round
  const handleNextRound = () => {
    setRoundNumber(r => r + 1);
    setPotAwarded(false);
    setMatchWinner(null);
    if (isMultiplayer && ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'NEXT_ROUND' }));
    } else {
      startFreshDeal();
    }
  };

  // Copy friend invite link & Table ID
  const handleCopyInviteLink = () => {
    const tableId = roomCode || 'HAZ88';
    const url = `${window.location.origin}?table=${tableId}`;
    const shareText = `🃏 Aao Hazari Tas Patti khele! Table ID: ${tableId}. Entry: ${tableBoot} Coins. Total Pot: ${potCoins} Coins. Link pe click karke direct join karo: ${url}`;

    navigator.clipboard.writeText(shareText).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const handleWhatsAppShare = () => {
    const tableId = roomCode || 'HAZ88';
    const url = `${window.location.origin}?table=${tableId}`;
    const msg = encodeURIComponent(
      `🃏 Aao Hazari Tas Patti khele mere sath! \n🏷️ Table ID: ${tableId} \n🪙 Boot: ${tableBoot} Coins \n💰 Winner Pot: ${potCoins} Coins! \n\nDirect join karne ke liye click karein: ${url}`
    );
    window.location.href = `https://api.whatsapp.com/send?text=${msg}`;
  };

  const formatComboLabel = (type: string) => {
    switch (type) {
      case 'troy': return '👑 Troy (3 of Kind)';
      case 'color_run': return '✨ Color Run (Pure Sequence)';
      case 'run': return '⚡ Normal Run (Sequence)';
      case 'color': return '🎨 Color (Flush)';
      case 'pair': return '👥 Pair';
      default: return '🃏 High Card (Indi)';
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#07170f] text-slate-100 flex flex-col justify-between relative overflow-x-hidden select-none font-sans">
      {/* Top Bar */}
      <header className="w-full max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between border-b border-emerald-900/40 bg-[#0d261a]/90 backdrop-blur-md z-30">
        <div className="flex items-center gap-2">
          <button
            onClick={onExit}
            className="px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/40 text-xs font-semibold text-emerald-200 transition-colors"
          >
            ← Leave Table
          </button>
          <div className="flex items-center gap-1.5 text-xs text-emerald-300">
            <span className="font-black text-amber-400 font-display text-sm tracking-wide">HAZARI</span>
            <span aria-hidden="true">·</span>
            <span className="text-white font-medium">Round {roundNumber}</span>
            <span aria-hidden="true">·</span>
            <span className="text-amber-300 font-bold">1000 Pts Goal</span>
          </div>
        </div>

        {/* Live Pot, Timer, Level & Wallet Status */}
        <div className="flex items-center gap-2">
          {/* 2 Minutes Timer Badge */}
          {phase === 'ARRANGING' && (
            <div
              className={`px-2.5 py-1 rounded-xl border flex items-center gap-1.5 text-xs font-mono font-bold transition-colors ${
                timerSeconds <= 20
                  ? 'bg-rose-950/90 border-rose-500 text-rose-300 animate-pulse shadow-md shadow-rose-950/50'
                  : 'bg-black/60 border-amber-400/60 text-amber-300'
              }`}
              title="2 Minutes Simultaneous Arrangement Timer"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{formatTimerMinSec(timerSeconds)}</span>
            </div>
          )}

          {/* Player Level Badge */}
          <div className="px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center gap-1 text-xs font-bold" title={`Title: ${levelData.title}`}>
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Lv {levelData.level}</span>
          </div>

          {/* Table Pot Badge */}
          <div className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 border border-amber-300 text-slate-950 flex items-center gap-1.5 text-xs font-black shadow-md shadow-amber-950/40">
            <Coins className="w-3.5 h-3.5 text-slate-950" />
            <span>Pot: {potCoins.toLocaleString()}</span>
          </div>

          {/* User Wallet Badge */}
          <div className="px-2.5 py-1 rounded-xl bg-black/50 border border-emerald-700/50 flex items-center gap-1 text-xs text-amber-300 font-bold">
            <span className="text-[10px] text-emerald-400 uppercase">Wallet</span>
            <span>🪙 {walletBalance.toLocaleString()}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              const next = !isMuted;
              setIsMuted(next);
              zenAudio.setMuted(next);
            }}
            className="p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 hover:text-white"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 opacity-50" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* Status Warning Toast */}
      {statusMessage && (
        <div className="w-full max-w-md mx-auto px-4 py-2 mt-2 z-40">
          <div className="p-3 rounded-2xl bg-amber-950/90 border border-amber-500/60 text-amber-200 text-xs font-bold text-center shadow-lg">
            {statusMessage}
          </div>
        </div>
      )}

      {/* PHASE 0: TABLE LOBBY / WAITING ROOM */}
      {phase === 'LOBBY' && (
        <main className="w-full max-w-xl mx-auto flex-1 flex flex-col items-center justify-center p-4 gap-5 z-20">
          <div className="w-full rounded-3xl bg-gradient-to-b from-[#0f2c1f] to-[#07160e] border border-emerald-600/40 p-6 shadow-2xl flex flex-col gap-5 text-center relative overflow-hidden">
            {/* Table ID Hero */}
            <div className="flex flex-col items-center gap-1">
              <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold uppercase tracking-widest">
                Friend Table Room
              </span>
              <p className="text-xs text-emerald-300 mt-1">Share Table ID with Friends</p>
              <div className="flex items-center gap-3 my-2">
                <div className="px-5 py-2.5 rounded-2xl bg-black/60 border-2 border-amber-400 text-2xl font-black font-mono text-amber-300 tracking-widest shadow-inner">
                  #{roomCode || 'HAZ88'}
                </div>
                <button
                  onClick={handleCopyInviteLink}
                  className="p-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-1.5 text-xs"
                  title="Copy Table ID & Link"
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Copied!' : 'Copy ID'}</span>
                </button>
                <button
                  onClick={handleWhatsAppShare}
                  className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-1.5 text-xs"
                  title="Share on WhatsApp"
                >
                  <Share2 className="w-4 h-4" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Table Stake & Pot Card */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-black/40 border border-emerald-800/40 flex flex-col items-center">
                <span className="text-[11px] text-emerald-300">Table Entry Fee (Boot)</span>
                <span className="font-display text-lg font-black text-amber-300">
                  🪙 {tableBoot.toLocaleString()} Coins
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-600/40 flex flex-col items-center">
                <span className="text-[11px] text-amber-200">Current Winner Pot</span>
                <span className="font-display text-lg font-black text-amber-400">
                  🪙 {potCoins.toLocaleString()} Coins
                </span>
              </div>
            </div>

            {/* Joined Players List */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-emerald-300 px-1">
                <span className="font-bold flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Table Players ({players.length}/4)</span>
                </span>
                <span className="text-[11px] text-amber-300">
                  Host: {hostPlayerName}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {players.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-700/40 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                      <div className="text-left truncate">
                        <p className="text-xs font-bold text-white truncate">{p.name}</p>
                        <p className="text-[10px] text-emerald-400/80">
                          {p.isHost ? '👑 Host' : 'Ready'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-400 shrink-0">
                      🪙 {tableBoot}
                    </span>
                  </div>
                ))}

                {/* Empty seat slots waiting for friends */}
                {Array.from({ length: Math.max(0, 4 - players.length) }).map((_, i) => (
                  <div
                    key={`empty_${i}`}
                    className="p-3 rounded-2xl bg-black/20 border border-dashed border-emerald-800/40 flex items-center justify-center gap-2 text-xs text-emerald-400/60"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Waiting for friend...</span>
                  </div>
                ))}
              </div>
            </div>

            {/* START MATCH ACTION - HOST ONLY */}
            <div className="pt-2 flex flex-col gap-2">
              {isHostUser ? (
                <>
                  <button
                    onClick={handleHostStartGame}
                    disabled={isFriendOnly ? players.length < 4 : players.length < 2}
                    className={`w-full py-4 rounded-2xl font-display font-black text-sm flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all ${
                      (isFriendOnly ? players.length === 4 : players.length >= 2)
                        ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 shadow-amber-950/60'
                        : 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                    }`}
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>
                      {(isFriendOnly ? players.length === 4 : players.length >= 2)
                        ? `START MATCH — Pot: ${potCoins} Coins`
                        : `Mandatory 4 Real Human Players Needed (${players.length}/4 Joined)`}
                    </span>
                  </button>
                  {(isFriendOnly ? players.length < 4 : players.length < 2) && (
                    <p className="text-xs text-amber-300/80">
                      Share Table ID <strong>#{roomCode}</strong> with friends. Exactly 4 real human players are mandatory to play (No AI bots in friend mode).
                    </p>
                  )}
                </>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-700/40 flex items-center justify-center gap-3 text-xs text-emerald-200">
                  <div className="w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                  <span>
                    Waiting for host <strong>{hostPlayerName}</strong> to start the match...
                  </span>
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      {/* PHASE 1..4: TABLE PLAYING / TRICKS / SUMMARY */}
      {phase !== 'LOBBY' && (
        <main className="w-full max-w-4xl mx-auto flex-1 flex flex-col justify-between p-3 relative z-10">
          {/* Opponents Seats */}
          <div className="grid grid-cols-3 items-center w-full gap-2 py-1">
            {players.slice(1, 4).map((p, idx) => (
              <div
                key={p.id || idx}
                className={`flex flex-col p-2 rounded-xl bg-black/30 border border-emerald-800/40 ${
                  idx === 0 ? 'items-start mr-auto' : idx === 1 ? 'items-center mx-auto' : 'items-end ml-auto'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{p.name}</span>
                </div>
                <div className="text-[11px] text-amber-300 font-mono font-bold mt-0.5">
                  Score: {p.score || 0} pts
                </div>
              </div>
            ))}
          </div>

          {/* Center Felt Trick Arena */}
          <div className="my-auto w-full max-w-md mx-auto min-h-[160px] sm:min-h-[190px] rounded-3xl bg-[#0b2418] border-2 border-[#16422d] shadow-inner flex flex-col items-center justify-center p-4 relative">
            {/* Table ID and Pot Ribbon */}
            <div className="absolute top-2.5 px-3 py-0.5 rounded-full bg-black/50 border border-emerald-700/40 text-[10px] text-amber-300 font-bold font-mono">
              Table #{roomCode || 'HAZ88'} · Pot: 🪙 {potCoins.toLocaleString()} Coins
            </div>

            {phase === 'ARRANGING' && (
              <div className="text-center flex flex-col items-center gap-2 pt-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-amber-400 text-lg">
                  🂠
                </div>
                <h3 className="font-display text-sm font-semibold text-emerald-100">
                  Arrange Your 4 Sets (3 + 3 + 3 + 4 Cards)
                </h3>
                
                {/* 2 Minutes Timer Pill */}
                <div
                  className={`px-3.5 py-1 rounded-full border flex items-center gap-1.5 text-xs font-mono font-bold transition-all shadow-md ${
                    timerSeconds <= 20
                      ? 'bg-rose-950/90 border-rose-500 text-rose-300 animate-bounce'
                      : 'bg-black/60 border-amber-400/60 text-amber-300'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>2 Minutes Timer: {formatTimerMinSec(timerSeconds)} Left</span>
                </div>

                <p className="text-xs text-emerald-300/70 max-w-xs leading-relaxed">
                  Tap cards to place in sets. Set 1 leads Trick 1. Simultaneous trick resolution!
                </p>
                {hasSubmitted && (
                  <div className="mt-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 animate-pulse">
                    <Check className="w-3.5 h-3.5" />
                    <span>Sets Locked! Waiting for other players...</span>
                  </div>
                )}
              </div>
            )}

            {phase === 'REVEALING_TRICKS' && currentRoundTricks.length > 0 && (
              <div className="w-full flex flex-col items-center gap-2 pt-4">
                <div className="flex items-center justify-between w-full text-xs font-semibold text-amber-300 px-2">
                  <span>TRICK {activeTrickIndex + 1} OF 4</span>
                  <span className="text-emerald-300">
                    Trick Pot: {currentRoundTricks[activeTrickIndex]?.pointsWon} Pts
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 w-full justify-center pt-2">
                  {currentRoundTricks[activeTrickIndex]?.allSets.map(entry => {
                    const isTrickWinner = entry.playerId === currentRoundTricks[activeTrickIndex].winnerPlayerId;
                    return (
                      <div
                        key={entry.playerId}
                        className={`flex flex-col items-center p-1.5 rounded-xl border transition-all ${
                          isTrickWinner
                            ? 'bg-amber-400/25 border-amber-400 scale-105 shadow-lg'
                            : 'bg-black/30 border-white/5 opacity-80'
                        }`}
                      >
                        <span className="text-[10px] font-bold truncate max-w-[70px] text-emerald-200">
                          {entry.playerName}
                        </span>
                        <div className="flex gap-1 justify-center my-1">
                          {entry.set.cards.map((c, i) => (
                            <PlayingCard key={c.id + i} card={c} size="sm" isPlayable={false} />
                          ))}
                        </div>
                        <span className="text-[9px] text-amber-300 truncate max-w-[80px]">
                          {formatComboLabel(entry.set.type).replace(/[^\w\s()]/gi, '')}
                        </span>
                        {isTrickWinner && (
                          <span className="text-[9px] font-bold text-amber-400 mt-0.5">
                            Winner! (+{currentRoundTricks[activeTrickIndex].pointsWon} pts)
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {(phase === 'ROUND_SUMMARY' || phase === 'MATCH_OVER') && (
              <div className="w-full flex flex-col items-center gap-3 text-center pt-4">
                <Trophy className="w-10 h-10 text-amber-400 animate-bounce" />
                <div>
                  <h3 className="font-display text-lg font-black text-amber-300">
                    {phase === 'MATCH_OVER' ? 'HAZARI 1000 CHAMPION MATCH OVER!' : `Round ${roundNumber} Complete!`}
                  </h3>
                  {phase === 'MATCH_OVER' && (
                    <div className="flex flex-col gap-2 mt-2 items-center">
                      <div className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500/30 to-amber-600/30 border-2 border-amber-400 text-amber-300 text-sm font-black shadow-xl">
                        👑 WINNER: {matchWinner?.name || 'Top Player'}!
                        <span className="block text-xs text-emerald-200 font-bold mt-1">
                          Claimed Pot Prize: 🪙 {potCoins.toLocaleString()} Coins!
                        </span>
                      </div>

                      {lastXpAward && (
                        <div className="px-4 py-1.5 rounded-xl bg-black/70 border border-amber-400/50 text-xs text-emerald-200 flex items-center gap-2 font-bold shadow-md">
                          <Zap className="w-4 h-4 text-amber-400" />
                          <span>+{lastXpAward.xpGained} XP Gained! (Level {levelData.level} — {levelData.title})</span>
                          {lastXpAward.didLevelUp && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[10px] animate-bounce">
                              🚀 LEVEL UP!
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full text-xs">
                  {players.map(p => (
                    <div key={p.id} className="p-2 rounded-xl bg-black/40 border border-emerald-800/40">
                      <div className="font-semibold truncate text-emerald-200">{p.name}</div>
                      <div className="text-amber-400 font-bold font-mono mt-1 text-sm">{p.score} pts</div>
                    </div>
                  ))}
                </div>

                {isHostUser ? (
                  <button
                    onClick={handleNextRound}
                    className="mt-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-transform"
                  >
                    <span>{phase === 'MATCH_OVER' ? 'Play New Match' : 'Next Deal'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <p className="text-xs text-emerald-300">
                    Waiting for host {hostPlayerName} to start the next round...
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Phase 1: 4 Arranged Sets & Unassigned Hand Tray */}
          <div className="w-full flex flex-col gap-3 pt-2">
            {/* Unassigned Cards Tray */}
            {phase === 'ARRANGING' && !hasSubmitted && (
              <div className="w-full p-3 rounded-2xl bg-[#091b12] border border-amber-500/30 shadow-md flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                  <span className="flex items-center gap-1.5">
                    <span>🎴 Unassigned Cards Hand Tray</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-mono">
                      {unassignedCards.length} Cards Remaining
                    </span>
                  </span>
                  {selectedCardId ? (
                    <span className="text-[11px] text-emerald-300 font-normal animate-pulse">
                      Tap a Set box below to place selected card!
                    </span>
                  ) : (
                    <span className="text-[11px] text-emerald-400/70 font-normal">
                      Tap any card to select, then tap target Set (1, 2, 3, or 4)
                    </span>
                  )}
                </div>

                <div
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    const cardId = e.dataTransfer.getData('text/plain');
                    if (cardId) handleDropCardToHand(cardId);
                  }}
                  className="flex flex-wrap gap-1.5 justify-center min-h-[72px] items-center p-2 rounded-xl bg-black/40 border border-emerald-900/40"
                >
                  {unassignedCards.length > 0 ? (
                    unassignedCards.map(c => (
                      <PlayingCard
                        key={c.id}
                        card={c}
                        isSelected={selectedCardId === c.id}
                        onClick={() => handleUnassignedCardClick(c.id)}
                        size="sm"
                      />
                    ))
                  ) : (
                    <span className="text-xs text-emerald-400/60 py-2">
                      All 13 cards are placed in Set boxes! Tap "Lock & Play Sets" to start.
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* 4 Set Target Boxes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {sets.map((setCards, setIdx) => {
                const maxCapacity = setIdx === 3 ? 4 : 3;
                const evalSet = evaluatedSets[setIdx];
                const isFull = setCards.length === maxCapacity;

                return (
                  <div
                    key={`set_${setIdx}`}
                    onClick={() => handleSetBoxClick(setIdx)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                      e.preventDefault();
                      const cardId = e.dataTransfer.getData('text/plain');
                      if (cardId) handleMoveCardToSet(cardId, setIdx);
                    }}
                    className={`rounded-2xl p-2.5 bg-[#0c2217] border cursor-pointer transition-all flex flex-col justify-between min-h-[140px] ${
                      selectedCardId && !isFull
                        ? 'border-amber-400 ring-2 ring-amber-400/40 bg-emerald-950/90 scale-[1.02]'
                        : isFull
                        ? 'border-emerald-700/60 bg-[#0d261a]'
                        : 'border-dashed border-emerald-800/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between w-full text-xs font-bold text-emerald-200 mb-1 px-1">
                        <span>
                          Set {setIdx + 1}{' '}
                          <span className={setCards.length === maxCapacity ? 'text-emerald-400' : 'text-amber-300'}>
                            ({setCards.length}/{maxCapacity})
                          </span>
                        </span>
                        <span className="text-amber-300 font-mono text-[11px]">{evalSet.totalPoints} pts</span>
                      </div>

                      <div className="text-[10px] text-amber-400 font-semibold truncate max-w-full mb-2">
                        {setCards.length > 0 ? formatComboLabel(evalSet.type) : 'Empty Slot'}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 justify-center min-h-[70px] items-center my-auto p-1 rounded-xl bg-black/20">
                      {setCards.map(c => (
                        <PlayingCard
                          key={c.id}
                          card={c}
                          isSelected={selectedCardId === c.id}
                          onClick={() => handleSetCardClick(c.id, setIdx)}
                          size="sm"
                        />
                      ))}
                      {setCards.length < maxCapacity && (
                        <div
                          className={`px-2 py-3 rounded-lg border text-[10px] font-bold flex items-center justify-center transition-all ${
                            selectedCardId
                              ? 'bg-amber-500/25 border-amber-400 text-amber-300 animate-pulse ring-1 ring-amber-400/50'
                              : 'border-dashed border-emerald-700/40 text-emerald-500/50'
                          }`}
                        >
                          {selectedCardId ? '+ Tap to Place' : '+ Add'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={hasSubmitted || phase !== 'ARRANGING'}
                  onClick={handleClearAllSets}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/50 text-xs font-semibold text-emerald-200 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
                  title="Move all cards back to hand for 100% manual set arrangement"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Reset All (100% Manual)</span>
                </button>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                <span className="text-xs text-emerald-300 font-mono">
                  Points: <strong className="text-amber-400">{totalHandPoints}</strong> / 360
                </span>

                <button
                  type="button"
                  disabled={hasSubmitted || phase !== 'ARRANGING' || !isSetValidForPlay}
                  onClick={handleSubmitSets}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 ${
                    hasSubmitted
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : isSetValidForPlay
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-900/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {hasSubmitted
                      ? 'Sets Locked & Ready'
                      : isSetValidForPlay
                      ? 'Lock & Play Sets'
                      : `Place All Cards (${totalPlacedCount}/13)`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
};
