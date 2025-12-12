// frontend/src/components/BattleLobby.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

/**
 * BattleLobby
 * - Lists recent battle rooms
 * - Allows creating a new room
 * - Simple search & refresh
 */
export default function BattleLobby() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/battles/lobby');
      setRooms(res.data.rooms || []);
    } catch (err) {
      console.error('Failed to load lobby', err);
      setError(err?.response?.data?.message || 'Failed to load rooms');
    } finally {
      setLoading(false);
    }
  }

  async function createRoom() {
    try {
      const res = await axios.post('/api/battles/create', { type: '1v1', meta: {} });
      if (res?.data?.room?.room_key) {
        navigate(`/battle/${res.data.room.room_key}`);
      } else if (res?.data?.room) {
        // fallback
        navigate(`/battle/${res.data.room.room_key || res.data.room.id}`);
      } else {
        load();
      }
    } catch (err) {
      console.error('createRoom error', err);
      setError(err?.response?.data?.message || 'Failed to create room');
    }
  }

  function join(roomKey) {
    navigate(`/battle/${roomKey}`);
  }

  const filtered = rooms.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return String(r.room_key || '').toLowerCase().includes(s) ||
           String(r.type || '').toLowerCase().includes(s) ||
           JSON.stringify(r.meta || {}).toLowerCase().includes(s);
  });

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Battle Lobby</h3>
          <div className="text-sm text-gray-500">Join live competitions or start a new room.</div>
        </div>

        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rooms..."
            className="px-3 py-2 border rounded"
          />
          <button onClick={load} className="px-3 py-2 bg-gray-100 rounded border">Refresh</button>
          <button onClick={createRoom} className="px-3 py-2 bg-green-600 text-white rounded">Create Room</button>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-gray-600">Loading rooms…</div>
      ) : error ? (
        <div className="p-3 bg-red-50 text-red-700 rounded">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-gray-500 p-3">No rooms found.</div>
      ) : (
        <ul className="space-y-3">
          {filtered.map(r => (
            <li key={r.room_key} className="p-3 border rounded flex items-center justify-between">
              <div>
                <div className="font-medium">{r.room_key}</div>
                <div className="text-xs text-gray-500">{r.type} • {r.createdat ? new Date(r.createdat).toLocaleString() : ''}</div>
                {r.meta && Object.keys(r.meta).length > 0 && <div className="text-xs text-gray-400 truncate mt-1">{JSON.stringify(r.meta)}</div>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => join(r.room_key)} className="px-3 py-1 bg-blue-600 text-white rounded">Join</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
