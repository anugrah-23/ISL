// frontend/src/components/ISLCoursePlayer.js
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/authcontext';
import { useNavigate } from 'react-router-dom';

function cleanTitle(raw = '') {
  if (!raw) return '';
  const cleaned = raw
    .replace(/^Wan_ISL_Animate_/, '')
    .replace(/^Wan_Avatar_Animate_/, '')
    .replace(/^Wan_ISL_/, '')
    .replace(/^Wan_Avatar_/, '')
    .replace(/_/g, ' ')
    .trim();
  return cleaned
    .split(' ')
    .map(w => (w.length > 0 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(' ');
}

export default function ISLCoursePlayer({ apiBase = '/api' }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]); // array of { video_id, s3_key, lesson_title, course_title }
  const [currentIndex, setCurrentIndex] = useState(0);
  const [videoSrcCache, setVideoSrcCache] = useState({}); // { videoId: presignedUrl }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    if (!user) { navigate('/'); return; }

    let cancelled = false;
    async function loadQueue() {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${apiBase}/player/queue/${user.id}`);
        if (cancelled) return;
        setQueue(res.data.queue || []);
        setCurrentIndex(0);
      } catch (err) {
        console.error('Failed to load queue', err);
        setError(err?.response?.data?.message || 'Failed to load queue');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadQueue();
    return () => { cancelled = true; };
  }, [apiBase, user, navigate]);

  // ensure current and next video have presigned URLs (prefetch)
  useEffect(() => {
    if (!queue.length) return;
    const current = queue[currentIndex];
    if (!current) return;

    let cancelled = false;

    async function presignIfNeeded(video) {
      if (!video) return;
      const vid = video.video_id;
      if (videoSrcCache[vid]) return;
      try {
        const presign = await axios.get(`${apiBase}/videos/${vid}/presign`);
        if (cancelled) return;
        setVideoSrcCache(prev => ({ ...prev, [vid]: presign.data.url }));
      } catch (e) {
        console.warn('presign failed for', vid, e);
      }
    }

    presignIfNeeded(current);
    presignIfNeeded(queue[currentIndex + 1]);

    return () => { cancelled = true; };
  }, [queue, currentIndex, apiBase, videoSrcCache]);

  // auto-load src into video element when presigned url becomes available
  useEffect(() => {
    const current = queue[currentIndex];
    if (!current) return;
    const url = videoSrcCache[current.video_id];
    if (!url) return;
    if (videoRef.current) {
      // Use set src and try to autoplay (catch promise rejection)
      videoRef.current.src = url;
      videoRef.current.play().catch(() => {});
    }
  }, [videoSrcCache, currentIndex, queue]);

  function playIndex(idx) {
    if (idx < 0 || idx >= queue.length) return;
    setCurrentIndex(idx);
  }

  async function handleEnded() {
    // Mark complete on server
    const current = queue[currentIndex];
    if (current) {
      try {
        await axios.post(`${apiBase}/content/videos/${current.video_id}/complete`);
      } catch (e) {
        console.warn('failed to mark complete', e);
      }
    }
    // auto-advance
    if (currentIndex < queue.length - 1) setCurrentIndex(currentIndex + 1);
  }

  if (loading) return <div>Loading courses…</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!queue.length) return <div>No videos available.</div>;

  const current = queue[currentIndex];
  const currentUrl = current ? videoSrcCache[current.video_id] : '';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
        <aside className="md:col-span-1 bg-white rounded-2xl shadow p-4 overflow-auto h-[70vh]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Queue</h2>
            <button onClick={() => navigate('/')} className="text-sm text-gray-500">Home</button>
          </div>

          <div className="space-y-3">
            {queue.map((q, idx) => (
              <div key={q.video_id}>
                <button
                  onClick={() => playIndex(idx)}
                  className={`w-full text-left p-2 rounded-lg transition ${idx === currentIndex ? 'bg-indigo-50' : 'hover:bg-gray-100'}`}
                >
                  <div className="font-medium">{cleanTitle(q.lesson_title || q.video_id)}</div>
                  <div className="text-xs text-gray-500">{q.course_title}</div>
                </button>
              </div>
            ))}
          </div>
        </aside>

        <main className="md:col-span-3 bg-white rounded-2xl shadow p-6">
          <h3 className="text-xl font-semibold mb-3">{current?.course_title || 'Player'}</h3>

          <div className="bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              controls
              playsInline
              className="w-full h-[360px] object-contain bg-black"
              src={currentUrl || ''}
              onEnded={handleEnded}
            />
          </div>

          <div className="mt-4">
            <div className="text-sm text-gray-500">Sign shown in video</div>
            <div className="mt-1 text-2xl font-semibold">{cleanTitle(current?.lesson_title) || '—'}</div>

            <div className="mt-3 flex gap-2">
              <button onClick={() => playIndex(Math.max(0, currentIndex - 1))} className="px-3 py-2 rounded-xl border">Previous</button>
              <button onClick={() => playIndex(Math.min(queue.length - 1, currentIndex + 1))} className="px-3 py-2 rounded-xl border">Next</button>
            </div>

            <div className="mt-4 text-sm text-gray-600">{current?.lesson_title || ''}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
