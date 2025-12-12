// frontend/src/components/CourseCategories.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { categories } from '../data/courseSentences';

const CourseCard = ({ c, onOpen }) => {
  // make calling onOpen defensive and prevent default propagation
  const handleActivate = (e) => {
    if (e?.preventDefault) e.preventDefault();
    e?.stopPropagation?.();
    if (typeof onOpen === 'function') onOpen(c.key);
  };

  return (
    <div
      onClick={handleActivate}
      className="cursor-pointer border rounded-lg p-5 hover:shadow-md transition-shadow bg-white"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleActivate(e); }}
      aria-label={`Open category ${c.title || c.key}`}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{c.title}</h3>
          <div className="text-sm text-gray-400 mt-1">{c.range}</div>
        </div>
      </div>
      <div className="mt-4 text-sm text-gray-500">sentences</div>
    </div>
  );
};

const CourseCategories = () => {
  const navigate = useNavigate();

  // NOTE: App routes expect /courses/:categoryKey (see AppContent),
  // so navigate to /courses/<key> — not /courses/category/<key>
  function openCategory(key) {
    navigate(`/courses/${encodeURIComponent(key)}`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-2">Choose a course category</h2>
          <p className="text-sm text-gray-500">Pick any category to open the sentence player.</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categories.map((c) => (
              <CourseCard key={c.key} c={c} onOpen={openCategory} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCategories;
