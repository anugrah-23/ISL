import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import PracticeQuiz from "./PracticeQuiz";

export default function PracticeQuizPage() {
  const { categoryKey } = useParams();
  const navigate = useNavigate();

  // Safety check (prevents blank screen)
  if (!categoryKey) {
    return (
      <div className="p-6 text-center text-red-500">
        Invalid practice category
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <PracticeQuiz
        categoryKey={categoryKey}
        onFinish={({ score, total }) => {
          // Later: save progress, show summary, analytics, etc.
          console.log("Practice finished:", {
            categoryKey,
            score,
            total,
          });

          // Temporary behavior: go back to courses
          navigate("/courses");
        }}
      />
    </div>
  );
}
