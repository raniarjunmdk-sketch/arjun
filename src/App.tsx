import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  CellCoord,
  PuzzleDefinition,
  PlayerStats,
  ThemeConfig,
} from './types/game';
import { ZEN_THEMES } from './constants/themes';
import {
  getLevelPuzzle,
  generateDailyPuzzle,
  checkPuzzleSolved,
  getPuzzleHint,
} from './utils/puzzleGenerator';
import {
  loadPlayerStats,
  savePlayerStats,
  recordPuzzleWin,
  WinResult,
} from './utils/storage';
import { zenAudio } from './audio/soundEngine';
import { ZenPetals } from './components/ZenPetals';
import { GameBoard } from './components/GameBoard';
import { GameHUD } from './components/GameHUD';
import { BottomControls } from './components/BottomControls';
import { TitleScreen } from './components/TitleScreen';
import { DailyView } from './components/DailyView';
import { JourneyView } from './components/JourneyView';
import { GardenView } from './components/GardenView';
import { RewardsModal } from './components/RewardsModal';
import { VictoryModal } from './components/VictoryModal';
import { PhoneStorageModal } from './components/PhoneStorageModal';
import { CardClubLobby } from './components/cards/CardClubLobby';
import { HazariBoard } from './components/cards/HazariBoard';
import { CallBreakBoard } from './components/cards/CallBreakBoard';
import { TableJoinModal } from './components/cards/TableJoinModal';
import { UsernameModal } from './components/UsernameModal';
import { SettingsModal } from './components/SettingsModal';
import { FriendsModal } from './components/FriendsModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { CardGameType, TablePreviewInfo } from './types/cards';
import { getWalletBalance, deductCoins } from './utils/walletStorage';

type AppScreen = 'TITLE' | 'PLAYING' | 'DAILY' | 'JOURNEY' | 'GARDEN' | 'TAS_PATTI_LOBBY' | 'HAZARI_TABLE' | 'CALL_BREAK_TABLE';

