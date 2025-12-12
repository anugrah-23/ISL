// frontend/src/components/navbar.js
import React, { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { getSocket } from '../socket';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // track whether there's an *active* duel for the current match id
  const [activeMatchId, setActiveMatchId] = useState(null);
  const [activeMatchRunning, setActiveMatchRunning] = useState(false);

  const [showExitModal, setShowExitModal] = useState(false);
  const [pendingPath, setPendingPath] = useState(null);
  const [modalBusy, setModalBusy] = useState(false);

  // helper to test whether route looks like duel room
  const looksLikeDuelPath = useCallback((pathname = location.pathname) => {
    return typeof pathname === 'string' && pathname.startsWith('/duel/room/');
  }, [location.pathname]);

  function extractMatchIdFromPath(pathname = location.pathname) {
    if (!looksLikeDuelPath(pathname)) return null;
    const parts = pathname.split('/');
    return parts[parts.length - 1] || null;
  }

  // Listen for DuelRoom lifecycle events
  useEffect(() => {
    function onDuelStarted(e) {
      const id = e?.detail?.matchId || extractMatchIdFromPath();
      if (id) {
        setActiveMatchId(id);
        setActiveMatchRunning(true);
      }
    }
    function onDuelEnded(e) {
      const id = e?.detail?.matchId || extractMatchIdFromPath();
      if (id) {
        setActiveMatchId(id);
        setActiveMatchRunning(false);
      } else {
        // no id: clear running state
        setActiveMatchRunning(false);
        setActiveMatchId(null);
      }
    }

    window.addEventListener('duel:started', onDuelStarted);
    window.addEventListener('duel:ended', onDuelEnded);

    // also, on initial load if you're on duel page and no events fired yet,
    // treat it conservatively: if URL has match id assume running true,
    // but DuelRoom will soon emit duel:started or duel:ended to correct it.
    const maybeId = extractMatchIdFromPath();
    if (maybeId) {
      // assume running until DuelRoom corrects it
      setActiveMatchId(maybeId);
      setActiveMatchRunning(true);
    }

    return () => {
      window.removeEventListener('duel:started', onDuelStarted);
      window.removeEventListener('duel:ended', onDuelEnded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // handle nav clicks: if user is on duel page and that duel is active, prompt
  function handleNavClick(e, to) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();

    // if current path is a duel room & the duel is still running -> ask confirm forfeit
    const currentMatchId = extractMatchIdFromPath();
    const isDuelPath = looksLikeDuelPath();

    // Only prompt if the duel for current match id is actively running
    if (isDuelPath && activeMatchRunning && activeMatchId && String(activeMatchId) === String(currentMatchId)) {
      setPendingPath(to);
      setShowExitModal(true);
      return;
    }

    // otherwise navigate immediately
    navigate(to);
  }

  // Logout click: similar logic
  function handleLogoutClick() {
    const currentMatchId = extractMatchIdFromPath();
    if (currentMatchId && activeMatchRunning && String(activeMatchId) === String(currentMatchId)) {
      setPendingPath('/');
      setShowExitModal(true);
      return;
    }
    logout();
    navigate('/');
  }

  // Confirm forfeit: emit to server, then navigate (replace)
  async function confirmForfeitAndNavigate() {
    setModalBusy(true);
    try {
      const matchId = activeMatchId || extractMatchIdFromPath();
      try {
        const socket = getSocket();
        if (socket && socket.connected) {
          socket.emit('duel:forfeit', { matchKey: matchId, matchId, userId: user?.id });
        }
      } catch (emitErr) {
        console.warn('Failed to emit duel:forfeit', emitErr);
      }
      // navigate away
      navigate(pendingPath || '/', { replace: true });
    } finally {
      setModalBusy(false);
      setShowExitModal(false);
      setPendingPath(null);
      // mark duel as not running locally to avoid duplicate prompts
      setActiveMatchRunning(false);
    }
  }

  function cancelForfeit() {
    setShowExitModal(false);
    setPendingPath(null);
  }

  // Modal JSX (self-contained)
  function ExitForfeitModal() {
    if (!showExitModal) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black/40"
          onClick={() => { if (!modalBusy) cancelForfeit(); }}
          aria-hidden="true"
        />
        <div className="bg-white rounded-lg p-6 z-50 w-full max-w-md shadow-lg">
          <h3 className="text-lg font-semibold mb-2">Leave match?</h3>
          <p className="text-sm text-gray-700 mb-4">
            You're currently in an active duel. Leaving now will forfeit the match and you will lose.
            Are you sure you want to leave?
          </p>

          <div className="flex justify-end gap-2">
            <button
              onClick={cancelForfeit}
              disabled={modalBusy}
              className="px-4 py-2 border rounded bg-white"
            >
              Cancel
            </button>
            <button
              onClick={confirmForfeitAndNavigate}
              disabled={modalBusy}
              className="px-4 py-2 bg-red-600 text-white rounded"
            >
              {modalBusy ? 'Leaving…' : 'Yes, leave & forfeit'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <a href="/" onClick={(e) => handleNavClick(e, '/')} className="flex items-center gap-3" aria-label="ISL Learning Home">
            <div className="text-2xl font-bold">ISL</div>
            <div className="text-sm text-gray-600">Learning Platform</div>
          </a>
        </div>

        <div className="flex items-center space-x-4">
          <a href="/courses" onClick={(e) => handleNavClick(e, '/courses')} className="text-sm text-gray-700 hover:underline">
            Courses
          </a>

          <a href="/duel/lobby" onClick={(e) => handleNavClick(e, '/duel/lobby')} className="text-sm text-gray-700 hover:underline">
            Duel Lobby
          </a>

          {user ? (
            <>
              <div className="text-sm text-gray-700">
                Hello, <span className="font-medium">{user.name}</span>
              </div>
              <button onClick={handleLogoutClick} className="px-3 py-2 bg-red-50 text-red-700 rounded-md hover:bg-red-100">
                Logout
              </button>
            </>
          ) : (
            <div className="text-sm text-gray-600">Welcome</div>
          )}
        </div>
      </div>

      <ExitForfeitModal />
    </nav>
  );
}
