import React, { useState, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/authcontext";
import { getSocket } from "../socket";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeMatchId, setActiveMatchId] = useState(null);
  const [activeMatchRunning, setActiveMatchRunning] = useState(false);

  const [showExitModal, setShowExitModal] = useState(false);
  const [pendingPath, setPendingPath] = useState(null);
  const [modalBusy, setModalBusy] = useState(false);

  // -------------------------
  // Helpers
  // -------------------------
  const looksLikeDuelPath = useCallback(
    (pathname = location.pathname) =>
      typeof pathname === "string" && pathname.startsWith("/duel/room/"),
    [location.pathname]
  );

  const extractMatchIdFromPath = useCallback(
    (pathname = location.pathname) => {
      if (!looksLikeDuelPath(pathname)) return null;
      const parts = pathname.split("/");
      return parts[parts.length - 1] || null;
    },
    [looksLikeDuelPath, location.pathname]
  );

  // -------------------------
  // Duel lifecycle sync
  // -------------------------
  useEffect(() => {
    function onDuelStarted(e) {
      const id = e?.detail?.matchId || extractMatchIdFromPath();
      if (id) {
        setActiveMatchId(id);
        setActiveMatchRunning(true);
      }
    }

    function onDuelEnded() {
      setActiveMatchId(null);
      setActiveMatchRunning(false);
    }

    window.addEventListener("duel:started", onDuelStarted);
    window.addEventListener("duel:ended", onDuelEnded);

    // Conservative init if reloaded mid-duel
    const id = extractMatchIdFromPath();
    if (id) {
      setActiveMatchId(id);
      setActiveMatchRunning(true);
    }

    return () => {
      window.removeEventListener("duel:started", onDuelStarted);
      window.removeEventListener("duel:ended", onDuelEnded);
    };
  }, [extractMatchIdFromPath]);

  // -------------------------
  // Navigation guard
  // -------------------------
  function handleNavClick(e, to) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();

    const currentMatchId = extractMatchIdFromPath();

    if (
      looksLikeDuelPath() &&
      activeMatchRunning &&
      activeMatchId &&
      String(activeMatchId) === String(currentMatchId)
    ) {
      setPendingPath(to);
      setShowExitModal(true);
      return;
    }

    navigate(to);
  }

  function handleLogoutClick() {
    const currentMatchId = extractMatchIdFromPath();

    if (
      currentMatchId &&
      activeMatchRunning &&
      String(activeMatchId) === String(currentMatchId)
    ) {
      setPendingPath("/");
      setShowExitModal(true);
      return;
    }

    logout();
    navigate("/");
  }

  // -------------------------
  // Forfeit confirmation
  // -------------------------
  async function confirmForfeitAndNavigate() {
    setModalBusy(true);

    const matchId = activeMatchId || extractMatchIdFromPath();

    try {
      const socket = getSocket();
      if (socket?.connected && matchId) {
        socket.emit("duel:forfeit", {
          matchKey: matchId,
          matchId,
          userId: user?.id,
        });
      }
    } finally {
      setActiveMatchRunning(false);
      setActiveMatchId(null);
      setModalBusy(false);
      setShowExitModal(false);
      navigate(pendingPath || "/", { replace: true });
      setPendingPath(null);
    }
  }

  function cancelForfeit() {
    setShowExitModal(false);
    setPendingPath(null);
  }

  // -------------------------
  // Modal
  // -------------------------
  function ExitForfeitModal() {
    if (!showExitModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black/40"
          onClick={() => !modalBusy && cancelForfeit()}
        />
        <div className="bg-white rounded-lg p-6 z-50 w-full max-w-md shadow-lg">
          <h3 className="text-lg font-semibold mb-2">Leave match?</h3>
          <p className="text-sm text-gray-700 mb-4">
            You are in an active duel. Leaving now will forfeit the match and you
            will lose.
          </p>

          <div className="flex justify-end gap-2">
            <button
              onClick={cancelForfeit}
              disabled={modalBusy}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>
            <button
              onClick={confirmForfeitAndNavigate}
              disabled={modalBusy}
              className="px-4 py-2 bg-red-600 text-white rounded"
            >
              {modalBusy ? "Leaving…" : "Yes, leave & forfeit"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------
  // Render
  // -------------------------
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/" onClick={(e) => handleNavClick(e, "/")}>
            <div className="text-2xl font-bold">ISL</div>
            <div className="text-sm text-gray-600">Learning Platform</div>
          </a>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="/courses"
            onClick={(e) => handleNavClick(e, "/courses")}
            className="text-sm text-gray-700 hover:underline"
          >
            Courses
          </a>

          <a
            href="/duel/lobby"
            onClick={(e) => handleNavClick(e, "/duel/lobby")}
            className="text-sm text-gray-700 hover:underline"
          >
            Duel Lobby
          </a>

          {user ? (
            <>
              <div className="text-sm text-gray-700">
                Hello, <span className="font-medium">{user.name}</span>
              </div>
              <button
                onClick={handleLogoutClick}
                className="px-3 py-2 bg-red-50 text-red-700 rounded hover:bg-red-100"
              >
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
