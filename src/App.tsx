import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { authHelpers } from './lib/supabase';
import { taskHelpers, Task } from './lib/database';
import Navigation from './components/Navigation';
import HomePage from './pages/HomePage';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import ArchivePage from './pages/ArchivePage';
import Dashboard from './components/Dashboard';

function App() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [user, setUser] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [recentTasks, setRecentTasks] = React.useState<Task[]>([]);
  const [taskStats, setTaskStats] = React.useState({
    total: 0,
    completed: 0,
    pending: 0
  });

  // Check authentication state on app load
  React.useEffect(() => {
    const checkAuth = async () => {
      console.log('🔍 Checking auth state...');
      const { user } = await authHelpers.getCurrentUser();
      console.log('👤 Current user:', user);
      if (user) {
        console.log('✅ User found, setting logged in state');
        setUser(user);
        setIsLoggedIn(true);
        await loadUserData();
      } else {
        console.log('❌ No user found');
      }
      setIsLoading(false);
      console.log('🏁 Auth check complete');
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = authHelpers.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user ? 'User present' : 'No user');
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        setIsLoggedIn(true);
        loadUserData();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsLoggedIn(false);
        clearUserData();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async () => {
    console.log('📊 Loading user data...');
    try {
      // Load recent tasks
      const { data: tasks } = await taskHelpers.getRecentTasks(3);
      setRecentTasks(tasks || []);

      // Load task statistics
      const { data: stats } = await taskHelpers.getTaskStats();
      setTaskStats(stats || { total: 0, completed: 0, pending: 0 });
      console.log('✅ User data loaded successfully');
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const clearUserData = () => {
    console.log('🧹 Clearing user data...');
    setRecentTasks([]);
    setTaskStats({ total: 0, completed: 0, pending: 0 });
  };

  const handleLogout = async () => {
    try {
      clearUserData();
      await authHelpers.signOut();
      setUser(null);
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Debug logging to see what's happening
  React.useEffect(() => {
    console.log('🔍 Auth state update:', { 
      isLoggedIn, 
      hasUser: !!user, 
      isLoading,
      userEmail: user?.email 
    });
  }, [isLoggedIn, user, isLoading]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-8 w-8 text-blue-500 animate-spin" />
          <span className="text-lg text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

    return (
    <div className="min-h-screen bg-slate-50">
      <Navigation 
        isLoggedIn={isLoggedIn} 
        user={user} 
        onLogout={handleLogout} 
      />
      
      <Routes>
        <Route 
          path="/" 
          element={
            <HomePage 
              isLoggedIn={isLoggedIn}
              user={user}
              recentTasks={recentTasks}
              taskStats={taskStats}
            />
          } 
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route 
          path="/dashboard" 
          element={
            isLoggedIn ? (
              <Dashboard user={user} />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route 
          path="/archive" 
          element={
            isLoggedIn ? (
              <ArchivePage />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        {/* Catch all route - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;