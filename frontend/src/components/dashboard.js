// frontend/src/components/dashboard.js
import React, { useState } from 'react';
import { BookOpen, Video, Trophy, Users } from 'lucide-react';
import { useAuth } from '../context/authcontext';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom'
import axios from 'axios';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [lbOpen, setLbOpen] = useState(false);
  const [lbLoading, setLbLoading] = useState(false);
  const [lbError, setLbError] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [lbGameTitle, setLbGameTitle] = useState(null);

  const stats = [
    { icon: BookOpen, label: 'Courses Enrolled', value: '0', color: 'bg-blue-500' },
    { icon: Video, label: 'Lessons Completed', value: '0', color: 'bg-green-500' },
    { icon: Trophy, label: 'Practice Sessions', value: '0', color: 'bg-yellow-500' },
    { icon: Users, label: 'Community Rank', value: 'New', color: 'bg-purple-500' }
  ];

  async function openLeaderboard() {
    // Attempt to fetch the most recent live game and its results.
    setLbError(null);
    setLbLoading(true);
    setLeaderboard([]);
    setLbGameTitle(null);

    try {
      const listRes = await axios.get('/api/games/list').catch(e => {
        // if server doesn't expose a games list, surface friendly message
        throw new Error('Live games listing not available on the server.');
      });

      const games = listRes.data.games || [];
      if (!games.length) {
        setLbError('No live games found.');
        setLbLoading(false);
        setLbOpen(true);
        return;
      }

      // pick the most recent game (first row)
      const recent = games[0];
      setLbGameTitle(recent.title || recent.key || 'Recent Game');

      // try to fetch leaderboard/results for that game
      const key = recent.key;
      let resultsRes;
      try {
        resultsRes = await axios.get(`/api/games/${encodeURIComponent(key)}/results`);
      } catch (err) {
        // fallback: try a different conventional property name
        try {
          resultsRes = await axios.get(`/api/games/${encodeURIComponent(key)}/leaderboard`);
        } catch (e) {
          throw new Error('Leaderboard for the selected game is not available on the server.');
        }
      }

      const results = resultsRes.data.results || resultsRes.data.leaderboard || resultsRes.data || [];
      setLeaderboard(Array.isArray(results) ? results : []);
      setLbOpen(true);
    } catch (err) {
      setLbError(err.message || 'Failed to load leaderboard.');
      setLbOpen(true);
    } finally {
      setLbLoading(false);
    }
  }

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
            <Link
              to="/courses"
              className="w-full inline-block text-center bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              aria-disabled={!user}
              onClick={(e) => {
                if (!user) {
                  e.preventDefault();
                  alert('Please sign in to view courses.');
                }
              }}
            >
              Browse Courses
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Practice Mode</h3>
            <p className="text-gray-600 mb-4">
              Use your camera to practice signs and get real-time feedback.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/practice')}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Start Practice
              </button>

              {/* Live Games button */}
              <button
                onClick={() => navigate('/live/schedule')}
                className="px-3 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                title="Create / view scheduled live quizzes"
              >
                Live Games
              </button>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => navigate('/duel/lobby')}
                className="w-full bg-yellow-600 text-white py-2 rounded-lg font-semibold hover:bg-yellow-700 transition-colors"
              >
                Duel Lobby (1v1)
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900 mb-0">Recommended for You</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={openLeaderboard}
                className="px-3 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 text-sm"
                aria-label="Open leaderboard"
              >
                View Leaderboard
              </button>
              <button
                onClick={() => navigate('/live/schedule')}
                className="px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm"
              >
                Game Schedule
              </button>
              <button
                onClick={() => navigate('/duel/lobby')}
                className="px-3 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 text-sm"
              >
                Join Queue
              </button>
            </div>
          </div>

          <div className="text-center py-12 text-gray-500">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p>No courses available yet. Check back soon!</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">{s.label}</div>
                <div className="text-2xl font-bold">{s.value}</div>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${s.color}`}>
                <s.icon className="w-6 h-6" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard modal */}
      {lbOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setLbOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-lg w-11/12 max-w-2xl p-6 z-10">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{lbGameTitle || 'Leaderboard'}</h3>
                <div className="text-sm text-gray-500">Live game leaderboard (most recent)</div>
              </div>
              <button onClick={() => setLbOpen(false)} className="text-sm text-gray-500">Close</button>
            </div>

            <div className="mt-4">
              {lbLoading ? (
                <div className="text-sm text-gray-600">Loading leaderboard…</div>
              ) : lbError ? (
                <div className="text-sm text-red-600">{lbError}</div>
              ) : leaderboard.length === 0 ? (
                <div className="text-sm text-gray-500">No leaderboard data available.</div>
              ) : (
                <ol className="divide-y">
                  {leaderboard.map((p, idx) => (
                    <li key={p.userId || p.id || idx} className="py-3 flex justify-between items-center">
                      <div>
                        <div className="font-medium">{p.name || `User ${p.userId || p.id}`}</div>
                        <div className="text-xs text-gray-500">Score: {p.score ?? p.points ?? '-'}</div>
                      </div>
                      <div className="text-sm text-gray-700 font-semibold">#{idx + 1}</div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
