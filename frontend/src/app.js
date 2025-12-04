// frontend/src/app.js
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/authcontext';

import Navbar from './components/navbar';
import Login from './components/login';
import Register from './components/register';
import Dashboard from './components/dashboard';

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

const AppContent = () => {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  return (
    <>
      {user && <Navbar />}
      {user ? <Dashboard /> : <AuthPage />}
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
