/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, Suit, Rank, Player } from '../../types/cards';
import { createDeck, shuffleDeck } from '../../utils/cardDeck';
import { PlayingCard } from './PlayingCard';
import { zenAudio } from '../../audio/soundEngine';
import { addCoins, getWalletBalance, addPlayerXP, getPlayerLevelData, PlayerLevelData } from '../../utils/walletStorage';
import {
  Trophy,
  Coins,
  Crown,
  Volume2,
  VolumeX,
  Play,
  Clock,
  Shield,
  Star,
  Zap,
  RotateCcw,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface CallBreakBoardProps {
  humanPlayerName: string;
  bootAmount?: number;
  totalPot?: number;
  onExit: () => void;
}

interface TrickPlay {
  playerId: string;
  playerName: string;
  card: Card;
}

interface CallBreakRoundScore {
  roundNumber: number;
  bids: Record<string, number>;
  tricksWon: Record<string, number>;
  scores: Record<string, number>;
}

export const CallBreakBoard: React.FC<CallBreakBoardProps> = ({
  humanPlayerName,
  bootAmount = 500,
  totalPot = 2000,
  onExit,
}) => {
  const [roundNumber, setRoundNumber] = useState<number>(1); // 1 to 5 rounds
  const [phase, setPhase] = useState<'BIDDING' | 'PLAYING' | 'ROUND_SUMMARY' | 'MATCH_OVER'>('BIDDING');
  const [potCoins, setPotCoins] = useState<number>(totalPot);
  const [walletBalance, setWalletBalance] = useState<number>(() => getWalletBalance());
  const [levelData, setLevelData] = useState<PlayerLevelData>(() => getPlayerLevelData());
  const [potAwarded, setPotAwarded] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const [players, setPlayers] = useState<Player[]>([
    { id: 'p1', name: humanPlayerName || 'You', isHost: true, isBot: false, avatarSeed: 'you', cardsCount: 13, score: 0 },
    { id: 'p2', name: 'Vikram', isHost: false, isBot: true, avatarSeed: 'vikram', cardsCount: 13, score: 0 },
    { id: 'p3', name: 'Priya', isHost: false, isBot: true, avatarSeed: 'priya', cardsCount: 13, score: 0 },
    { id: 'p4', name: 'Kabir', isHost: false, isBot: true, avatarSeed: 'kabir', cardsCount: 13, score: 0 },
  ]);

  // Hands, Bids, Tricks
  const [hands, setHands] = useState<Record<string, Card[]>>({ p1: [], p2: [], p3: [], p4: [] });
  const [bids, setBids] = useState<Record<string, number>>({ p1: 0, p2: 0, p3: 0, p4: 0 });
  const [tricksWon, setTricksWon] = useState<Record<string, number>>({ p1: 0, p2: 0, p3: 0, p4: 0 });
  
  // Current trick state
  const [currentLeadPlayerId, setCurrentLeadPlayerId] = useState<string>('p1');
  const [currentTurnPlayerId, setCurrentTurnPlayerId] = useState<string>('p1');
  const [currentTrickPlays, setCurrentTrickPlays] = useState<TrickPlay[]>([]);
  const [trickCount, setTrickCount] = useState<number>(1); // 1 to 13 tricks per round
  const [scoreHistory, setScoreHistory] = useState<CallBreakRoundScore[]>([]);
  const [matchWinner, setMatchWinner] = useState<{ id: string; name: string; isMe: boolean; score: number } | null>(null);
  const [lastXpAward, setLastXpAward] = useState<{ xpGained: number; didLevelUp: boolean } | null>(null);

  // Timer for arrangement / bid
  const [timerSeconds, setTimerSeconds] = useState<number>(120);

  // Helper: AI smart bid calculator
  const calculateAIBid = (cards: Card[]): number => {
    let bid = 0;
    cards.forEach(c => {
      if (c.suit === 'spades') {
        if (['A', 'K', 'Q', 'J'].includes(c.rank)) bid += 1;
        else if (c.value >= 8) bid += 0.5;
      } else {
        if (c.rank === 'A') bid += 1;
        else if (c.rank === 'K') bid += 0.7;
      }
    });
    return Math.max(1, Math.min(8, Math.round(bid)));
  };

  // Start fresh deal for Call Break (Lakdi)
  const startFreshDeal = useCallback(() => {
    zenAudio.playCardDeal();
    const deck = shuffleDeck(createDeck());
    const dealtHands = {
      p1: deck.slice(0, 13).sort((a, b) => (a.suit === b.suit ? b.value - a.value : a.suit.localeCompare(b.suit))),
      p2: deck.slice(13, 26),
      p3: deck.slice(26, 39),
      p4: deck.slice(39, 52),
    };

    setHands(dealtHands);
    setBids({ p1: 0, p2: calculateAIBid(dealtHands.p2), p3: calculateAIBid(dealtHands.p3), p4: calculateAIBid(dealtHands.p4) });
    setTricksWon({ p1: 0, p2: 0, p3: 0, p4: 0 });
    setCurrentTrickPlays([]);
    setTrickCount(1);
    setPhase('BIDDING');
    setTimerSeconds(120);
    setStatusMessage('Select your Call Bid (1-8) for Round ' + roundNumber);
  }, [roundNumber]);

  useEffect(() => {
    startFreshDeal();
  }, [startFreshDeal]);

  // Handle player bid selection
  const handleSelectBid = (userBid: number) => {
    zenAudio.playCardSelect();
    const updatedBids = { ...bids, p1: userBid };
    setBids(updatedBids);
    setPhase('PLAYING');
    setCurrentLeadPlayerId('p1');
    setCurrentTurnPlayerId('p1');
    setStatusMessage(`Round ${roundNumber}: You call ${userBid} tricks! Hukum (Spades ♠) is Trump.`);
  };

  // AI turn player trigger
  const playAITurn = useCallback((playerId: string, currentPlays: TrickPlay[], handCards: Card[]) => {
    if (handCards.length === 0) return;

    let leadSuit: Suit | null = currentPlays.length > 0 ? currentPlays[0].card.suit : null;
    let playableCards = handCards;

    if (leadSuit) {
      const sameSuitCards = handCards.filter(c => c.suit === leadSuit);
      if (sameSuitCards.length > 0) {
        playableCards = sameSuitCards;
      } else {
        // Must play Hukum (Spades) if lead suit not available
        const hukumCards = handCards.filter(c => c.suit === 'spades');
        if (hukumCards.length > 0) {
          playableCards = hukumCards;
        }
      }
    }

    // Pick highest or sensible card
    const chosenCard = playableCards.sort((a, b) => b.value - a.value)[0] || handCards[0];
    
    // Play card
    executePlayCard(playerId, chosenCard);
  }, []);

  // Execute playing a card
  const executePlayCard = (playerId: string, card: Card) => {
    zenAudio.playCardDeal();

    // Remove card from player hand
    setHands(prev => ({
      ...prev,
      [playerId]: prev[playerId].filter(c => c.id !== card.id),
    }));

    const playerName = players.find(p => p.id === playerId)?.name || playerId;
    const nextPlays = [...currentTrickPlays, { playerId, playerName, card }];
    setCurrentTrickPlays(nextPlays);

    // Determine next turn or resolve trick
    if (nextPlays.length === 4) {
      // Trick complete! Resolve winner
      setTimeout(() => resolveTrickWinner(nextPlays), 1200);
    } else {
      const order = ['p1', 'p2', 'p3', 'p4'];
      const nextIdx = (order.indexOf(playerId) + 1) % 4;
      const nextPlayerId = order[nextIdx];
      setCurrentTurnPlayerId(nextPlayerId);

      if (nextPlayerId !== 'p1') {
        setTimeout(() => playAITurn(nextPlayerId, nextPlays, hands[nextPlayerId]), 800);
      }
    }
  };

  // Human player card click
  const handleHumanPlayCard = (card: Card) => {
    if (phase !== 'PLAYING' || currentTurnPlayerId !== 'p1') return;

    // Validate Hukum / Must Follow Suit rules
    if (currentTrickPlays.length > 0) {
      const leadSuit = currentTrickPlays[0].card.suit;
      const myLeadCards = hands.p1.filter(c => c.suit === leadSuit);
      const myHukumCards = hands.p1.filter(c => c.suit === 'spades');

      if (myLeadCards.length > 0 && card.suit !== leadSuit) {
        setStatusMessage(`⚠️ Must follow lead suit (${leadSuit.toUpperCase()})!`);
        setTimeout(() => setStatusMessage(null), 2500);
        return;
      }

      if (myLeadCards.length === 0 && myHukumCards.length > 0 && card.suit !== 'spades') {
        setStatusMessage(`⚠️ Must play Hukum (Spades ♠) when lead suit is missing!`);
        setTimeout(() => setStatusMessage(null), 2500);
        return;
      }
    }

    executePlayCard('p1', card);
  };

  // Evaluate trick winner
  const resolveTrickWinner = (plays: TrickPlay[]) => {
    const leadSuit = plays[0].card.suit;
    let winningPlay = plays[0];

    for (let i = 1; i < plays.length; i++) {
      const curr = plays[i];
      // Hukum (Spades ♠) beats any non-spade card
      if (curr.card.suit === 'spades' && winningPlay.card.suit !== 'spades') {
        winningPlay = curr;
      } else if (curr.card.suit === winningPlay.card.suit && curr.card.value > winningPlay.card.value) {
        winningPlay = curr;
      }
    }

    zenAudio.playTrickWin();
    const winnerId = winningPlay.playerId;
    const winnerName = winningPlay.playerName;

    setTricksWon(prev => ({ ...prev, [winnerId]: prev[winnerId] + 1 }));
    setStatusMessage(`✨ ${winnerName} took Trick ${trickCount} with ${winningPlay.card.rank}${winningPlay.card.suit === 'spades' ? '♠ Hukum' : ''}!`);

    setTimeout(() => {
      setCurrentTrickPlays([]);
      if (trickCount < 13) {
        setTrickCount(t => t + 1);
        setCurrentLeadPlayerId(winnerId);
        setCurrentTurnPlayerId(winnerId);

        if (winnerId !== 'p1') {
          setTimeout(() => playAITurn(winnerId, [], hands[winnerId]), 600);
        }
      } else {
        // Round 13 completed! Calculate Round Score
        resolveRoundSummary();
      }
    }, 1500);
  };

  // Resolve Round Summary
  const resolveRoundSummary = () => {
    const roundScores: Record<string, number> = {};
    const updatedPlayers = [...players];

    ['p1', 'p2', 'p3', 'p4'].forEach(pId => {
      const bid = bids[pId];
      const won = tricksWon[pId];
      let score = 0;
      if (won >= bid) {
        score = bid + (won - bid) * 0.1;
      } else {
        score = -bid;
      }
      roundScores[pId] = parseFloat(score.toFixed(1));

      const pObj = updatedPlayers.find(p => p.id === pId)!;
      pObj.score = parseFloat((pObj.score + score).toFixed(1));
    });

    const roundRecord: CallBreakRoundScore = {
      roundNumber,
      bids,
      tricksWon,
      scores: roundScores,
    };

    setPlayers(updatedPlayers);
    setScoreHistory(prev => [...prev, roundRecord]);

    if (roundNumber >= 5) {
      // 5 Rounds completed -> Match Over!
      setPhase('MATCH_OVER');
      zenAudio.playHazari1000Fanfare();

      const topWinner = [...updatedPlayers].sort((a, b) => b.score - a.score)[0];
      const isMe = topWinner.id === 'p1';
      setMatchWinner({ id: topWinner.id, name: topWinner.name, isMe, score: topWinner.score });

      const xpGained = 100 + (tricksWon.p1 * 20) + (isMe ? 300 : 0);
      const xpRes = addPlayerXP(xpGained);
      setLevelData(xpRes.newLevelData);
      setLastXpAward({ xpGained, didLevelUp: xpRes.didLevelUp });

      if (isMe && !potAwarded) {
        setPotAwarded(true);
        addCoins(potCoins);
        setWalletBalance(getWalletBalance());
      }
    } else {
      setPhase('ROUND_SUMMARY');
    }
  };

  // Next round handler
  const handleNextRound = () => {
    if (roundNumber < 5) {
      setRoundNumber(r => r + 1);
      startFreshDeal();
    } else {
      // Restart match
      setRoundNumber(1);
      setPlayers(prev => prev.map(p => ({ ...p, score: 0 })));
      setScoreHistory([]);
      setPotAwarded(false);
      setMatchWinner(null);
      startFreshDeal();
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#081810] text-slate-100 flex flex-col justify-between relative overflow-x-hidden select-none font-sans">
      {/* Top Header */}
      <header className="w-full max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between border-b border-emerald-900/40 bg-[#0d261a]/90 backdrop-blur-md z-30">
        <div className="flex items-center gap-2">
          <button
            onClick={onExit}
            className="px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/40 text-xs font-semibold text-emerald-200 transition-colors"
          >
            ← Leave Club
          </button>
          <div className="flex items-center gap-1.5 text-xs text-emerald-300">
            <span className="font-black text-amber-400 font-display text-sm tracking-wide">CALL BREAK (LAKDI)</span>
            <span aria-hidden="true">·</span>
            <span className="text-white font-medium">Round {roundNumber}/5</span>
            <span aria-hidden="true">·</span>
            <span className="text-amber-300 font-bold">♠ Hukum Trump</span>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-2">
          {/* Level Badge */}
          <div className="px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center gap-1 text-xs font-bold">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Lv {levelData.level}</span>
          </div>

          {/* Pot Badge */}
          <div className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 border border-amber-300 text-slate-950 flex items-center gap-1.5 text-xs font-black shadow-md">
            <Coins className="w-3.5 h-3.5 text-slate-950" />
            <span>Pot: 🪙 {potCoins.toLocaleString()}</span>
          </div>

          {/* Wallet */}
          <div className="px-2.5 py-1 rounded-xl bg-black/50 border border-emerald-700/50 flex items-center gap-1 text-xs text-amber-300 font-bold">
            <span>🪙 {walletBalance.toLocaleString()}</span>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {statusMessage && (
        <div className="w-full max-w-md mx-auto px-4 py-2 mt-2 z-40">
          <div className="p-3 rounded-2xl bg-amber-950/90 border border-amber-500/60 text-amber-200 text-xs font-bold text-center shadow-lg">
            {statusMessage}
          </div>
        </div>
      )}

      {/* Main Arena */}
      <main className="w-full max-w-4xl mx-auto flex-1 flex flex-col justify-between p-3 relative z-10">
        {/* Opponent Seats */}
        <div className="grid grid-cols-3 items-center w-full gap-2 py-1">
          {players.slice(1, 4).map((p, idx) => (
            <div
              key={p.id}
              className={`flex flex-col p-2.5 rounded-2xl bg-black/40 border border-emerald-800/50 ${
                idx === 0 ? 'items-start mr-auto' : idx === 1 ? 'items-center mx-auto' : 'items-end ml-auto'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{p.name}</span>
              </div>
              <div className="text-[11px] text-amber-300 font-mono font-bold mt-0.5">
                Call: {bids[p.id] || 0} | Tricks: {tricksWon[p.id] || 0} | Score: {p.score}
              </div>
            </div>
          ))}
        </div>

        {/* Center Felt Trick Table */}
        <div className="my-auto w-full max-w-md mx-auto min-h-[170px] rounded-3xl bg-[#0b2618] border-2 border-[#184831] shadow-2xl flex flex-col items-center justify-center p-4 relative">
          <div className="absolute top-2.5 px-3 py-0.5 rounded-full bg-black/50 border border-emerald-700/40 text-[10px] text-amber-300 font-bold font-mono">
            Hukum ♠ Spades Trump · Trick {trickCount}/13
          </div>

          {phase === 'BIDDING' && (
            <div className="text-center flex flex-col items-center gap-3 pt-3">
              <h3 className="font-display text-base font-black text-amber-300">
                Round {roundNumber} Call Bidding Phase
              </h3>
              <p className="text-xs text-emerald-200/80 max-w-xs">
                Select how many tricks (1-8) you guarantee to win this round!
              </p>
              <div className="flex flex-wrap gap-2 justify-center pt-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                  <button
                    key={num}
                    onClick={() => handleSelectBid(num)}
                    className="w-10 h-10 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-lg active:scale-95 transition-transform"
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          )}

          {phase === 'PLAYING' && (
            <div className="w-full flex flex-col items-center gap-2 pt-3">
              <div className="text-xs font-bold text-amber-300">
                {currentTurnPlayerId === 'p1' ? '👉 YOUR TURN TO PLAY' : `Waiting for ${players.find(p => p.id === currentTurnPlayerId)?.name}...`}
              </div>

              {/* Played Trick Cards */}
              <div className="flex flex-wrap gap-2.5 justify-center py-2">
                {currentTrickPlays.map(play => (
                  <div key={play.playerId} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-emerald-300 font-semibold">{play.playerName}</span>
                    <PlayingCard card={play.card} size="sm" isPlayable={false} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {(phase === 'ROUND_SUMMARY' || phase === 'MATCH_OVER') && (
            <div className="w-full flex flex-col items-center gap-3 text-center pt-3">
              <Trophy className="w-10 h-10 text-amber-400 animate-bounce" />
              <div>
                <h3 className="font-display text-lg font-black text-amber-300">
                  {phase === 'MATCH_OVER' ? 'INDIAN CALL BREAK CHAMPION!' : `Round ${roundNumber} Summary`}
                </h3>
                {phase === 'MATCH_OVER' && (
                  <div className="mt-2 p-3 rounded-2xl bg-amber-500/20 border-2 border-amber-400 text-amber-300 text-xs font-black shadow-xl">
                    👑 WINNER: {matchWinner?.name || 'Top Player'} ({matchWinner?.score} pts)
                    <span className="block text-[11px] text-emerald-200 mt-1">
                      Claimed 🪙 {potCoins.toLocaleString()} Pot Coins!
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full text-xs">
                {players.map(p => (
                  <div key={p.id} className="p-2 rounded-xl bg-black/40 border border-emerald-800/40">
                    <div className="font-semibold text-emerald-200">{p.name}</div>
                    <div className="text-amber-300 font-bold mt-0.5">Call: {bids[p.id]} | Won: {tricksWon[p.id]}</div>
                    <div className="text-amber-400 font-black text-sm font-mono mt-0.5">{p.score} pts</div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleNextRound}
                className="mt-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-transform"
              >
                <span>{phase === 'MATCH_OVER' ? 'Play New Match' : `Start Round ${roundNumber + 1}`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Human Cards Tray */}
        <div className="w-full flex flex-col gap-2 pt-2">
          <div className="flex items-center justify-between px-2 text-xs font-bold text-amber-300">
            <span>🎴 Your Cards ({hands.p1.length}) — Call: {bids.p1} | Tricks Won: {tricksWon.p1}</span>
            <span className="text-emerald-300 font-mono">Hukum (Spades ♠) is Trump</span>
          </div>

          <div className="flex flex-wrap gap-1.5 justify-center min-h-[95px] p-2.5 rounded-2xl bg-[#0a2015] border border-emerald-800/60 shadow-inner">
            {hands.p1.map(card => (
              <PlayingCard
                key={card.id}
                card={card}
                isPlayable={phase === 'PLAYING' && currentTurnPlayerId === 'p1'}
                onClick={() => handleHumanPlayCard(card)}
                size="md"
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};
