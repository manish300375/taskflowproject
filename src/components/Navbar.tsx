import { useAuth } from '../contexts/AuthContext';
import { Leaf, LogOut, User } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

export default function Navbar() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [avatarUrl, setAvatarUrl] = useState('');
  const [fullName, setFullName] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      setAvatarUrl(user.user_metadata?.avatar_url || '');
      setFullName(user.user_metadata?.full_name || '');
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = () => {
    if (!user?.email) return 'U';
    const name = fullName || user.email;
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleProfileClick = () => {
    setShowDropdown(false);
    navigate('/profile');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <Leaf className="w-8 h-8 text-sage" />
              <h1 className="text-2xl font-bold text-charcoal">TaskFlow</h1>
            </button>

            {user && (
              <div className="flex items-center gap-6">
                <Link
                  to="/dashboard"
                  className={`text-base font-semibold transition-colors ${
                    location.pathname === '/dashboard'
                      ? 'text-sage'
                      : 'text-mutedGray hover:text-charcoal'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/tasks"
                  className={`text-base font-semibold transition-colors ${
                    location.pathname === '/tasks'
                      ? 'text-sage'
                      : 'text-mutedGray hover:text-charcoal'
                  }`}
                >
                  Tasks
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {fullName && (
              <span className="hidden sm:block text-mutedGray">
                Hi, {fullName.split(' ')[0]} 👋
              </span>
            )}

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-10 h-10 rounded-full overflow-hidden bg-sage bg-opacity-10 flex items-center justify-center hover:ring-2 hover:ring-sage hover:ring-opacity-30 transition-all"
                aria-label="Profile menu"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-sage text-sm font-bold">
                    {getInitials()}
                  </div>
                )}
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-card shadow-soft border border-gray-200 py-2 z-50">
                  <button
                    onClick={handleProfileClick}
                    className="w-full px-4 py-2 text-left text-charcoal hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    My Profile
                  </button>
                  <div className="border-t border-gray-200 my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-coral hover:bg-coral hover:bg-opacity-10 transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
