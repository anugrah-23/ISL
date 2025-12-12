// frontend/src/components/AchievementGrid.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';

/**
 * AchievementGrid
 * Props:
 *  - userId (optional). If not provided, the component will show achievements but won't indicate which are unlocked.
 *
 * Shows achievements in a 4-column grid. Secret achievements are displayed as "Secret" until the user unlocks them.
 */
export default function AchievementGrid({ userId }) {
  const [achievements, setAchievements] = useState([]);
  const [userAchievements, setUserAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uaLoading, setUaLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all | unlocked | locked | secret
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get('/api/achievements');
        if (!cancelled) setAchievements(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.message || 'Failed to load achievements');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setUaLoading(true);
    axios.get(`/api/users/${userId}/achievements`)
      .then(res => { if (!cancelled) setUserAchievements(Array.isArray(res.data) ? res.data : []); })
      .catch(() => { if (!cancelled) setUserAchievements([]); })
      .finally(() => { if (!cancelled) setUaLoading(false); });
    return () => { cancelled = true; };
  }, [userId]);

  function isUnlocked(ach) {
    return userAchievements.some(u => Number(u.achievement_id) === Number(ach.id));
  }

  function matchesFilter(ach) {
    const unlocked = isUnlocked(ach);
    if (filter === 'all') return true;
    if (filter === 'unlocked') return unlocked;
    if (filter === 'locked') return !unlocked;
    if (filter === 'secret') return ach.secret === true;
    return true;
  }

  const visible = achievements
    .filter(a => matchesFilter(a))
    .filter(a => {
      if (!search) return true;
      const s = search.toLowerCase();
      return String(a.name || '').toLowerCase().includes(s) ||
             String(a.key || '').toLowerCase().includes(s) ||
             String(a.description || '').toLowerCase().includes(s);
    });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Achievements</h3>
          <div className="text-sm text-gray-500">Collect achievements by practicing and completing goals.</div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="search"
            placeholder="Search achievements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          />
          <select value={filter} onChange={e => setFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="all">All</option>
            <option value="unlocked">Unlocked</option>
            <option value="locked">Locked</option>
            <option value="secret">Secret</option>
          </select>
        </div>
      </div>

      {loading || uaLoading ? (
        <div className="p-6 text-sm text-gray-600">Loading…</div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded">{error}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          {visible.length === 0 && <div className="text-sm text-gray-500 p-4">No achievements match.</div>}
          {visible.map(a => {
            const unlocked = isUnlocked(a);
            const reveal = !a.secret || unlocked;
            return (
              <div
                key={a.id}
                className={`p-3 rounded-lg border ${unlocked ? 'bg-white' : 'bg-gray-50'}`}
                title={reveal ? (a.description || '') : 'Secret achievement — unlock to reveal'}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm">
                    {a.secret && !unlocked ? 'Secret' : (a.name || a.key || 'Achievement')}
                  </div>
                  {unlocked && <div className="text-xs text-green-700 font-semibold">Unlocked</div>}
                </div>

                <div className="mt-2 text-xs text-gray-600" style={{ minHeight: 36 }}>
                  {reveal ? (a.description || <span className="italic text-gray-400">No description</span>) : <span className="italic text-gray-400">Hidden until unlocked</span>}
                </div>

                {a.reward && (a.reward.xp || a.reward.badge) && (
                  <div className="mt-3 text-xs text-gray-500">
                    {a.reward.xp ? `${a.reward.xp} XP` : null} {a.reward.badge ? ` • ${a.reward.badge}` : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

AchievementGrid.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
};
