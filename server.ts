import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  dealHazariHands,
  dealHandsForPlayers,
  autoArrangeHazariHand,
  evaluateHazariSet,
  compareHazariSets,
  HAZARI_AI_NAMES,
} from './src/utils/cardDeck.ts';
import { Card, HazariTrickResult, HazariRoundSummary } from './src/types/cards.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ConnectedPlayer {
  id: string;
  name: string;
  ws?: WebSocket;
  isHost: boolean;
  isBot: boolean;
  score: number;
  ready: boolean;
  cards: Card[];
  submittedSets?: [Card[], Card[], Card[], Card[]];
}

interface ServerRoom {
  code: string;
  gameType: string;
  status: 'LOBBY' | 'ARRANGING' | 'PLAYING_TRICKS' | 'ROUND_SUMMARY' | 'MATCH_OVER';
  roundNumber: number;
  bootAmount: number;
  totalPot: number;
  isFriendOnly: boolean;
  players: ConnectedPlayer[];
  lastRoundSummary?: HazariRoundSummary;
}

const rooms = new Map<string, ServerRoom>();

function broadcastRoom(room: ServerRoom, type: string, extra: Record<string, unknown> = {}) {
  const hostPlayer = room.players.find(p => p.isHost);
  const publicPlayers = room.players.map(p => ({
    id: p.id,
    name: p.name,
    isHost: p.isHost,
    isBot: p.isBot,
    score: p.score,
    ready: p.ready,
    cardsCount: p.cards?.length || 0,
    hasSubmitted: Boolean(p.submittedSets),
  }));

  const payload = JSON.stringify({
    type,
    roomCode: room.code,
    gameType: room.gameType,
    status: room.status,
    roundNumber: room.roundNumber,
    bootAmount: room.bootAmount,
    totalPot: room.totalPot,
    isFriendOnly: room.isFriendOnly,
    hostId: hostPlayer?.id,
    hostName: hostPlayer?.name || 'Host',
    players: publicPlayers,
    ...extra,
  });

  room.players.forEach(p => {
    if (p.ws && p.ws.readyState === WebSocket.OPEN) {
      p.ws.send(payload);
    }
  });
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ noServer: true });
  const noopWss = new WebSocketServer({
    noServer: true,
    handleProtocols: protocols => {
      // Echo back requested protocol (e.g. 'vite-hmr') so browser handshake succeeds cleanly
      const p = Array.from(protocols)[0];
      return p || false;
    },
  });

  noopWss.on('connection', ws => {
    // Keep open silently and send connected event so Vite client never errors
    try {
      ws.send(JSON.stringify({ type: 'connected' }));
    } catch {
      // ignore
    }
    ws.on('message', () => {});
    const interval = setInterval(() => {
      if (ws.readyState === ws.OPEN) {
        ws.ping();
      } else {
        clearInterval(interval);
      }
    }, 25000);
    ws.on('close', () => clearInterval(interval));
  });

  server.on('upgrade', (request, socket, head) => {
    const url = request.url || '';
    if (url.startsWith('/api/ws')) {
      wss.handleUpgrade(request, socket, head, ws => {
        wss.emit('connection', ws, request);
      });
    } else {
      // Gracefully complete handshake for Vite or client dev connections
      noopWss.handleUpgrade(request, socket, head, ws => {
        noopWss.emit('connection', ws, request);
      });
    }
  });

  const isProd = process.env.NODE_ENV === 'production';
  const port = process.env.PORT || 3000;

  // REST endpoints for room health or quick join verification
  // REST endpoints for room health or quick join verification
  app.get('/api/rooms/:code', (req, res) => {
    const room = rooms.get(req.params.code.toUpperCase());
    if (!room) {
      return res.status(404).json({ error: 'Table not found' });
    }
    const host = room.players.find(p => p.isHost);
    return res.json({
      code: room.code,
      gameType: room.gameType,
      bootAmount: room.bootAmount || 500,
      totalPot: room.totalPot || 500,
      hostName: host ? host.name : 'Host',
      playersCount: room.players.length,
      players: room.players.map(p => ({ id: p.id, name: p.name, isHost: p.isHost })),
      isFriendOnly: room.isFriendOnly ?? true,
      status: room.status,
    });
  });

  // WebSocket connection handler
  wss.on('connection', ws => {
    let currentRoomCode: string | null = null;
    let playerId: string | null = null;

    ws.on('message', data => {
      try {
        const msg = JSON.parse(data.toString());

        switch (msg.type) {
          case 'CREATE_ROOM': {
            const code = generateRoomCode();
            currentRoomCode = code;
            playerId = `p_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            const bootAmount = Math.max(100, Number(msg.bootAmount) || 500);
            const isFriendOnly = msg.isFriendOnly !== false;

            const hostPlayer: ConnectedPlayer = {
              id: playerId,
              name: msg.playerName || 'Player 1',
              ws,
              isHost: true,
              isBot: false,
              score: 0,
              ready: true,
              cards: [],
            };

            const room: ServerRoom = {
              code,
              gameType: msg.gameType || 'hazari',
              status: 'LOBBY',
              roundNumber: 1,
              bootAmount,
              totalPot: bootAmount, // Host initial contribution
              isFriendOnly,
              players: [hostPlayer],
            };

            rooms.set(code, room);

            ws.send(
              JSON.stringify({
                type: 'ROOM_CREATED',
                roomCode: code,
                playerId,
                isHost: true,
                bootAmount: room.bootAmount,
                totalPot: room.totalPot,
                isFriendOnly: room.isFriendOnly,
              })
            );

            broadcastRoom(room, 'ROOM_UPDATED');
            break;
          }

          case 'JOIN_ROOM': {
            const code = (msg.roomCode || '').toUpperCase();
            const room = rooms.get(code);

            if (!room) {
              ws.send(JSON.stringify({ type: 'ERROR', message: `Table #${code} not found! Please check the Table ID.` }));
              return;
            }

            if (room.status !== 'LOBBY') {
              ws.send(JSON.stringify({ type: 'ERROR', message: `Match at Table #${code} is already in progress.` }));
              return;
            }

            if (room.players.length >= 4) {
              ws.send(JSON.stringify({ type: 'ERROR', message: `Table #${code} is full (maximum 4 players).` }));
              return;
            }

            currentRoomCode = code;
            playerId = `p_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

            const newPlayer: ConnectedPlayer = {
              id: playerId,
              name: msg.playerName || `Friend ${room.players.length + 1}`,
              ws,
              isHost: false,
              isBot: false,
              score: 0,
              ready: true,
              cards: [],
            };

            room.players.push(newPlayer);
            room.totalPot += room.bootAmount; // Friend chips in their boot coins!

            ws.send(
              JSON.stringify({
                type: 'ROOM_JOINED',
                roomCode: code,
                playerId,
                isHost: false,
                bootAmount: room.bootAmount,
                totalPot: room.totalPot,
                isFriendOnly: room.isFriendOnly,
              })
            );

            broadcastRoom(room, 'ROOM_UPDATED');
            break;
          }

          case 'START_GAME': {
            if (!currentRoomCode) return;
            const room = rooms.get(currentRoomCode);
            if (!room) return;

            // RULE: Only the Table Host can start the match
            const requestingPlayer = room.players.find(p => p.id === playerId);
            if (!requestingPlayer || !requestingPlayer.isHost) {
              ws.send(JSON.stringify({ type: 'ERROR', message: 'Only the Table Host can start the match!' }));
              return;
            }

            // In friend-only mode, exactly 4 original real human players are mandatory!
            if (room.isFriendOnly) {
              if (room.players.length < 4) {
                ws.send(
                  JSON.stringify({
                    type: 'ERROR',
                    message: `Mandatory 4 real human players required to start match! Currently ${room.players.length}/4 joined.`,
                  })
                );
                return;
              }
            } else {
              // Solo practice mode: Fill empty seats with smart AI bots up to 4 players
              let botNameIdx = 0;
              while (room.players.length < 4) {
                const bName = HAZARI_AI_NAMES[botNameIdx % HAZARI_AI_NAMES.length];
                room.players.push({
                  id: `bot_${Date.now()}_${botNameIdx}`,
                  name: `${bName} (Bot)`,
                  isHost: false,
                  isBot: true,
                  score: 0,
                  ready: true,
                  cards: [],
                });
                room.totalPot += room.bootAmount;
                botNameIdx++;
              }
            }

            // Deal 13 cards each for the active players
            const hands = dealHandsForPlayers(room.players.length);

            room.players.forEach((p, idx) => {
              p.cards = hands[idx] || [];
              p.submittedSets = undefined;

              if (p.isBot) {
                p.submittedSets = autoArrangeHazariHand(p.cards);
              }

              if (p.ws && p.ws.readyState === WebSocket.OPEN) {
                p.ws.send(
                  JSON.stringify({
                    type: 'HAND_DEALT',
                    cards: p.cards,
                    roundNumber: room.roundNumber,
                    totalPot: room.totalPot,
                    bootAmount: room.bootAmount,
                  })
                );
              }
            });

            room.status = 'ARRANGING';
            broadcastRoom(room, 'GAME_STARTED', {
              message: `Game Started! Pot: ${room.totalPot} Coins. Arrange your 4 sets.`,
              totalPot: room.totalPot,
            });
            break;
          }

          case 'SUBMIT_HAZARI_SETS': {
            if (!currentRoomCode || !playerId) return;
            const room = rooms.get(currentRoomCode);
            if (!room) return;

            const player = room.players.find(p => p.id === playerId);
            if (!player) return;

            player.submittedSets = msg.sets; // [set1, set2, set3, set4]

            broadcastRoom(room, 'PLAYER_SUBMITTED', {
              playerId: player.id,
              playerName: player.name,
            });

            // Check if all active players have submitted
            const allSubmitted = room.players.every(p => Boolean(p.submittedSets));
            if (allSubmitted) {
              resolveHazariTricks(room);
            }
            break;
          }

          case 'NEXT_ROUND': {
            if (!currentRoomCode) return;
            const room = rooms.get(currentRoomCode);
            if (!room) return;

            // Only host can advance round
            const requestingPlayer = room.players.find(p => p.id === playerId);
            if (!requestingPlayer || !requestingPlayer.isHost) {
              ws.send(JSON.stringify({ type: 'ERROR', message: 'Sirf Table Host round aage badha sakta hai!' }));
              return;
            }

            room.roundNumber += 1;
            const hands = dealHandsForPlayers(room.players.length);

            room.players.forEach((p, idx) => {
              p.cards = hands[idx] || [];
              p.submittedSets = undefined;

              if (p.isBot) {
                p.submittedSets = autoArrangeHazariHand(p.cards);
              }

              if (p.ws && p.ws.readyState === WebSocket.OPEN) {
                p.ws.send(
                  JSON.stringify({
                    type: 'HAND_DEALT',
                    cards: p.cards,
                    roundNumber: room.roundNumber,
                    totalPot: room.totalPot,
                    bootAmount: room.bootAmount,
                  })
                );
              }
            });

            room.status = 'ARRANGING';
            broadcastRoom(room, 'ROUND_STARTED', { roundNumber: room.roundNumber, totalPot: room.totalPot });
            break;
          }
        }
      } catch (err) {
        console.error('WS Error:', err);
      }
    });

    ws.on('close', () => {
      if (currentRoomCode && playerId) {
        const room = rooms.get(currentRoomCode);
        if (room) {
          const idx = room.players.findIndex(p => p.id === playerId);
          if (idx !== -1) {
            // If host left and others remain, pass host
            const wasHost = room.players[idx].isHost;
            room.players.splice(idx, 1);
            if (room.players.length > 0) {
              if (wasHost) {
                const nextHuman = room.players.find(p => !p.isBot) || room.players[0];
                nextHuman.isHost = true;
              }
              broadcastRoom(room, 'PLAYER_LEFT', { leftPlayerId: playerId });
            } else {
              rooms.delete(currentRoomCode);
            }
          }
        }
      }
    });
  });

  function resolveHazariTricks(room: ServerRoom) {
    room.status = 'PLAYING_TRICKS';

    const tricks: HazariTrickResult[] = [];
    const scoresAdded: Record<string, number> = {};
    room.players.forEach(p => (scoresAdded[p.id] = 0));

    // Evaluate all 4 tricks (Set 0, 1, 2, 3)
    for (let tIdx = 0; tIdx < 4; tIdx++) {
      let winningPlayer = room.players[0];
      let winningSet = evaluateHazariSet(room.players[0].submittedSets![tIdx]);
      let totalTrickPoints = winningSet.totalPoints;

      const allSets = [
        {
          playerId: room.players[0].id,
          playerName: room.players[0].name,
          set: winningSet,
        },
      ];

      for (let pIdx = 1; pIdx < room.players.length; pIdx++) {
        const p = room.players[pIdx];
        const evaluated = evaluateHazariSet(p.submittedSets![tIdx]);
        totalTrickPoints += evaluated.totalPoints;

        allSets.push({
          playerId: p.id,
          playerName: p.name,
          set: evaluated,
        });

        if (compareHazariSets(evaluated, winningSet) > 0) {
          winningSet = evaluated;
          winningPlayer = p;
        }
      }

      winningPlayer.score += totalTrickPoints;
      scoresAdded[winningPlayer.id] += totalTrickPoints;

      tricks.push({
        trickIndex: tIdx,
        winnerPlayerId: winningPlayer.id,
        winnerPlayerName: winningPlayer.name,
        winningSet,
        allSets,
        pointsWon: totalTrickPoints,
      });
    }

    const totalScores: Record<string, number> = {};
    let isMatchOver = false;
    let matchWinnerId: string | undefined;

    // Determine highest scorer and check if anyone crossed 1000 or won
    let highestScorer = room.players[0];
    room.players.forEach(p => {
      totalScores[p.id] = p.score;
      if (p.score > highestScorer.score) {
        highestScorer = p;
      }
      if (p.score >= 1000) {
        isMatchOver = true;
        matchWinnerId = p.id;
      }
    });

    if (isMatchOver && !matchWinnerId) {
      matchWinnerId = highestScorer.id;
    }

    const winnerName = room.players.find(p => p.id === matchWinnerId)?.name || highestScorer.name;

    const summary: HazariRoundSummary = {
      roundNumber: room.roundNumber,
      tricks,
      scoresAdded,
      totalScores,
      isMatchOver,
      matchWinnerId,
      potCoinsWon: isMatchOver ? room.totalPot : undefined,
    };

    room.lastRoundSummary = summary;
    room.status = isMatchOver ? 'MATCH_OVER' : 'ROUND_SUMMARY';

    broadcastRoom(room, 'ROUND_RESOLVED', {
      summary,
      potCoinsWon: isMatchOver ? room.totalPot : 0,
      matchWinnerId,
      matchWinnerName: winnerName,
    });
  }

  // Vite middleware in dev or static files in prod
  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(port, () => {
    console.log(`Server running on port ${port} (mode: ${isProd ? 'production' : 'development'})`);
  });
}

startServer();
