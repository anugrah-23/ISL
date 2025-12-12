// frontend/src/app.js
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./context/authcontext";

import Navbar from "./components/navbar";
import Login from "./components/login";
import Register from "./components/register";
import Dashboard from "./components/dashboard";

import ISLCoursePlayer from "./components/ISLCoursePlayer";
import CourseCategories from "./components/CourseCategories";
import CategoryPlayer from "./components/CategoryPlayer";

import DuelLobby from "./components/DuelLobby";
import DuelQueue from "./components/DuelQueue";
import DuelRoom from "./components/DuelRoom";

import LiveSchedule from "./components/LiveQuizRoom";

// -----------------------------
// PRIVATE ROUTE
// -----------------------------
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading…</div>
      </div>
    );
  }

  if (!token && !user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
}

// -----------------------------
// LOGIN / REGISTER PAGE
// -----------------------------
const AuthPage = () => {
  const [isLogin, setIsLogin] = React.useState(true);
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {isLogin ? (
          <Login onToggle={() => setIsLogin(false)} />
        ) : (
          <Register onToggle={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  );
};

// -----------------------------
// MAIN ROUTES
// -----------------------------
const AppContent = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Initializing…</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Dashboard when logged in, AuthPage when not */}
      <Route path="/" element={<AuthOrDashboard />} />

      {/* Courses */}
      <Route
        path="/courses"
        element={
          <PrivateRoute>
            <CourseCategories />
          </PrivateRoute>
        }
      />
      <Route
        path="/courses/:categoryKey"
        element={
          <PrivateRoute>
            <CategoryPlayer />
          </PrivateRoute>
        }
      />

      {/* ISL Legacy Player */}
      <Route path="/player/legacy" element={<ISLCoursePlayer apiBase="/api" />} />

      {/* Duel System */}
      <Route
        path="/duel/lobby"
        element={
          <PrivateRoute>
            <DuelLobby />
          </PrivateRoute>
        }
      />

      <Route
        path="/duel/queue/:queueId"
        element={
          <PrivateRoute>
            <DuelQueue />
          </PrivateRoute>
        }
      />

      {/* IMPORTANT — updated from matchId → matchKey */}
      <Route
        path="/duel/room/:matchKey"
        element={
          <PrivateRoute>
            <DuelRoom />
          </PrivateRoute>
        }
      />

      {/* Live schedule */}
      <Route
        path="/live/schedule"
        element={
          <PrivateRoute>
            <LiveSchedule />
          </PrivateRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// -----------------------------
// CHOOSE AUTH/DASHBOARD
// -----------------------------
function AuthOrDashboard() {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading…
      </div>
    );
  return user ? <Dashboard /> : <AuthPage />;
}

// -----------------------------
// MAIN APP WRAPPER
// -----------------------------
function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
