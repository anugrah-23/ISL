// frontend/src/components/CategoryPlayer.js
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { byKey, getVideoUrl } from '../data/courseSentences';

const SentenceItem = ({ s, active, onClick }) => (
  <div
    onClick={() => onClick(s)}
    className={`px-4 py-3 rounded-md cursor-pointer ${active ? 'bg-blue-100' : 'hover:bg-gray-50'}`}
  >
    <div className="text-sm text-gray-900">{s.text}</div>
  </div>
);

const CategoryPlayer = () => {
  const { categoryKey } = useParams();
  const navigate = useNavigate();

  // Hooks must run unconditionally at the top
  const [activeIdx, setActiveIdx] = useState(0);

  // compute category once (useMemo is safe and unconditional)
  const category = useMemo(() => byKey(categoryKey), [categoryKey]);

  // If category doesn't exist show a friendly message (no hooks after this)
  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6">
          <button onClick={() => navigate('/courses')} className="text-blue-600 mb-4">← Back to categories</button>
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-xl font-semibold mb-2">Category not found.</h3>
            <p className="text-gray-600 mb-4">The requested category key wasn't found. Try selecting another category.</p>
            <button onClick={() => navigate('/courses')} className="px-4 py-2 bg-blue-600 text-white rounded-md">Browse categories</button>
          </div>
        </div>
      </div>
    );
  }

  // sentences array - stable reference from category
  const sentences = category.sentences || [];

  // Ensure active index is within bounds when category changes
  if (activeIdx >= sentences.length) {
    // reset to 0 if the new category has fewer sentences
    // cannot call setState synchronously during render; do a safe correction:
    // (simple technique: if out-of-bounds, set to last valid index via local var here
    // and apply to state once - but we should avoid setState during render.)
    // We'll clamp display index using a derived value instead:
  }
  const safeActiveIdx = Math.min(Math.max(0, activeIdx), Math.max(0, sentences.length - 1));
  const activeSentence = sentences[safeActiveIdx] || null;

  // retrieve a playable URL if mapped (getVideoUrl returns null if none)
  const videoUrl = activeSentence ? getVideoUrl(activeSentence.id) : null;

  function handlePrev() {
    setActiveIdx((p) => Math.max(0, p - 1));
  }
  function handleNext() {
    setActiveIdx((p) => Math.min(sentences.length - 1, p + 1));
  }
  function openSentenceByIndex(i) {
    setActiveIdx(i);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <button onClick={() => navigate('/courses')} className="text-blue-600 mb-4">← Back to categories</button>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-start gap-6">
            {/* Left column: sentence list */}
            <div className="w-1/4 max-h-[70vh] overflow-auto pr-2">
              <div className="sticky top-0 bg-white pb-4">
                <h4 className="text-lg font-semibold mb-2">Sentence list</h4>
              </div>

              <div className="space-y-2">
                {sentences.map((s, idx) => (
                  <div key={s.id}>
                    <SentenceItem s={s} active={idx === safeActiveIdx} onClick={() => openSentenceByIndex(idx)} />
                  </div>
                ))}
              </div>
            </div>

            {/* Right column: player & details */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-2xl font-semibold">{category.title}</h2>
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg overflow-hidden mb-4" style={{ minHeight: 320 }}>
                {videoUrl ? (
                  // Use native video element so browser controls are available
                  <video controls style={{ width: '100%', height: 320, objectFit: 'contain' }}>
                    <source src={videoUrl} />
                    Your browser does not support HTML video.
                  </video>
                ) : (
                  <div className="w-full h-[320px] flex items-center justify-center text-gray-300">
                    No video available for this sentence
                  </div>
                )}
              </div>

              <div className="mb-4">
                <div className="text-sm text-gray-500">Sign shown in video</div>
                <h3 className="text-xl font-semibold mt-2">{activeSentence ? activeSentence.text : '—'}</h3>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={handlePrev} disabled={safeActiveIdx === 0}
                        className="px-4 py-2 border rounded disabled:opacity-50">Previous</button>
                <button onClick={handleNext} disabled={safeActiveIdx >= sentences.length - 1}
                        className="px-4 py-2 border rounded disabled:opacity-50">Next</button>

                <div className="ml-4 text-sm text-gray-500">
                  {safeActiveIdx + 1} / {sentences.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryPlayer;
