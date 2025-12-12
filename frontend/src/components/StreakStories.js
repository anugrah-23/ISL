// frontend/src/components/StreakStories.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function StreakStories({ userId }) {
  const [story, setStory] = useState(null);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    async function load() {
      const s = await axios.get('/api/stories/default');
      setStory(s.data);
      const p = await axios.get(`/api/stories/users/${userId}/default`);
      setProgress(p.data);
    }
    if (userId) load();
  }, [userId]);

  async function practice() {
    // find next frame index
    const unlocked = progress?.unlocked_frames_bitmask || [];
    let next = unlocked.findIndex(v => !v);
    if (next === -1) next = unlocked.length;
    const res = await axios.post(`/api/stories/users/${userId}/unlock`, { storyId: 'default', frameIndex: next });
    setProgress(res.data.progress);
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Streak Stories</h3>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
        {story?.frames?.map(f => {
          const unlocked = progress?.unlocked_frames_bitmask?.[f.index];
          return (
            <div key={f.index} style={{ width: 140, height: 140, borderRadius: 8, overflow: 'hidden', border: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center', background: unlocked ? '#fff' : '#f3f4f6', opacity: unlocked ? 1 : 0.5 }}>
              <div style={{ padding: 8, textAlign: 'center' }}>{f.caption}</div>
            </div>
          );
        })}
        <div style={{ width: 140, height: 140, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
          <button onClick={practice} className="px-3 py-2 bg-blue-600 text-white rounded">Practice Now</button>
        </div>
      </div>
      <div className="mt-2">Current streak: {progress?.current_streak || 0}</div>
    </div>
  );
}
