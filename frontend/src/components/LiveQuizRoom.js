// frontend/src/components/LiveQuizRoom.jsx
import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { useAuth } from '../context/authcontext';
import { useNavigate, useParams } from 'react-router-dom';

const SOCKET_URL = process.env.REACT_APP_SOCKET || (window.location.origin.replace(/^http/, 'ws'));

export default function LiveQuizRoom() {
  const { user } = useAuth();
  const { gameKey } = useParams(); // route expects /live/:gameKey
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null); // { idx, statement, options, time }
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [answeredIndices, setAnsweredIndices] = useState({}); // idx -> selectedIndex
  const [leaderboard, setLeaderboard] = useState([]);
  const [status, setStatus] = useState('waiting'); // waiting | running | finished
  const timerRef = useRef(null);

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('games:join', { gameKey, user });
    });

    socket.on('games:joined', () => {});
    socket.on('games:user-joined', ({ user: u }) => { /* optionally notify */ });

    socket.on('games:started', ({ total_questions, question_time_seconds }) => {
      setStatus('running');
    });

    socket.on('games:question', ({ idx, statement, options, time }) => {
      setCurrentQuestion({ idx, statement, options, time });
      setSelectedIndex(null);
      // start timer locally
      setTimeLeft(time);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); return 0; }
        return t - 1;
      }), 1000);
    });

    socket.on('games:round-summary', ({ idx, leaderboard: lb, eliminated }) => {
      setLeaderboard(lb || []);
      // if user eliminated, mark so (can't proceed)
      if (eliminated && eliminated[user.id]) {
        // show eliminated state
      }
    });

    socket.on('games:leaderboard', ({ leaderboard: lb }) => {
      setLeaderboard(lb || []);
    });

    socket.on('games:finished', ({ leaderboard: lb }) => {
      setStatus('finished');
      setLeaderboard(lb || []);
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    });

    socket.on('games:answer-received', ({ questionIdx, gained }) => {
      setAnsweredIndices(ai => ({ ...ai, [questionIdx]: true }));
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameKey, user, navigate]);

  if (!user) return null;

  function submitAnswer() {
    if (!currentQuestion) return;
    if (selectedIndex === null) {
      alert('Select an option to submit');
      return;
    }
    // disable further change for this question by recording locally
    setAnsweredIndices(ai => ({ ...ai, [currentQuestion.idx]: selectedIndex }));
    socketRef.current.emit('games:answer', { gameKey, user, questionIdx: currentQuestion.idx, selectedIndex });
  }

  function renderOptions() {
    if (!currentQuestion) return null;
    return currentQuestion.options.map((opt, i) => {
      const disabled = answeredIndices[currentQuestion.idx] !== undefined;
      const picked = selectedIndex === i || answeredIndices[currentQuestion.idx] === i;
      return (
        <button
          key={i}
          onClick={() => { if (!disabled) setSelectedIndex(i); }}
          className={`block w-full text-left p-3 mb-2 rounded border ${picked ? 'bg-indigo-50' : 'bg-white'}`}
        >
          <div>{opt}</div>
        </button>
      );
    });
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold">Live Quiz — {gameKey}</h2>

      {status === 'waiting' && <div className="mt-6 text-sm text-gray-600">Waiting for the host to start the game...</div>}

      {currentQuestion && (
        <div className="mt-6">
          <div className="text-sm text-gray-500">Question {currentQuestion.idx + 1}</div>
          <div className="mt-2 p-4 border rounded bg-white">
            <div className="font-medium mb-3">{currentQuestion.statement}</div>
            <div className="mb-3 text-sm text-gray-500">Time left: {timeLeft}s</div>
            <div>{renderOptions()}</div>
            <div className="mt-3">
              <button onClick={submitAnswer} className="px-4 py-2 bg-blue-600 text-white rounded" disabled={answeredIndices[currentQuestion.idx] !== undefined}>Submit</button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6">
        <h3 className="font-medium">Leaderboard</h3>
        <ol className="mt-2">
          {leaderboard.map((p, i) => <li key={p.userId}>{i+1}. {p.userId} — {p.score}</li>)}
        </ol>
      </div>

      {status === 'finished' && (
        <div className="mt-6 p-4 bg-green-50 rounded">
          <div className="font-medium">Game finished — final leaderboard</div>
          <ol className="mt-2">
            {leaderboard.map((p, i) => <li key={p.userId}>{i+1}. {p.userId} — {p.score}</li>)}
          </ol>
        </div>
      )}
    </div>
  );
}
