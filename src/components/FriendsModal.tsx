/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Copy,
  Check,
  X,
  Trash2,
  Share2,
  Play,
  Crown,
  Search,
} from 'lucide-react';
import {
  Friend,
  getFriends,
  getMyFriendId,
  addFriend,
  removeFriend,
} from '../utils/friendsStorage';

interface FriendsModalProps {
  isOpen: boolean;
  playerName: string;
  onClose: () => void;
  onCreateTableForFriend?: (friendName: string) => void;
}

export const FriendsModal: React.FC<FriendsModalProps> = ({
  isOpen,
  playerName,
  onClose,
  onCreateTableForFriend,
}) => {
  const [friendsList, setFriendsList] = useState<Friend[]>(() => getFriends());
  const [myId] = useState<string>(() => getMyFriendId());
  const [copiedId, setCopiedId] = useState<boolean>(false);

  const [newFriendName, setNewFriendName] = useState<string>('');
  const [newFriendIdInput, setNewFriendIdInput] = useState<string>('');
  const [addNotice, setAddNotice] = useState<string | null>(null);

  const [searchFilter, setSearchFilter] = useState<string>('');

  useEffect(() => {
    const reload = () => setFriendsList(getFriends());
    window.addEventListener('solis_friends_updated', reload);
    return () => window.removeEventListener('solis_friends_updated', reload);
  }, []);

  if (!isOpen) return null;

  const handleCopyMyId = () => {
    navigator.clipboard.writeText(`${playerName} (${myId})`);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleAddFriendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFriendName.trim()) {
      setAddNotice('Please enter friend name');
      return;
    }

    const updated = addFriend(newFriendName, newFriendIdInput);
    setFriendsList(updated);
    setNewFriendName('');
    setNewFriendIdInput('');
    setAddNotice('Friend added successfully!');
    setTimeout(() => setAddNotice(null), 3000);
  };

  const handleRemoveFriend = (id: string, name: string) => {
    const updated = removeFriend(id);
    setFriendsList(updated);
    setAddNotice(`Removed ${name} from friends list.`);
    setTimeout(() => setAddNotice(null), 2500);
  };

  const filteredFriends = friendsList.filter(f =>
    f.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    f.id.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-gradient-to-b from-[#0e2a1c] via-[#0a1e13] to-[#07150d] border border-emerald-600/40 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-900/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-base sm:text-lg font-black text-white">
                Friends & Multiplayer Buddies
              </h2>
              <p className="text-[11px] text-emerald-300/80">
                Manage your friends list and invite them directly to card tables
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* My Player ID & Invite Card */}
        <div className="mt-4 p-3.5 rounded-2xl bg-black/50 border border-emerald-700/50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">👑</span>
            <div>
              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                My Player Profile
              </div>
              <div className="text-xs font-black text-white">
                {playerName} <span className="text-emerald-400 font-mono text-[11px]">({myId})</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleCopyMyId}
            className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 shadow-md"
          >
            {copiedId ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedId ? 'ID Copied!' : 'Copy My Player ID'}</span>
          </button>
        </div>

        {/* Add Friend Form */}
        <form
          onSubmit={handleAddFriendSubmit}
          className="mt-3 p-3 rounded-2xl bg-[#091b12] border border-amber-500/30 flex flex-col gap-2 shrink-0"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wide flex items-center gap-1">
              <UserPlus className="w-3.5 h-3.5" /> Add New Friend
            </span>
            {addNotice && (
              <span className="text-[11px] font-semibold text-emerald-300 animate-in fade-in">
                {addNotice}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              value={newFriendName}
              onChange={e => setNewFriendName(e.target.value)}
              placeholder="Friend's Display Name"
              className="px-3 py-2 rounded-xl bg-black/60 border border-emerald-800/60 text-xs text-white placeholder:text-slate-500 font-bold outline-none focus:border-amber-400"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={newFriendIdInput}
                onChange={e => setNewFriendIdInput(e.target.value.toUpperCase())}
                placeholder="ID (Optional, e.g. PLAYER#1234)"
                className="flex-1 px-3 py-2 rounded-xl bg-black/60 border border-emerald-800/60 text-xs text-white placeholder:text-slate-500 font-mono outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0 transition-transform active:scale-95"
              >
                Add
              </button>
            </div>
          </div>
        </form>

        {/* Filter and Friend List */}
        <div className="mt-4 flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-emerald-200">
              Saved Friends ({friendsList.length})
            </span>

            <div className="relative">
              <input
                type="text"
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                placeholder="Search friend..."
                className="pl-7 pr-3 py-1 rounded-xl bg-black/40 border border-emerald-900 text-xs text-white placeholder:text-slate-500 outline-none w-36"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {filteredFriends.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-emerald-900/60 rounded-2xl">
                No friends found. Add your friends above using their display name!
              </div>
            ) : (
              filteredFriends.map(friend => {
                const isOnline = friend.status === 'online';
                const isInGame = friend.status === 'in_game';

                return (
                  <div
                    key={friend.id}
                    className="p-3 rounded-2xl bg-black/40 border border-emerald-900/60 hover:border-emerald-700/60 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800/80 flex items-center justify-center font-bold text-amber-300 text-sm">
                          {friend.name.charAt(0).toUpperCase()}
                        </div>
                        {/* Status Dot */}
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0a1e13] ${
                            isOnline ? 'bg-emerald-400' : isInGame ? 'bg-amber-400' : 'bg-slate-500'
                          }`}
                          title={friend.status}
                        />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white">{friend.name}</span>
                          <span className="font-mono text-[10px] text-emerald-400/80">{friend.id}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Status:{' '}
                          <span
                            className={
                              isOnline
                                ? 'text-emerald-300 font-semibold'
                                : isInGame
                                ? 'text-amber-300 font-semibold'
                                : 'text-slate-400'
                            }
                          >
                            {isOnline ? 'Online' : isInGame ? 'Playing Hazari' : 'Offline'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {onCreateTableForFriend && (
                        <button
                          onClick={() => {
                            onClose();
                            onCreateTableForFriend(friend.name);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-transform active:scale-95 shadow-sm"
                          title="Create Table for Friend"
                        >
                          <Crown className="w-3.5 h-3.5" />
                          <span>Invite</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleRemoveFriend(friend.id, friend.name)}
                        className="p-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 transition-colors"
                        title="Remove Friend"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
