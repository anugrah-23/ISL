// frontend/src/components/dashboard.js
import React from 'react';
import { BookOpen, Video, Trophy, Users } from 'lucide-react';
import { useAuth } from '../context/authcontext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const stats = [
    { icon: BookOpen, label: 'Courses Enrolled', value: '0', color: 'bg-blue-500' },
    { icon: Video, label: 'Lessons Completed', value: '0', color: 'bg-green-500' },
    { icon: Trophy, label: 'Practice Sessions', value: '0', color: 'bg-yellow-500' },
    { icon: Users, label: 'Community Rank', value: 'New', color: 'bg-purple-500' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user?.name || 'Learner'}! 👋
          </h1>
          <p className="text-blue-100">
            Glad to see you — continue your journey in Indian Sign Language.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Start Learning</h3>
            <p className="text-gray-600 mb-4">Begin your ISL journey with beginner-friendly courses.</p>
            <button
              onClick={() => navigate('/courses')}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Browse Courses
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Practice Mode</h3>
            <p className="text-gray-600 mb-4">
              Use your camera to practice signs and get real-time feedback.
            </p>
            <button className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">
              Start Practice
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Recommended for You</h3>
          <div className="text-center py-12 text-gray-500">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p>No courses available yet. Check back soon!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
