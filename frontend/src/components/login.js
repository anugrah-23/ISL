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

  const validateEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async () => {
    const newErrors = {};

    if (!formData.email) newErrors.email = 'Email is required';
    else if (!validateEmail(formData.email))
      newErrors.email = 'Invalid email format';

    if (!formData.password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    const result = await login({
      email: formData.email,
      password: formData.password,
    });

    setLoading(false);

    if (!result.success) {
      setErrors({ general: result.message });
      return;
    }

    navigate('/');
  };

  return (
    <div className="space-y-5">
      {errors.general && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {errors.general}
        </div>
      )}

      {/* EMAIL */}
      <div>
        <label>Email Address</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full pl-11 pr-4 py-3 border rounded-lg"
            placeholder="you@example.com"
          />
        </div>
      </div>

      {/* PASSWORD */}
      <div>
        <label>Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />

          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className="w-full pl-11 pr-11 py-3 border rounded-lg"
            placeholder="Minimum 8 characters"
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* SUBMIT */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg"
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
