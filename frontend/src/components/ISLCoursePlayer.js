// frontend/src/components/ISLCoursePlayer.jsx
import React from 'react';
const { useEffect, useState, useRef } = React;
import axios from 'axios';
import { useAuth } from '../context/authcontext';
import { useNavigate } from 'react-router-dom';

function cleanTitle(raw = '') {
  if (!raw) return '';
  // Remove known prefixes
  const cleaned = raw
    .replace(/^Wan_ISL_Animate_/, '')
    .replace(/^Wan_Avatar_Animate_/, '')
    .replace(/^Wan_ISL_/, '')
    .replace(/^Wan_Avatar_/, '')
    .replace(/_/g, ' ')
    .trim();

  // Title-case each word (keeps punctuation like parentheses)
  return cleaned
    .split(' ')
    .map(w => (w.length > 0 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(' ');
}

export default function ISLCoursePlayer({ apiBase = '/api' }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourseIndex, setSelectedCourseIndex] = useState(0);
  const [selectedLessonIndex, setSelectedLessonIndex] = useState(0);
  const [videoSrcCache, setVideoSrcCache] = useState({}); // { videoId: presignedUrl }
  const [currentSrc, setCurrentSrc] = useState(''); // controlled src for <video>
  const videoRef = useRef(null);

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    let cancelled = false;
    async function fetchCourses() {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${apiBase}/courses`);
        if (cancelled) return;
        setCourses(Array.isArray(res.data) ? res.data : []);
        setSelectedCourseIndex(0);
        setSelectedLessonIndex(0);
      } catch (err) {
        console.error('Failed to load courses:', err);
        setError(err?.response?.data?.message || 'Failed to load courses');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchCourses();
    return () => { cancelled = true; };
  }, [apiBase, user, navigate]);

  function getSelectedCourse() { return courses[selectedCourseIndex] || null; }
  function getSelectedLesson() { return getSelectedCourse()?.lessons?.[selectedLessonIndex] || null; }

  // when selecting a lesson, pre-fetch presigned URL for its first video (if any)
  async function selectLesson(i) {
    setSelectedLessonIndex(i);
    const lesson = getSelectedCourse()?.lessons?.[i];
    if (!lesson) {
      setCurrentSrc('');
      return;
    }

    const videoRecord = lesson.videos?.[0];
    if (!videoRecord) {
      setCurrentSrc('');
      return;
    }

    const vidId = videoRecord.id;
    if (videoSrcCache[vidId]) {
      // already have a presigned url cached
      setCurrentSrc(videoSrcCache[vidId]);
      // attempt autoplay safely
      setTimeout(() => {
        if (videoRef.current && typeof videoRef.current.play === 'function') {
          videoRef.current.play().catch(() => {});
        }
      }, 100);
      return;
    }

    try {
      const presign = await axios.get(`${apiBase}/videos/${vidId}/presign`);
      const url = presign.data.url;
      setVideoSrcCache(prev => ({ ...prev, [vidId]: url }));
      setCurrentSrc(url);
      // attempt autoplay safely
      setTimeout(() => {
        if (videoRef.current && typeof videoRef.current.play === 'function') {
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch (err) {
      console.error('Failed to presign video:', err);
      setError('Failed to prepare video for playback');
    }
  }

  function selectCourse(ci) {
    setSelectedCourseIndex(ci);
    setSelectedLessonIndex(0);
    // preselect lesson 0 after a tick
    setTimeout(() => selectLesson(0), 50);
  }

  function nextLesson() {
    const c = getSelectedCourse();
    if (!c) return;
    if (selectedLessonIndex < (c.lessons?.length || 0) - 1) selectLesson(selectedLessonIndex + 1);
    else if (selectedCourseIndex < courses.length - 1) selectCourse(selectedCourseIndex + 1);
  }
  function prevLesson() {
    if (selectedLessonIndex > 0) selectLesson(selectedLessonIndex - 1);
    else if (selectedCourseIndex > 0) {
      const prevCourse = courses[selectedCourseIndex - 1];
      selectCourse(selectedCourseIndex - 1);
      setTimeout(() => {
        if (prevCourse?.lessons?.length) setSelectedLessonIndex(prevCourse.lessons.length - 1);
      }, 60);
    }
  }

  const course = getSelectedCourse();
  const lesson = getSelectedLesson();
  const currentVideo = lesson?.videos?.[0];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
        <aside className="md:col-span-1 bg-white rounded-2xl shadow p-4 overflow-auto h-[70vh]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Courses</h2>
            <button onClick={() => navigate('/')} className="text-sm text-gray-500">Home</button>
          </div>

          {loading && <div>Loading courses…</div>}
          {error && <div className="text-red-600">{error}</div>}
          {!loading && courses.length === 0 && <div className="text-sm text-gray-500">No courses available.</div>}

          <div className="space-y-3">
            {courses.map((c, ci) => (
              <div key={c.id || ci}>
                <button onClick={() => selectCourse(ci)} className={`w-full text-left p-2 rounded-lg transition ${ci === selectedCourseIndex ? 'bg-indigo-50' : 'hover:bg-gray-100'}`}>
                  <div className="font-medium">{c.title}</div>
                  <div className="text-xs text-gray-500">{(c.lessons || []).length} lessons</div>
                </button>

                {ci === selectedCourseIndex && (
                  <ul className="mt-2 ml-3 space-y-1">
                    {Array.isArray(c.lessons) && c.lessons.length ? c.lessons.map((ls, li) => (
                      <li key={ls.id || li}>
                        <button onClick={() => selectLesson(li)} className={`w-full text-left px-2 py-1 rounded-md text-sm ${li === selectedLessonIndex ? 'font-semibold text-indigo-700' : 'hover:bg-gray-50'}`}>
                          {cleanTitle(ls.title)}
                        </button>
                      </li>
                    )) : <li className="text-sm text-gray-500 px-2">No lessons</li>}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </aside>

        <main className="md:col-span-3 bg-white rounded-2xl shadow p-6">
          <h3 className="text-xl font-semibold mb-3">{course?.title || 'Select a course'}</h3>

          <div className="bg-black rounded-lg overflow-hidden">
            {currentVideo ? (
              <video
                ref={videoRef}
                controls
                playsInline
                className="w-full h-[360px] object-contain bg-black"
                src={currentSrc || ''}
                onEnded={async () => {
                  // optional: mark complete with API
                  try { await axios.post(`${apiBase}/content/videos/${currentVideo.id}/complete`); } catch {}
                }}
              />
            ) : (
              <div className="w-full h-[360px] flex items-center justify-center text-gray-400">Select a lesson</div>
            )}
          </div>

          <div className="mt-4">
            <div className="text-sm text-gray-500">Sign shown in video</div>
            <div className="mt-1 text-2xl font-semibold">{cleanTitle(lesson?.title) || '—'}</div>

            <div className="mt-3 flex gap-2">
              <button onClick={prevLesson} className="px-3 py-2 rounded-xl border">Previous</button>
              <button onClick={nextLesson} className="px-3 py-2 rounded-xl border">Next</button>
            </div>
            <div className="mt-4 text-sm text-gray-600">{lesson?.transcript || ''}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
