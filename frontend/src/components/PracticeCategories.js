import React from "react";
import { useNavigate } from "react-router-dom";
import { practiceQuizCategories } from "../data/practiceQuiz";

export default function PracticeCategories() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Choose a practice category
          </h1>
          <p className="text-gray-600 mt-1">
            Pick any category to start a practice quiz.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {practiceQuizCategories.map((cat) => (
            <div
              key={cat.key}
              onClick={() => navigate(`/practice/${cat.key}`)}
              className="cursor-pointer bg-white rounded-xl border p-6 hover:shadow-md transition"
            >
              <h3 className="text-lg font-semibold text-gray-900">
                {cat.title}
              </h3>

              <div className="text-sm text-gray-500 mt-1">
                {cat.questions.length} questions
              </div>

              <div className="mt-4 text-sm text-blue-600 font-medium">
                Start Practice →
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
