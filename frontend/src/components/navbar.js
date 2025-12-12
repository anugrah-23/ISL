// frontend/src/components/navbar.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authcontext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    // Ensure we always go to the public landing page after logout
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Clickable logo — uses Link so it always client-navigates to root */}
        <div className="flex items-center space-x-3">
          <Link
            to="/"
            className="flex items-center gap-3"
            aria-label="ISL Learning Home"
          >
            <div className="text-2xl font-bold">ISL</div>
            <div className="text-sm text-gray-600">Learning Platform</div>
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <div className="text-sm text-gray-700">
                Hello, <span className="font-medium">{user.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-2 bg-red-50 text-red-700 rounded-md hover:bg-red-100"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="text-sm text-gray-600">Welcome</div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
