import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Leaf, Eye, EyeOff } from 'lucide-react';

export default function Signup() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const { error } = await signUp(email, password);

    if (error) {
      setErrors({ general: error.message });
      setLoading(false);
    } else {
      navigate('/tasks');
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6">
      <div className="w-full max-w-[480px]">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Leaf className="w-12 h-12 text-sage" strokeWidth={2.5} />
            <h1 className="text-4xl font-bold text-charcoal">TaskFlow</h1>
          </div>
        </div>

        <div className="bg-white rounded-card shadow-soft p-10">
          <h2 className="text-[32px] font-bold text-charcoal mb-2">Create Your Account</h2>
          <p className="text-mutedGray text-base mb-8">Start organizing your day with ease.</p>

          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border border-softRed rounded-button text-softRed text-base">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="fullName" className="block text-base font-semibold text-charcoal mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) {
                    setErrors({ ...errors, fullName: '' });
                  }
                }}
                className={`w-full px-5 py-4 text-base border ${
                  errors.fullName ? 'border-softRed' : 'border-gray-300'
                } rounded-button focus:ring-2 focus:ring-sage focus:border-transparent outline-none transition`}
                placeholder="Your full name"
              />
              {errors.fullName && (
                <p className="mt-2 text-sm text-softRed">{errors.fullName}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-base font-semibold text-charcoal mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) {
                    setErrors({ ...errors, email: '' });
                  }
                }}
                className={`w-full px-5 py-4 text-base border ${
                  errors.email ? 'border-softRed' : 'border-gray-300'
                } rounded-button focus:ring-2 focus:ring-sage focus:border-transparent outline-none transition`}
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-2 text-sm text-softRed">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-base font-semibold text-charcoal mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) {
                      setErrors({ ...errors, password: '' });
                    }
                  }}
                  className={`w-full px-5 py-4 pr-12 text-base border ${
                    errors.password ? 'border-softRed' : 'border-gray-300'
                  } rounded-button focus:ring-2 focus:ring-sage focus:border-transparent outline-none transition`}
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-mutedGray hover:text-charcoal transition"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-softRed">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-base font-semibold text-charcoal mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) {
                      setErrors({ ...errors, confirmPassword: '' });
                    }
                  }}
                  className={`w-full px-5 py-4 pr-12 text-base border ${
                    errors.confirmPassword ? 'border-softRed' : 'border-gray-300'
                  } rounded-button focus:ring-2 focus:ring-sage focus:border-transparent outline-none transition`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-mutedGray hover:text-charcoal transition"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-softRed">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sage text-white py-3 px-6 rounded-button text-base font-semibold hover:bg-[#6B9D6F] transition disabled:opacity-50 disabled:cursor-not-allowed mt-8"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-base">
            <span className="text-mutedGray">Already have an account? </span>
            <Link to="/login" className="text-coral hover:text-[#E67958] font-semibold transition">
              Log In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
