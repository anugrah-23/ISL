// frontend/src/app.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/authcontext';

import Navbar from './components/navbar';
import Login from './components/login';
import Register from './components/register';
import Dashboard from './components/dashboard';
import ISLCoursePlayer from './components/ISLCoursePlayer';

const AuthPage = () => {
  const [isLogin, setIsLogin] = React.useState(true);
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {isLogin ? <Login onToggle={() => setIsLogin(false)} /> : <Register onToggle={() => setIsLogin(true)} />}
      </div>
    </div>
  );
};

const AppContent = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <>
      {user && <Navbar />}
      <Routes>
        <Route path="/" element={user ? <Dashboard /> : <AuthPage />} />
        <Route path="/courses" element={user ? <ISLCoursePlayer apiBase="/api" /> : <Navigate to="/" replace />} />
        <Route path="/login" element={<AuthPage />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
