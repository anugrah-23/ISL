import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { practiceQuizByKey } from "../data/practiceQuiz";
import { resolveSentenceVideos } from "../components/resolveSentenceVideos";

function titleCase(word = "") {
  return word
    .split(" ")
    .map(w => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
}

export default function ISLPracticePlayer() {
  const { categoryKey } = useParams();
  const navigate = useNavigate();

  const category = practiceQuizByKey(categoryKey);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef(null);

  // Load sentence → video queue
  useEffect(() => {
    if (!category) return;

    let cancelled = false;

    async function buildQueue() {
      const sentence = category.questions[0]?.question;
      if (!sentence) return;

      const urls = await resolveSentenceVideos(sentence);

      if (cancelled) return;

      const q = urls.map((url, idx) => ({
        video_id: `${categoryKey}-${idx}`,
        src: url,
        lesson_title: titleCase(url.split("Wan_ISL_")[1]?.replace(".mp4", "")),
        course_title: `Practice: ${category.title}`,
      }));

      setQueue(q);
      setCurrentIndex(0);
    }

    buildQueue();
    return () => { cancelled = true; };
  }, [category, categoryKey]);

  function handleEnded() {
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(i => i + 1);
    }
  }

  if (!category) return <div className="p-6">Invalid category</div>;
  if (!queue.length) return <div className="p-6">No playable words found.</div>;

  const current = queue[currentIndex];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-semibold">{current.course_title}</h3>
          <button
            onClick={() => navigate("/practice")}
            className="text-sm text-gray-500"
          >
            Back
          </button>
        </div>

        <div className="bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            src={current.src}
            autoPlay
            playsInline
            className="w-full h-[360px] object-contain bg-black"
            onEnded={handleEnded}
          />
        </div>

        <div className="mt-4">
          <div className="text-sm text-gray-500">Current sign</div>
          <div className="text-2xl font-semibold">
            {current.lesson_title}
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              className="px-3 py-2 rounded-xl border"
            >
              Previous
            </button>
            <button
              onClick={() =>
                setCurrentIndex(Math.min(queue.length - 1, currentIndex + 1))
              }
              className="px-3 py-2 rounded-xl border"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
