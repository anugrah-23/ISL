// frontend/src/duelExit.js
import { getSocket } from './socket';

/**
 * Emit a forfeit event for the match. Does NOT navigate.
 */
export function forfeitMatch(matchId, userId) {
  try {
    const sock = getSocket();
    if (sock && sock.connected) {
      sock.emit('duel:forfeit', { matchKey: matchId, matchId, userId });
    } else {
      console.warn('forfeitMatch: socket not connected; server may detect disconnect.');
    }
  } catch (e) {
    console.warn('forfeitMatch error', e);
  }
}

/**
 * Extract active matchId from the current URL pathname.
 * Example matches:
 *   /duel/room/m_12345
 *   /duel/room/q_98432
 */
export function getActiveMatchId(pathname) {
  if (!pathname) return null;

  const parts = pathname.split('/');
  // find the segment after `/duel/room`
  const roomIndex = parts.indexOf('room');
  if (roomIndex >= 0 && parts[roomIndex + 1]) {
    return parts[roomIndex + 1];
  }
  return null;
}
