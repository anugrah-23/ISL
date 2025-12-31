import React, { useEffect, useMemo, useState } from "react";
import {
  practiceQuizByKey,
  getVideoUrl,
} from "../data/practiceQuiz";

export default function PracticeQuiz({ categoryKey, onFinish }) {
  const category = useMemo(
    () => practiceQuizByKey(categoryKey),
    [categoryKey]
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
    setSelectedIndex(null);
    setSubmitted(false);
    setScore(0);
  }, [categoryKey]);

  if (!category) {
    return <div className="p-4 text-red-500">Invalid category</div>;
  }

  const question = category.questions[currentIndex];
  const videoUrl = getVideoUrl(question.videoKey);
  const isCorrect = selectedIndex === question.correctIndex;

  function handleSubmit() {
    if (selectedIndex === null) return;
    setSubmitted(true);
    if (isCorrect) setScore(s => s + 1);
  }

  function handleNext() {
    setSubmitted(false);
    setSelectedIndex(null);

    if (currentIndex + 1 < category.questions.length) {
      setCurrentIndex(i => i + 1);
    } else {
      onFinish?.({
        categoryKey,
        score,
        total: category.questions.length,
      });
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow">
      {/* HEADER */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold">{category.title}</h2>
        <p className="text-sm text-gray-500">
          Question {currentIndex + 1} / {category.questions.length}
        </p>
      </div>

      {/* VIDEO */}
      <div className="mb-6">
        {videoUrl ? (
          <video
            key={videoUrl}
            src={videoUrl}
            controls
            autoPlay
            className="w-full rounded-md border"
          />
        ) : (
          <div className="p-4 text-center border rounded text-gray-400">
            Video not available
          </div>
        )}
      </div>

      {/* QUESTION */}
      <p className="mb-4 text-lg font-medium">
        {question.question}
      </p>

      {/* OPTIONS */}
      <div className="space-y-3">
        {question.options.map((opt, i) => {
          const isSelected = selectedIndex === i;
          const isAnswer = submitted && i === question.correctIndex;
          const isWrong =
            submitted && isSelected && i !== question.correctIndex;

          return (
            <button
              key={i}
              disabled={submitted}
              onClick={() => setSelectedIndex(i)}
              className={`
                w-full text-left px-4 py-3 rounded border transition
                ${isSelected ? "border-blue-500" : "border-gray-300"}
                ${isAnswer ? "bg-green-100 border-green-500" : ""}
                ${isWrong ? "bg-red-100 border-red-500" : ""}
                hover:bg-gray-50
              `}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {/* ACTIONS */}
      <div className="mt-6 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Score: {score}
        </div>

        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={selectedIndex === null}
            className="px-6 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
          >
            Submit
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-6 py-2 rounded bg-green-600 text-white"
          >
            {currentIndex + 1 === category.questions.length
              ? "Finish"
              : "Next"}
          </button>
        )}
      </div>
    </div>
  );
}
