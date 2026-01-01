// frontend/src/components/ISLCoursePlayer.js

import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { byKey } from "../data/courseSentences";

/* ================= CONFIG ================= */

const R2_BASE = process.env.REACT_APP_R2_PUBLIC_BASE;
const VIDEO_BUCKET = "islvideos";
const FOLDERS = ["First_R2", "Second_R2", "Third_R2", "Fourth_R2"];

/* ================= HELPERS ================= */

// Normalize words → match R2 naming
function normalizeWord(word) {
  return word
    .replace(/[.,!?]/g, "")
    .trim()
    .toUpperCase();
}

// Split sentence into words
function sentenceToWords(sentence) {
  return sentence.split(" ").map(normalizeWord).filter(Boolean);
}

// Build all possible R2 URLs for a word
function buildCandidates(word) {
  return FOLDERS.map(
    folder =>
      `${R2_BASE}/${VIDEO_BUCKET}/${folder}/Wan_ISL_${word}.mp4`
  );
}

// Resolve first available video URL
async function resolveWordVideo(word) {
  const candidates = buildCandidates(word);

  for (const url of candidates) {
    try {
      const res = await fetch(url, { method: "HEAD" });
      if (res.ok) return url;
    } catch (err) {
      console.warn("HEAD failed:", url);
    }
  }
  return null;
}

/* ================= COMPONENT ================= */

export default function ISLCoursePlayer() {
  const { categoryKey } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const category = byKey(categoryKey);
  const sentences = category?.sentences || [];

  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [videoQueue, setVideoQueue] = useState([]);
  const [videoIndex, setVideoIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const currentSentence = sentences[sentenceIndex];

  /* ========== RESOLVE VIDEOS FOR SENTENCE ========== */

  useEffect(() => {
    let cancelled = false;

    async function buildQueue() {
      if (!currentSentence?.text || !R2_BASE) return;

      setLoading(true);
      setError(null);
      setVideoQueue([]);
      setVideoIndex(0);

      const words = sentenceToWords(currentSentence.text);
      const resolved = [];

      for (const word of words) {
        const url = await resolveWordVideo(word);
        if (url) resolved.push(url);
      }

      if (!cancelled) {
        if (resolved.length === 0) {
          setError("No videos available for this sentence.");
        }
        setVideoQueue(resolved);
        setLoading(false);
      }
    }

    buildQueue();
    return () => {
      cancelled = true;
    };
  }, [sentenceIndex, currentSentence]);

  /* ========== FORCE VIDEO LOAD (FIX BLACK SCREEN) ========== */

  useEffect(() => {
    if (!videoRef.current) return;
    if (!videoQueue[videoIndex]) return;

    videoRef.current.pause();
    videoRef.current.src = videoQueue[videoIndex];
    videoRef.current.load();

    videoRef.current
      .play()
      .catch(() => console.warn("Autoplay blocked"));
  }, [videoQueue, videoIndex]);

  /* ========== AUTO PLAY NEXT WORD ========== */

  function handleEnded() {
    if (videoIndex < videoQueue.length - 1) {
      setVideoIndex(v => v + 1);
    }
  }

  /* ================= UI ================= */

  if (!category) {
    return <div className="p-6 text-red-600">Invalid category</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-6">

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{category.title}</h2>
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-gray-500"
          >
            Back
          </button>
        </div>

        <div className="mb-4 text-lg font-medium">
          {currentSentence?.text}
        </div>

        <div className="bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            controls
            playsInline
            className="w-full h-[360px] object-contain bg-black"
            onEnded={handleEnded}
          />
        </div>

        {loading && (
          <div className="mt-3 text-gray-500">Loading videos…</div>
        )}

        {error && (
          <div className="mt-3 text-red-600">{error}</div>
        )}

        <div className="mt-6 flex justify-between">
          <button
            disabled={sentenceIndex === 0}
            onClick={() => setSentenceIndex(i => i - 1)}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Previous Sentence
          </button>

          <button
            disabled={sentenceIndex >= sentences.length - 1}
            onClick={() => setSentenceIndex(i => i + 1)}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Next Sentence
          </button>
        </div>

      </div>
    </div>
  );
}