export default function App() {
  const [stats, setStats] = useState<PlayerStats>(() => loadPlayerStats());
  const [screen, setScreen] = useState<AppScreen>('TITLE');

  // Player name for card games & profile
  const [playerName, setPlayerName] = useState<string>(() => {
    return localStorage.getItem('solis_player_name') || 'Player 1';
  });

  // Onboarding username modal state
  const [isUsernameOnboardingOpen, setIsUsernameOnboardingOpen] = useState<boolean>(() => {
    const created = localStorage.getItem('solis_username_created');
    const existingName = localStorage.getItem('solis_player_name');
    return !created || !existingName;
  });

  const [isEditUsernameOpen, setIsEditUsernameOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isFriendsOpen, setIsFriendsOpen] = useState<boolean>(false);

  const handleSetPlayerName = (name: string) => {
    setPlayerName(name);
    localStorage.setItem('solis_player_name', name);
    localStorage.setItem('solis_username_created', 'true');
    setIsUsernameOnboardingOpen(false);
    setIsEditUsernameOpen(false);
  };

  // Card Game Multiplayer State
  const [isMultiplayer, setIsMultiplayer] = useState<boolean>(false);
  const [multiplayerRoomCode, setMultiplayerRoomCode] = useState<string>('');
  const [multiplayerBootAmount, setMultiplayerBootAmount] = useState<number>(500);
  const [multiplayerPotCoins, setMultiplayerPotCoins] = useState<number>(500);
  const [isHostUser, setIsHostUser] = useState<boolean>(true);
  const [isFriendOnlyTable, setIsFriendOnlyTable] = useState<boolean>(true);
  const [appToast, setAppToast] = useState<string | null>(null);

  // URL table direct join modal state
  const [urlTableCode, setUrlTableCode] = useState<string | null>(null);
  const [urlTableInfo, setUrlTableInfo] = useState<TablePreviewInfo | null>(null);
  const [isUrlVerifying, setIsUrlVerifying] = useState<boolean>(false);
  const [urlVerifyError, setUrlVerifyError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

  // Today's date string in YYYY-MM-DD
  const todayStr = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  const [selectedDailyDate, setSelectedDailyDate] = useState<string>(todayStr);

  // Active puzzle state (defaults to current progressive level)
  const [currentPuzzle, setCurrentPuzzle] = useState<PuzzleDefinition>(() => {
    return getLevelPuzzle(stats.currentLevel);
  });

  const [paths, setPaths] = useState<Record<string, CellCoord[]>>({});
  const [undoHistory, setUndoHistory] = useState<Record<string, CellCoord[]>[]>([]);
  const [movesCount, setMovesCount] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isVictoryOpen, setIsVictoryOpen] = useState<boolean>(false);
  const [isRewardsOpen, setIsRewardsOpen] = useState<boolean>(false);
  const [isPhoneStorageOpen, setIsPhoneStorageOpen] = useState<boolean>(false);
  const [hintMessage, setHintMessage] = useState<string | null>(null);

  // Level Progression state
  const [nextLevelToPlay, setNextLevelToPlay] = useState<number>(stats.currentLevel + 1);

  // Newly unlocked rewards for celebration modal
  const [newUnlockedThemes, setNewUnlockedThemes] = useState<string[]>([]);
  const [newUnlockedSoundscapes, setNewUnlockedSoundscapes] = useState<string[]>([]);

  // Get active theme config
  const theme: ThemeConfig = useMemo(() => {
    return (
      ZEN_THEMES.find(t => t.id === stats.activeThemeId) || ZEN_THEMES[0]
    );
  }, [stats.activeThemeId]);

  // Audio initialization and soundscape tracking
  useEffect(() => {
    zenAudio.setMuted(stats.isMuted);
    zenAudio.setSoundscapeVolume(stats.soundscapeVolume);
    if (!stats.isMuted && screen !== 'HAZARI_TABLE') {
      zenAudio.startSoundscape(stats.activeSoundscapeId);
    }
    return () => {
      zenAudio.stopSoundscape();
    };
  }, [stats.activeSoundscapeId, stats.isMuted, stats.soundscapeVolume, screen]);

  // Check URL query parameters for friend room invite (?table=HAZ88 or ?room=HAZ88)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tableParam = params.get('table') || params.get('room');
    if (tableParam) {
      const code = tableParam.trim().toUpperCase();
      setUrlTableCode(code);
      setIsUrlVerifying(true);
      setUrlVerifyError(null);

      fetch(`/api/rooms/${code}`)
        .then(res => (res.ok ? res.json() : null))
        .then(data => {
          if (data) {
            setUrlTableInfo(data);
          } else {
            setUrlVerifyError(`Table #${code} not found or match has ended.`);
          }
        })
        .catch(() => {
          setUrlTableInfo({
            code,
            gameType: 'hazari',
            bootAmount: 500,
            totalPot: 1000,
            hostName: 'Friend',
            playersCount: 1,
            players: [{ id: 'host', name: 'Friend', isHost: true }],
            isFriendOnly: true,
            status: 'LOBBY',
          });
        })
        .finally(() => setIsUrlVerifying(false));
    }
  }, []);

  // Timer tick for puzzle playing state
  useEffect(() => {
    if (screen !== 'PLAYING' || isVictoryOpen || stats.isZenMode) return;
    const interval = window.setInterval(() => {
      setElapsedSeconds(s => s + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [screen, isVictoryOpen, stats.isZenMode]);

  // Connect WebSocket helper
  const getOrCreateWebSocket = useCallback((): Promise<WebSocket> => {
    return new Promise((resolve, reject) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        resolve(wsRef.current);
        return;
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/ws`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        wsRef.current = ws;
        resolve(ws);
      };

      ws.onerror = err => {
        console.warn('WS error:', err);
        reject(err);
      };
    });
  }, []);

  // Create Multiplayer Room - Host selects boot price and waits for friends
  const handleCreateMultiplayerRoom = async (
    gameType: CardGameType,
    bootAmount: number,
    isFriendOnly: boolean
  ) => {
    try {
      const bal = getWalletBalance();
      if (bal < bootAmount) {
        setAppToast(`🚫 Insufficient Coins! You need 🪙 ${bootAmount} Coins in your wallet to create this table.`);
        setTimeout(() => setAppToast(null), 4000);
        return;
      }

      const ws = await getOrCreateWebSocket();
      setIsMultiplayer(true);
      setIsHostUser(true);
      setIsFriendOnlyTable(isFriendOnly);
      setMultiplayerBootAmount(bootAmount);
      setMultiplayerPotCoins(bootAmount);

      const handleCreateResponse = (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'ROOM_CREATED') {
            deductCoins(bootAmount); // Deduct host boot into pot
            setMultiplayerRoomCode(data.roomCode);
            setMultiplayerBootAmount(data.bootAmount || bootAmount);
            setMultiplayerPotCoins(data.totalPot || bootAmount);
            setScreen('HAZARI_TABLE');
            ws.removeEventListener('message', handleCreateResponse);
          }
        } catch {
          // ignore
        }
      };

      ws.addEventListener('message', handleCreateResponse);
      ws.send(
        JSON.stringify({
          type: 'CREATE_ROOM',
          playerName,
          gameType,
          bootAmount,
          isFriendOnly,
        })
      );
    } catch {
      setIsMultiplayer(false);
      setScreen('HAZARI_TABLE');
    }
  };

  // Join Multiplayer Room
  const connectAndJoinRoom = async (code: string) => {
    try {
      const bal = getWalletBalance();
      if (bal < 100) {
        setAppToast('🚫 Insufficient Coins! You cannot join tables without coins in your wallet.');
        setTimeout(() => setAppToast(null), 4000);
        return;
      }

      const ws = await getOrCreateWebSocket();
      setIsMultiplayer(true);
      setIsHostUser(false);

      const handleJoinResponse = (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'ROOM_JOINED') {
            deductCoins(data.bootAmount || 500); // Deduct player boot into pot
            setMultiplayerRoomCode(data.roomCode);
            setMultiplayerBootAmount(data.bootAmount || 500);
            setMultiplayerPotCoins(data.totalPot || 1000);
            setScreen('HAZARI_TABLE');
            ws.removeEventListener('message', handleJoinResponse);
          } else if (data.type === 'ERROR') {
            setAppToast(data.message || 'Could not join table');
            setTimeout(() => setAppToast(null), 4000);
            ws.removeEventListener('message', handleJoinResponse);
          }
        } catch {
          // ignore
        }
      };

      ws.addEventListener('message', handleJoinResponse);
      ws.send(
        JSON.stringify({
          type: 'JOIN_ROOM',
          playerName,
          roomCode: code,
        })
      );
    } catch {
      setAppToast('Could not connect to server. Starting in Solo mode.');
      setTimeout(() => setAppToast(null), 4000);
      setIsMultiplayer(false);
      setScreen('HAZARI_TABLE');
    }
  };

  // Count connected pairs for puzzle
  const connectedPairsCount = useMemo(() => {
    if (!currentPuzzle || !currentPuzzle.pairs) return 0;
    return currentPuzzle.pairs.filter(pair => {
      const path = paths[pair.id];
      if (!path || path.length < 2) return false;
      const first = path[0];
      const last = path[path.length - 1];
      return (
        (first.r === pair.start.r && first.c === pair.start.c && last.r === pair.end.r && last.c === pair.end.c) ||
        (first.r === pair.end.r && first.c === pair.end.c && last.r === pair.start.r && last.c === pair.start.c)
      );
    }).length;
  }, [currentPuzzle, paths]);

  // Load and start a puzzle
  const startPuzzle = useCallback((puzzle: PuzzleDefinition) => {
    setCurrentPuzzle(puzzle);
    setPaths({});
    setUndoHistory([]);
    setMovesCount(0);
    setElapsedSeconds(0);
    setIsVictoryOpen(false);
    setScreen('PLAYING');
    zenAudio.playStepChime(0);
  }, []);

  // Check victory condition whenever paths change
  const handlePathsChange = useCallback(
    (newPaths: Record<string, CellCoord[]>) => {
      setUndoHistory(prev => [...prev.slice(-20), paths]);
      setPaths(newPaths);
      setMovesCount(m => m + 1);

      const isSolved = checkPuzzleSolved(currentPuzzle, newPaths);
      if (isSolved && !isVictoryOpen) {
        zenAudio.playVictoryChord();

        const result: WinResult = recordPuzzleWin(
          currentPuzzle.id,
          currentPuzzle.isDaily,
          currentPuzzle.dateStr,
          currentPuzzle.levelNumber
        );

        setStats(result.stats);
        setNewUnlockedThemes(result.newUnlockedThemes);
        setNewUnlockedSoundscapes(result.newUnlockedSoundscapes);
        setNextLevelToPlay(result.nextLevelNumber);
        setIsVictoryOpen(true);
      }
    },
    [currentPuzzle, isVictoryOpen, paths]
  );

  // Undo last step
  const handleUndo = useCallback(() => {
    if (undoHistory.length === 0) return;
    const previous = undoHistory[undoHistory.length - 1];
    setUndoHistory(prev => prev.slice(0, -1));
    setPaths(previous);
    zenAudio.playUndo();
  }, [undoHistory]);

  // Reset board
  const handleReset = useCallback(() => {
    setUndoHistory([]);
    setPaths({});
    setMovesCount(0);
    zenAudio.playUndo();
  }, []);

  // Show hint
  const handleHint = useCallback(() => {
    const hint = getPuzzleHint(currentPuzzle, paths);
    if (hint) {
      setHintMessage(hint.message);
      zenAudio.playStepChime(1);
      setTimeout(() => setHintMessage(null), 3500);
    }
  }, [currentPuzzle, paths]);

  // Toggle audio mute
  const handleToggleMute = useCallback(() => {
    const nextMuted = !stats.isMuted;
    const nextStats = { ...stats, isMuted: nextMuted };
    setStats(nextStats);
    savePlayerStats(nextStats);
    zenAudio.setMuted(nextMuted);
    if (!nextMuted) {
      zenAudio.startSoundscape(stats.activeSoundscapeId);
    }
  }, [stats]);

  // Toggle zen untimed mode
  const handleToggleZenMode = useCallback(() => {
    const nextZen = !stats.isZenMode;
    const nextStats = { ...stats, isZenMode: nextZen };
    setStats(nextStats);
    savePlayerStats(nextStats);
    zenAudio.playStepChime(2);
  }, [stats]);

  // Select a theme
  const handleSelectTheme = useCallback(
    (themeId: string) => {
      const nextStats = { ...stats, activeThemeId: themeId };
      setStats(nextStats);
      savePlayerStats(nextStats);
    },
    [stats]
  );

  // Select a soundscape
  const handleSelectSoundscape = useCallback(
    (soundscapeId: string) => {
      const nextStats = { ...stats, activeSoundscapeId: soundscapeId };
      setStats(nextStats);
      savePlayerStats(nextStats);
      zenAudio.startSoundscape(soundscapeId);
    },
    [stats]
  );

  // Adjust soundscape volume
  const handleChangeSoundscapeVolume = useCallback(
    (volume: number) => {
      const nextStats = { ...stats, soundscapeVolume: volume };
      setStats(nextStats);
      savePlayerStats(nextStats);
      zenAudio.setSoundscapeVolume(volume);
    },
    [stats]
  );

  // Advance to next progressive level
  const handleNextPuzzle = useCallback(() => {
    setIsVictoryOpen(false);
    if (currentPuzzle.isDaily) {
      setScreen('DAILY');
      return;
    }

    const nextLvl = (currentPuzzle.levelNumber || stats.currentLevel) + 1;
    const nextPuzzleDef = getLevelPuzzle(nextLvl);
    startPuzzle(nextPuzzleDef);
  }, [currentPuzzle, startPuzzle, stats.currentLevel]);

  // Keyboard shortcut support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isRewardsOpen) {
          setIsRewardsOpen(false);
        } else if (isVictoryOpen) {
          setIsVictoryOpen(false);
        } else if (screen !== 'TITLE') {
          setScreen('TITLE');
        }
      } else if (e.key === 'z' || e.key === 'Z') {
        if ((e.ctrlKey || e.metaKey || !e.shiftKey) && screen === 'PLAYING') {
          handleUndo();
        }
      } else if ((e.key === 'r' || e.key === 'R') && screen === 'PLAYING') {
        handleReset();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleReset, handleUndo, isRewardsOpen, isVictoryOpen, screen]);

  // Render Tas Patti & Hazari Club views
  if (screen === 'TAS_PATTI_LOBBY') {
    return (
      <>
        <CardClubLobby
          playerName={playerName}
          onSetPlayerName={handleSetPlayerName}
          onStartSoloHazari={() => {
            const currentBal = getWalletBalance();
            const soloBoot = 100; // Minimum 100 Coins Boot
            if (currentBal < soloBoot) {
              setAppToast(`🚫 Bankrupt! You have 🪙 ${currentBal} Coins. Minimum 🪙 ${soloBoot} Coins required to play.`);
              setTimeout(() => setAppToast(null), 4000);
              return;
            }
            deductCoins(soloBoot); // Deduct 100 coins entry fee
            setIsMultiplayer(false);
            setMultiplayerBootAmount(soloBoot);
            setMultiplayerPotCoins(soloBoot * 4); // Pot = 400 Coins
            setScreen('HAZARI_TABLE');
          }}
          onStartCallBreak={() => {
            const currentBal = getWalletBalance();
            const cbBoot = 500; // 500 Coins Call Break Entry
            if (currentBal < cbBoot) {
              setAppToast(`🚫 Insufficient Coins! You need at least 🪙 ${cbBoot} Coins to play Call Break.`);
              setTimeout(() => setAppToast(null), 4000);
              return;
            }
            deductCoins(cbBoot);
            setMultiplayerBootAmount(cbBoot);
            setMultiplayerPotCoins(cbBoot * 4);
            setScreen('CALL_BREAK_TABLE');
          }}
          onCreateMultiplayerRoom={handleCreateMultiplayerRoom}
          onJoinMultiplayerRoom={connectAndJoinRoom}
          onBackToZen={() => setScreen('TITLE')}
          onOpenFriends={() => setIsFriendsOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenPhoneStorage={() => setIsPhoneStorageOpen(true)}
        />

        {/* Username Creation / Edit Onboarding Modal */}
        <UsernameModal
          isOpen={isUsernameOnboardingOpen || isEditUsernameOpen}
          currentUsername={playerName}
          isInitialOnboarding={isUsernameOnboardingOpen}
          onSave={handleSetPlayerName}
          onClose={() => setIsEditUsernameOpen(false)}
        />

        {/* Settings Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          playerName={playerName}
          stats={stats}
          onClose={() => setIsSettingsOpen(false)}
          onOpenEditUsername={() => setIsEditUsernameOpen(true)}
          onOpenFriends={() => setIsFriendsOpen(true)}
          onOpenPhoneStorage={() => setIsPhoneStorageOpen(true)}
          onToggleMute={handleToggleMute}
        />

        {/* Friends Modal */}
        <FriendsModal
          isOpen={isFriendsOpen}
          playerName={playerName}
          onClose={() => setIsFriendsOpen(false)}
          onCreateTableForFriend={friendName => {
            handleCreateMultiplayerRoom('hazari', 500, true);
          }}
        />

        {/* Automatic PWA Install Banner on App Link Launch */}
        <PWAInstallBanner onOpenPhoneStorage={() => setIsPhoneStorageOpen(true)} />
      </>
    );
  }

  if (screen === 'HAZARI_TABLE') {
    return (
      <HazariBoard
        isMultiplayer={isMultiplayer}
        roomCode={multiplayerRoomCode}
        ws={wsRef.current}
        humanPlayerName={playerName}
        bootAmount={multiplayerBootAmount}
        totalPot={multiplayerPotCoins}
        isHost={isHostUser}
        isFriendOnly={isFriendOnlyTable}
        onExit={() => setScreen('TAS_PATTI_LOBBY')}
      />
    );
  }

  if (screen === 'CALL_BREAK_TABLE') {
    return (
      <CallBreakBoard
        humanPlayerName={playerName}
        bootAmount={multiplayerBootAmount}
        totalPot={multiplayerPotCoins}
        onExit={() => setScreen('TAS_PATTI_LOBBY')}
      />
    );
  }

  return (
    <div
      className={`min-h-screen w-full ${theme.background} flex flex-col justify-between relative overflow-hidden select-none transition-colors duration-500`}
    >
      {/* Gentle ambient floating petals canvas */}
      <ZenPetals theme={theme} />

      {/* Screen Router */}
      {screen === 'TITLE' && (
        <TitleScreen
          theme={theme}
          stats={stats}
          onStartGame={() => {
            const nextLvl = stats.currentLevel || 1;
            startPuzzle(getLevelPuzzle(nextLvl));
          }}
          onOpenDaily={() => setScreen('DAILY')}
          onOpenJourney={() => setScreen('JOURNEY')}
          onOpenGarden={() => setScreen('GARDEN')}
          onOpenRewards={() => setIsRewardsOpen(true)}
          onOpenTasPatti={() => setScreen('TAS_PATTI_LOBBY')}
          onOpenPhoneStorage={() => setIsPhoneStorageOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenFriends={() => setIsFriendsOpen(true)}
        />
      )}

      {screen === 'DAILY' && (
        <DailyView
          stats={stats}
          theme={theme}
          selectedDate={selectedDailyDate}
          onSelectDate={setSelectedDailyDate}
          onStartDaily={dateStr => {
            const daily = generateDailyPuzzle(dateStr);
            startPuzzle(daily);
          }}
          onBack={() => setScreen('TITLE')}
        />
      )}

      {screen === 'JOURNEY' && (
        <JourneyView
          stats={stats}
          theme={theme}
          currentLevelNumber={currentPuzzle.levelNumber || stats.currentLevel}
          onSelectLevel={levelNum => {
            const puzzle = getLevelPuzzle(levelNum);
            startPuzzle(puzzle);
          }}
          onBack={() => setScreen('TITLE')}
        />
      )}

      {screen === 'GARDEN' && (
        <GardenView
          theme={theme}
          onGenerate={puzzle => startPuzzle(puzzle)}
          onBack={() => setScreen('TITLE')}
        />
      )}

      {screen === 'PLAYING' && (
        <div className="w-full flex-1 flex flex-col justify-between py-2 z-10">
          <GameHUD
            puzzle={currentPuzzle}
            theme={theme}
            elapsedSeconds={elapsedSeconds}
            movesCount={movesCount}
            connectedPairsCount={connectedPairsCount}
            totalPairsCount={currentPuzzle.pairs.length}
            isMuted={stats.isMuted}
            isZenMode={stats.isZenMode}
            onToggleMute={handleToggleMute}
            onOpenRewards={() => setIsRewardsOpen(true)}
            onOpenMenu={() => setScreen('TITLE')}
            onOpenPhoneStorage={() => setIsPhoneStorageOpen(true)}
          />

          {hintMessage && (
            <div className="w-full max-w-xs mx-auto px-4 py-2 my-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs text-center animate-in fade-in duration-200 shadow-md">
              {hintMessage}
            </div>
          )}

          <div className="my-auto py-2">
            <GameBoard
              puzzle={currentPuzzle}
              theme={theme}
              paths={paths}
              onPathsChange={handlePathsChange}
            />
          </div>

          <BottomControls
            theme={theme}
            isZenMode={stats.isZenMode}
            canUndo={undoHistory.length > 0}
            onUndo={handleUndo}
            onHint={handleHint}
            onReset={handleReset}
            onToggleZenMode={handleToggleZenMode}
          />
        </div>
      )}

      {/* Rewards Modal */}
      <RewardsModal
        stats={stats}
        theme={theme}
        isOpen={isRewardsOpen}
        onClose={() => setIsRewardsOpen(false)}
        onSelectTheme={handleSelectTheme}
        onSelectSoundscape={handleSelectSoundscape}
        onChangeSoundscapeVolume={handleChangeSoundscapeVolume}
      />

      {/* Phone Storage & PWA Install Modal */}
      <PhoneStorageModal
        isOpen={isPhoneStorageOpen}
        onClose={() => setIsPhoneStorageOpen(false)}
        stats={stats}
        theme={theme}
        onStatsRestored={newStats => setStats(newStats)}
      />

      {/* Victory Celebration Modal */}
      <VictoryModal
        isOpen={isVictoryOpen}
        theme={theme}
        title={currentPuzzle.title}
        isDaily={Boolean(currentPuzzle.isDaily)}
        levelNumber={currentPuzzle.levelNumber}
        nextLevelNumber={nextLevelToPlay}
        moves={movesCount}
        timeSeconds={elapsedSeconds}
        isZenMode={stats.isZenMode}
        newUnlockedThemes={newUnlockedThemes}
        newUnlockedSoundscapes={newUnlockedSoundscapes}
        onNext={handleNextPuzzle}
        onReplay={() => {
          setIsVictoryOpen(false);
          handleReset();
        }}
        onOpenRewards={() => {
          setIsVictoryOpen(false);
          setIsRewardsOpen(true);
        }}
      />

      {/* Global App Toast Notification */}
      {appToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-slate-900/95 border border-amber-500/50 text-amber-200 text-xs sm:text-sm font-semibold shadow-2xl backdrop-blur-md animate-in slide-in-from-top duration-200 flex items-center gap-2">
          <span>✨</span>
          <span>{appToast}</span>
        </div>
      )}

      {/* Direct Table Join Popup Modal (from URL or Share Code) */}
      {urlTableCode && (
        <TableJoinModal
          tableCode={urlTableCode}
          tableInfo={urlTableInfo}
          isLoading={isUrlVerifying}
          errorMessage={urlVerifyError}
          playerName={playerName}
          onConfirmJoin={code => {
            setUrlTableCode(null);
            connectAndJoinRoom(code);
          }}
          onClose={() => setUrlTableCode(null)}
        />
      )}

      {/* Username Creation / Edit Onboarding Modal */}
      <UsernameModal
        isOpen={isUsernameOnboardingOpen || isEditUsernameOpen}
        currentUsername={playerName}
        isInitialOnboarding={isUsernameOnboardingOpen}
        onSave={handleSetPlayerName}
        onClose={() => setIsEditUsernameOpen(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        playerName={playerName}
        stats={stats}
        onClose={() => setIsSettingsOpen(false)}
        onOpenEditUsername={() => setIsEditUsernameOpen(true)}
        onOpenFriends={() => setIsFriendsOpen(true)}
        onOpenPhoneStorage={() => setIsPhoneStorageOpen(true)}
        onToggleMute={handleToggleMute}
      />

      {/* Automatic PWA Install Banner on App Link Launch */}
      <PWAInstallBanner onOpenPhoneStorage={() => setIsPhoneStorageOpen(true)} />

      {/* Friends Modal */}
      <FriendsModal
        isOpen={isFriendsOpen}
        playerName={playerName}
        onClose={() => setIsFriendsOpen(false)}
        onCreateTableForFriend={friendName => {
          handleCreateMultiplayerRoom('hazari', 500, true);
        }}
      />
    </div>
  );
}
