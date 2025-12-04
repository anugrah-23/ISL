// frontend/src/components/register.js
import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { useAuth } from '../context/authcontext';
import { useNavigate } from 'react-router-dom';

const Register = ({ onToggle }) => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const handleSubmit = async () => {
  const newErrors = {};

  if (!formData.name || formData.name.length < 2)
    newErrors.name = 'Name is required';

  if (!formData.email || !validateEmail(formData.email))
    newErrors.email = 'Valid email required';

  if (!formData.phone || !/^[6-9]\d{9}$/.test(formData.phone))
    newErrors.phone = 'Valid 10-digit phone number required';

  if (!formData.password || formData.password.length < 8)
    newErrors.password = 'Password must be at least 8 characters';

  if (!formData.confirmPassword)
    newErrors.confirmPassword = 'Please re-enter your password';

  if (formData.password !== formData.confirmPassword)
    newErrors.confirmPassword = 'Passwords do not match';

  // ⛔ STOP HERE if any error exists
  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }

  // Proceed only if no errors
  setLoading(true);
  const result = await register({
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
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

      {/* NAME */}
      <div>
        <label>Name</label>
        <input
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
          className="w-full p-3 border rounded-lg"
        />
      </div>

      {/* EMAIL */}
      <div>
        <label>Email</label>
        <input
          value={formData.email}
          onChange={(e) =>
            setFormData({ ...formData, email: e.target.value })
          }
          className="w-full p-3 border rounded-lg"
        />
      </div>

      {/* PHONE */}
      <div>
        <label>Phone</label>
        <input
          value={formData.phone}
          onChange={(e) =>
            setFormData({ ...formData, phone: e.target.value })
          }
          className="w-full p-3 border rounded-lg"
        />
      </div>

      {/* PASSWORD */}
      <div>
        <label>Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 text-gray-400" />
          <input
            type="password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            className="w-full pl-11 p-3 border rounded-lg"
          />
        </div>
      </div>

      {/* CONFIRM PASSWORD */}
      <div>
        <label>Confirm Password</label>
        <input
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({...formData,confirmPassword: e.target.value})}
          className={`w-full p-3 border rounded-lg ${errors.confirmPassword ? 'border-red-500' : ''}`}
        />
        {errors.confirmPassword && (
          <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>
        )}
      </div>

      {/* SUBMIT BUTTON */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg"
      >
        {loading ? 'Creating...' : 'Create Account'}
      </button>

      <div className="text-center mt-2">
        <p>
          Already have an account?{' '}
          <button onClick={onToggle} className="text-blue-600">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default Register;
