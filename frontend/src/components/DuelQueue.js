// frontend/src/components/DuelQueue.js
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getSocket } from '../socket';

export default function DuelQueue() {
  const { queueId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [entry, setEntry] = useState(null);
  const [polling, setPolling] = useState(true);
  const socketRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    const socket = getSocket();
    socketRef.current = socket;

    // Ensure socket is connected before subscribing
    const subscribe = async () => {
      if (!socket.connected) {
        await new Promise((resolve) => {
          const onConnect = () => { socket.off('connect', onConnect); clearTimeout(timer); resolve(); };
          const timer = setTimeout(() => { socket.off('connect', onConnect); resolve(); }, 1500);
          socket.on('connect', onConnect);
        });
      }
      try {
        socket.emit('queue:subscribe', { queueId });
        console.debug('[queue] emitted queue:subscribe', queueId);
      } catch (err) {
        console.warn('[queue] queue:subscribe emit failed', err);
      }
    };
    subscribe();

    // Listen for matched events from server
    const onMatched = (payload) => {
      console.log('[client] matched', payload);
      if (!payload) return;
      // server may include matchKey; use it
      const mk = payload.matchKey || payload.matchId || payload.match_key;
      if (mk) {
        navigate(`/duel/room/${encodeURIComponent(mk)}`, { replace: true });
      } else {
        // fallback to queueId
        navigate(`/duel/room/${encodeURIComponent(queueId)}`, { replace: true });
      }
    };
    socket.on('matched', onMatched);

    async function checkStatus() {
      try {
        const res = await axios.get(`/api/duel/${encodeURIComponent(queueId)}/status`);
        if (!mounted) return;
        setStatus(res.data.status);
        setEntry(res.data.entry || res.data);

        if (res.data.status === 'matched') {
          const mk = res.data.matchKey || res.data.match?.matchKey || res.data.matchId || queueId;
          navigate(`/duel/room/${encodeURIComponent(mk)}`, { replace: true });
        }
      } catch (err) {
        console.warn('status check failed', err);
      }
    }

    // initial check + polling fallback
    checkStatus();
    const intv = setInterval(() => {
      if (polling) checkStatus();
    }, 3000);

    return () => {
      mounted = false;
      clearInterval(intv);
      try {
        socket.off('matched', onMatched);
        socket.emit('queue:unsubscribe', { queueId });
      } catch (e) {
        // ignore errors on cleanup
      }
    };
  }, [queueId, navigate, polling]);

  async function cancel() {
    try {
      await axios.post(`/api/duel/${encodeURIComponent(queueId)}/cancel`);
      setPolling(false);
      setStatus('cancelled');
      try {
        const socket = socketRef.current || getSocket();
        socket.emit('queue:unsubscribe', { queueId });
      } catch (err) {
        console.warn('socket unsubscribe failed', err);
      }
    } catch (err) {
      alert('Failed to cancel');
    }
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white p-6 rounded shadow">
          <h3 className="text-lg font-semibold mb-2">Queue: {queueId}</h3>
          <div className="text-sm text-gray-600 mb-4">Status: <span className="font-medium">{status || 'checking…'}</span></div>

          {(status === 'queued' || !status) && (
            <div className="mb-4 p-4 rounded bg-yellow-50 text-yellow-900">
              <strong>Waiting for opponent…</strong>
              <div className="text-xs text-gray-600 mt-1">We will redirect you automatically when a match is found.</div>
            </div>
          )}

          <div className="mb-4">
            <div className="text-sm text-gray-500">Queue entry</div>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">{JSON.stringify(entry, null, 2)}</pre>
          </div>

          <div className="flex gap-3">
            <button onClick={cancel} className="px-4 py-2 border rounded">Cancel</button>
            <button onClick={() => navigate('/duel/lobby')} className="px-4 py-2 bg-gray-100 rounded">Back</button>
          </div>
        </div>
      </div>
    </div>
  );
}