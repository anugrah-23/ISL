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
  import PracticeCategories from "./components/PracticeCategories";
  import PracticeQuizPage from "./components/PracticeQuizPage";

  import DuelLobby from "./components/DuelLobby";
  import DuelQueue from "./components/DuelQueue";
  import DuelRoom from "./components/DuelRoom";

  import LiveSchedule from "./components/LiveQuizRoom";
  import FriendsPage from "./components/FriendsPage";


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
        {/* Root */}
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
        {/* Practice */}
        <Route
          path="/practice"
          element={
            <PrivateRoute>
              <PracticeCategories />
            </PrivateRoute>
          }
        />

        <Route
          path="/practice/:categoryKey"
          element={
            <PrivateRoute>
              <PracticeQuizPage />
            </PrivateRoute>
          }
        />

        {/* ISL legacy player */}
        <Route
          path="/player/legacy"
          element={<ISLCoursePlayer apiBase="/api" />}
        />

        {/* Duel system */}
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

        {/* IMPORTANT — matchKey route */}
        <Route
          path="/duel/room/:matchKey"
          element={
            <PrivateRoute>
              <DuelRoom />
            </PrivateRoute>
          }
        />

        {/* Live events / schedule */}
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
        <Route
          path="/friends"
          element={
            <PrivateRoute>
              <FriendsPage />
            </PrivateRoute>
          }
        />
        
      </Routes>
    );
  };

  // -----------------------------
  // AUTH OR DASHBOARD
  // -----------------------------
  function AuthOrDashboard() {
    const { user, loading } = useAuth();

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          Loading…
        </div>
      );
    }

    return user ? <Dashboard /> : <AuthPage />;
  }

  // -----------------------------
  // MAIN APP
  // -----------------------------
  function App() {
    return (
      <Router>
        <AuthProvider>
          {/* Navbar always mounted (required for duel exit handling) */}
          <Navbar />
          <AppContent />
        </AuthProvider>
      </Router>
    );
  }



  export default App;
