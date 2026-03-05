import { useAuth } from '../contexts/AuthContext';
import { CheckSquare, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Navbar() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('first_name')
      .eq('id', user.id)
      .maybeSingle();

    if (data && !error) {
      setFirstName(data.first_name);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <CheckSquare className="w-6 h-6 text-sage" strokeWidth={2.5} />
            <h1 className="text-[22px] font-bold text-charcoal">TaskFlow</h1>
          </button>

          <div className="flex items-center gap-4">
            {firstName && (
              <span className="hidden sm:block text-mutedGray">
                Hi, {firstName} 👋
              </span>
            )}

            <button
              onClick={handleLogout}
              className="hidden sm:flex items-center gap-2 px-4 py-2 border-2 border-coral text-coral rounded-xl font-semibold hover:bg-coral hover:text-white transition-all"
            >
              Log Out
            </button>

            <button
              onClick={handleLogout}
              className="sm:hidden p-2 border-2 border-coral text-coral rounded-xl hover:bg-coral hover:text-white transition-all"
              aria-label="Log out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
