/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Friend {
  id: string;
  name: string;
  status: 'online' | 'in_game' | 'offline';
  addedAt: number;
}

const FRIENDS_KEY = 'solis_friends_v1';
const MY_FRIEND_ID_KEY = 'solis_my_friend_id';

export function getMyFriendId(): string {
  try {
    let id = localStorage.getItem(MY_FRIEND_ID_KEY);
    if (!id) {
      const randNum = Math.floor(1000 + Math.random() * 9000);
      id = `PLAYER#${randNum}`;
      localStorage.setItem(MY_FRIEND_ID_KEY, id);
    }
    return id;
  } catch {
    return 'PLAYER#1001';
  }
}

export function getFriends(): Friend[] {
  try {
    const raw = localStorage.getItem(FRIENDS_KEY);
    if (!raw) {
      // Default sample friends to demonstrate functionality
      const defaultFriends: Friend[] = [
        { id: 'PLAYER#4821', name: 'Vikram Cards', status: 'online', addedAt: Date.now() - 86400000 * 2 },
        { id: 'PLAYER#9032', name: 'Aman Hazari', status: 'in_game', addedAt: Date.now() - 86400000 * 5 },
        { id: 'PLAYER#1104', name: 'Rohan_Pro', status: 'offline', addedAt: Date.now() - 86400000 * 10 },
      ];
      localStorage.setItem(FRIENDS_KEY, JSON.stringify(defaultFriends));
      return defaultFriends;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addFriend(name: string, friendId?: string): Friend[] {
  const current = getFriends();
  const trimmedName = name.trim();
  if (!trimmedName) return current;

  const newId = friendId?.trim().toUpperCase() || `PLAYER#${Math.floor(1000 + Math.random() * 9000)}`;
  
  // Prevent duplicate ID or duplicate name
  if (current.some(f => f.id === newId || f.name.toLowerCase() === trimmedName.toLowerCase())) {
    return current;
  }

  const newFriend: Friend = {
    id: newId,
    name: trimmedName,
    status: Math.random() > 0.5 ? 'online' : 'in_game',
    addedAt: Date.now(),
  };

  const updated = [newFriend, ...current];
  try {
    localStorage.setItem(FRIENDS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('solis_friends_updated'));
  } catch (e) {
    console.warn('Failed to save friends:', e);
  }
  return updated;
}

export function removeFriend(id: string): Friend[] {
  const current = getFriends();
  const updated = current.filter(f => f.id !== id);
  try {
    localStorage.setItem(FRIENDS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('solis_friends_updated'));
  } catch (e) {
    console.warn('Failed to remove friend:', e);
  }
  return updated;
}
