// frontend/src/components/CategoryPlayer.js
import React, { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { byKey } from "../data/courseSentences";

const R2_BASE =
  "https://pub-2d19b53b556b4755a69be5d1e59da23a.r2.dev";

const R2_FOLDERS = ["First_R2", "Second_R2", "Third_R2", "Fourth_R2"];

const SentenceItem = ({ s, active, onClick }) => (
  <div
    onClick={onClick}
    className={`px-4 py-3 rounded-md cursor-pointer ${
      active ? "bg-blue-100" : "hover:bg-gray-50"
    }`}
  >
    <div className="text-sm text-gray-900">{s.text}</div>
  </div>
);

export default function CategoryPlayer() {
  const { categoryKey } = useParams();
  const navigate = useNavigate();

  const [activeIdx, setActiveIdx] = useState(0);
  const [wordIdx, setWordIdx] = useState(0);
  const [folderIdx, setFolderIdx] = useState(0);
  const [exhausted, setExhausted] = useState(false);

  // --------------------
  // DATA
  // --------------------
  const category = useMemo(() => byKey(categoryKey), [categoryKey]);
  const sentences = category?.sentences || [];

  const safeActiveIdx = Math.min(
    Math.max(0, activeIdx),
    Math.max(0, sentences.length - 1)
  );

  const activeSentence = sentences[safeActiveIdx] || null;

  // Reset playback state when sentence changes
  useEffect(() => {
    setWordIdx(0);
    setFolderIdx(0);
    setExhausted(false);
  }, [safeActiveIdx]);

  // Extract words (clean + Title Case)
  const words = useMemo(() => {
    if (!activeSentence) return [];
    return activeSentence.text
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter(Boolean)
      .map(
        (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
      );
  }, [activeSentence]);

  // Current video URL
  const videoUrl = useMemo(() => {
    if (exhausted) return null;
    const word = words[wordIdx];
    const folder = R2_FOLDERS[folderIdx];
    if (!word || !folder) return null;
    return `${R2_BASE}/${folder}/Wan_ISL_${word}.mp4`;
  }, [words, wordIdx, folderIdx, exhausted]);

  // --------------------
  // FALLBACK LOGIC (missing video)
  // --------------------
  function handleVideoError() {
    // Try next folder
    if (folderIdx < R2_FOLDERS.length - 1) {
      setFolderIdx((f) => f + 1);
      return;
    }

    // Move to next word
    if (wordIdx < words.length - 1) {
      setFolderIdx(0);
      setWordIdx((w) => w + 1);
      return;
    }

    // All words exhausted
    setExhausted(true);
  }

  // --------------------
  // CONCATENATION LOGIC (video finished)
  // --------------------
  function handleVideoEnded() {
    // Move to next word
    if (wordIdx < words.length - 1) {
      setFolderIdx(0);
      setWordIdx((w) => w + 1);
      return;
    }

    // Sentence finished
    setExhausted(true);
  }

  // --------------------
  // NAVIGATION
  // --------------------
  function handlePrev() {
    setActiveIdx((p) => Math.max(0, p - 1));
  }

  function handleNext() {
    setActiveIdx((p) => Math.min(sentences.length - 1, p + 1));
  }

  function openSentenceByIndex(i) {
    setActiveIdx(i);
  }

  // --------------------
  // CATEGORY NOT FOUND
  // --------------------
  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6">
          <button
            onClick={() => navigate("/courses")}
            className="text-blue-600 mb-4"
          >
            ← Back to categories
          </button>
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-xl font-semibold mb-2">Category not found.</h3>
            <p className="text-gray-600">
              The requested category key wasn’t found.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --------------------
  // RENDER
  // --------------------
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <button
          onClick={() => navigate("/courses")}
          className="text-blue-600 mb-4"
        >
          ← Back to categories
        </button>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-start gap-6">
            {/* LEFT */}
            <div className="w-1/4 max-h-[70vh] overflow-auto pr-2">
              <h4 className="text-lg font-semibold mb-4">Sentence list</h4>
              <div className="space-y-2">
                {sentences.map((s, idx) => (
                  <SentenceItem
                    key={s.id}
                    s={s}
                    active={idx === safeActiveIdx}
                    onClick={() => openSentenceByIndex(idx)}
                  />
                ))}
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex-1">
              <h2 className="text-2xl font-semibold mb-3">
                {category.title}
              </h2>

              <div
                className="bg-gray-900 rounded-lg overflow-hidden mb-4"
                style={{ minHeight: 320 }}
              >
                {videoUrl ? (
                  <video
                    key={videoUrl}
                    src={videoUrl}
                    controls
                    autoPlay
                    preload="auto"
                    onError={handleVideoError}
                    onEnded={handleVideoEnded}
                    style={{
                      width: "100%",
                      height: 320,
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <div className="w-full h-[320px] flex items-center justify-center text-gray-300">
                    No matching sign video found
                  </div>
                )}
              </div>

              <h3 className="text-xl font-semibold">
                {activeSentence?.text || "—"}
              </h3>

              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={handlePrev}
                  disabled={safeActiveIdx === 0}
                  className="px-4 py-2 border rounded disabled:opacity-50"
                >
                  Previous
                </button>

                <button
                  onClick={handleNext}
                  disabled={safeActiveIdx >= sentences.length - 1}
                  className="px-4 py-2 border rounded disabled:opacity-50"
                >
                  Next
                </button>

                <span className="ml-4 text-sm text-gray-500">
                  {safeActiveIdx + 1} / {sentences.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
