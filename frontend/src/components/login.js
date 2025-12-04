// frontend/src/components/login.js
import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/authcontext';
import { useNavigate } from 'react-router-dom';

const Login = ({ onToggle }) => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear inline error for the field as user types
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (errors.general) setErrors((prev) => ({ ...prev, general: '' }));
  };

  const handleSubmit = async () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!validateEmail(formData.email)) newErrors.email = 'Invalid email format';

    if (!formData.password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    console.debug('[Login] submitting', formData.email);

    const result = await login({ email: formData.email, password: formData.password });
    console.debug('login result', result); // helpful for debugging server messages

    setLoading(false);

    if (!result.success) {
      // Show backend message if present, otherwise a generic one
      setErrors({ general: result.message || 'Login failed' });
      return;
    }

    // success -> go to app
    navigate('/');
  };

  return (
    <div className="space-y-5">
      {errors.general && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {errors.general}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Email Address</label>
        <div className="relative mt-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={`w-full pl-11 pr-4 py-3 border rounded-lg ${errors.email ? 'border-red-500' : ''}`}
            placeholder="you@example.com"
          />
        </div>
        {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Password</label>
        <div className="relative mt-1">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className={`w-full pl-11 pr-11 py-3 border rounded-lg ${errors.password ? 'border-red-500' : ''}`}
            placeholder="Minimum 8 characters"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold disabled:opacity-60"
      >
        {loading ? 'Signing in...' : 'Sign in'}
      </button>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Don’t have an account?{' '}
          <button onClick={onToggle} className="text-blue-600">
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
