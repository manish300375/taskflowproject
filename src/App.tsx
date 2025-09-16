import React from 'react';
import { CheckCircle, Clock, Users, BarChart3, Menu, X, Plus, Calendar, AlertCircle } from 'lucide-react';
import { authHelpers } from './lib/supabase';
import { taskHelpers, Task } from './lib/database';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import Dashboard from './components/Dashboard';

function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState<'home' | 'login' | 'signup' | 'dashboard'>('home');
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
      const { user } = await authHelpers.getCurrentUser();
      if (user) {
        setUser(user);
        setIsLoggedIn(true);
        loadUserData();
        setCurrentPage('dashboard');
      }
      setIsLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = authHelpers.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        setIsLoggedIn(true);
        loadUserData();
        setCurrentPage('dashboard');
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsLoggedIn(false);
        clearUserData();
        setCurrentPage('home');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async () => {
    try {
      // Load recent tasks
      const { data: tasks } = await taskHelpers.getRecentTasks(3);
      setRecentTasks(tasks || []);

      // Load task statistics
      const { data: stats } = await taskHelpers.getTaskStats();
      setTaskStats(stats || { total: 0, completed: 0, pending: 0 });
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const clearUserData = () => {
    setRecentTasks([]);
    setTaskStats({ total: 0, completed: 0, pending: 0 });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric' 
    });
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavigation = (page: 'home' | 'login' | 'signup' | 'dashboard') => {
    setCurrentPage(page);
    setIsMobileMenuOpen(false);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    handleNavigation('dashboard');
  };

  const handleLogout = async () => {
    try {
      clearUserData();
      await authHelpers.signOut();
      setUser(null);
      setIsLoggedIn(false);
      handleNavigation('home');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

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

  if (currentPage === 'dashboard') {
    return (
      <Dashboard onLogout={handleLogout} user={user} />
    );
  }

  if (currentPage === 'login') {
    return (
      <LoginPage
        onBack={() => handleNavigation('home')}
        onSignUp={() => handleNavigation('signup')}
        onLogin={handleLogin}
      />
    );
  }

  if (currentPage === 'signup') {
    return (
      <SignupPage
        onBack={() => handleNavigation('home')}
        onLogin={() => handleNavigation('login')}
        onSignUp={handleLogin}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-blue-500" />
              <span className="text-xl font-bold text-gray-900">TaskFlow</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-blue-500 transition-colors duration-200">
                Features
              </a>
              <a href="#about" className="text-gray-600 hover:text-blue-500 transition-colors duration-200">
                About
              </a>
              <a href="#contact" className="text-gray-600 hover:text-blue-500 transition-colors duration-200">
                Contact
              </a>
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              {!isLoggedIn ? (
               <>
                 <button 
                   onClick={() => handleNavigation('login')}
                   className="text-gray-600 hover:text-blue-500 transition-colors duration-200 px-4 py-2"
                 >
                   Login
                 </button>
                 <button 
                   onClick={() => handleNavigation('signup')}
                   className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium"
                 >
                   Sign Up
                 </button>
               </>
             ) : (
               <>
                 <button 
                   onClick={() => handleNavigation('dashboard')}
                  className="text-blue-500 hover:text-blue-600 transition-colors duration-200 px-4 py-2 font-medium"
                 >
                   Dashboard
                 </button>
                 <button 
                   onClick={handleLogout}
                   className="text-gray-600 hover:text-red-500 transition-colors duration-200 px-4 py-2"
                 >
                   Logout
                 </button>
               </>
             )}
           </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden bg-white border-t border-gray-100">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <a href="#features" className="block px-3 py-2 text-gray-600 hover:text-blue-500 transition-colors duration-200">
                  Features
                </a>
                <a href="#about" className="block px-3 py-2 text-gray-600 hover:text-blue-500 transition-colors duration-200">
                  About
                </a>
                <a href="#contact" className="block px-3 py-2 text-gray-600 hover:text-blue-500 transition-colors duration-200">
                  Contact
                </a>
                {!isLoggedIn ? (
                <div className="flex flex-col space-y-2 px-3 pt-4">
                  <button 
                    onClick={() => handleNavigation('login')}
                    className="text-gray-600 hover:text-blue-500 transition-colors duration-200 px-4 py-2 text-left"
                  >
                    Login
                  </button>
                  <button 
                    onClick={() => handleNavigation('signup')}
                    className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium"
                  >
                    Sign Up
                  </button>
                </div>) : (
                <div className="flex flex-col space-y-2 px-3 pt-4">
                  <button 
                    onClick={() => handleNavigation('dashboard')}
                    className="text-blue-500 hover:text-blue-600 transition-colors duration-200 px-4 py-2 text-left font-medium"
                  >
                    Dashboard
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="text-gray-600 hover:text-red-500 transition-colors duration-200 px-4 py-2 text-left"
                  >
                    Logout
                  </button>
                </div>)}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className={`bg-gradient-to-b from-white to-slate-50 ${isLoggedIn ? 'py-12 lg:py-16' : 'py-20 lg:py-32'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              TaskFlow
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 mb-4 font-light">
              Simple Task Management
            </p>
            <p className={`text-lg text-gray-600 ${isLoggedIn ? 'mb-8' : 'mb-12'} max-w-2xl mx-auto leading-relaxed`}>
              Get organized and boost your productivity with our intuitive task management platform. 
              Streamline your workflow, collaborate with your team, and achieve your goals faster.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button 
                onClick={() => isLoggedIn ? handleNavigation('dashboard') : handleNavigation('signup')}
                className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium text-lg w-full sm:w-auto"
              >
                {isLoggedIn ? 'Go to Dashboard' : 'Get Started Free'}
              </button>
              {!isLoggedIn && (
              <button 
                onClick={() => handleNavigation('login')}
                className="border-2 border-blue-500 text-blue-500 px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors duration-200 font-medium text-lg w-full sm:w-auto"
              >
                Login
              </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Snippet for Logged In Users */}
      {isLoggedIn && (
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.user_metadata?.full_name || user?.email || 'User'}!
              </h2>
              <p className="text-lg text-gray-600">Here's a quick overview of your tasks</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-slate-50 p-6 rounded-lg border border-gray-100">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <BarChart3 className="h-6 w-6 text-blue-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                    <p className="text-2xl font-bold text-gray-900">{taskStats.total}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-lg border border-gray-100">
                <div className="flex items-center">
                  <div className="bg-green-100 p-3 rounded-full">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">{taskStats.completed}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-lg border border-gray-100">
                <div className="flex items-center">
                  <div className="bg-yellow-100 p-3 rounded-full">
                    <Clock className="h-6 w-6 text-yellow-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">{taskStats.pending}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Tasks */}
            <div className="bg-slate-50 rounded-lg border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Tasks</h3>
                  <button 
                    onClick={() => handleNavigation('dashboard')}
                    className="text-blue-500 hover:text-blue-600 transition-colors duration-200 text-sm font-medium"
                  >
                    View All →
                  </button>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200">
                {recentTasks.length > 0 ? (
                  recentTasks.map((task) => (
                    <div key={task.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h4 className={`font-medium ${task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                              {task.title}
                            </h4>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(task.due_date || '')}</span>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              task.status === 'completed' 
                                ? 'text-green-600 bg-green-50' 
                                : 'text-yellow-600 bg-yellow-50'
                            }`}>
                              {task.status === 'completed' ? 'Completed' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-8 text-center">
                    <Clock className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">No tasks yet. Create your first task to get started!</p>
                    <button 
                      onClick={() => handleNavigation('dashboard')}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium flex items-center space-x-2 mx-auto"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Your First Task</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8 text-center">
              <button 
                onClick={() => handleNavigation('dashboard')}
                className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium text-lg"
              >
                Go to Full Dashboard
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section id="features" className={`${isLoggedIn ? 'py-12 bg-slate-50' : 'py-20 bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why Choose TaskFlow?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to stay organized and productive, all in one simple platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className={`text-center p-6 rounded-xl hover:shadow-lg transition-shadow duration-300 ${isLoggedIn ? 'bg-white' : ''}`}>
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Simple Task Management</h3>
              <p className="text-gray-600">
                Create, organize, and track your tasks with our intuitive interface. No complexity, just results.
              </p>
            </div>

            {/* Feature 2 */}
            <div className={`text-center p-6 rounded-xl hover:shadow-lg transition-shadow duration-300 ${isLoggedIn ? 'bg-white' : ''}`}>
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Time Tracking</h3>
              <p className="text-gray-600">
                Monitor how much time you spend on tasks and projects to optimize your productivity.
              </p>
            </div>

            {/* Feature 3 */}
            <div className={`text-center p-6 rounded-xl hover:shadow-lg transition-shadow duration-300 ${isLoggedIn ? 'bg-white' : ''}`}>
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Team Collaboration</h3>
              <p className="text-gray-600">
                Work together seamlessly with shared projects, assignments, and real-time updates.
              </p>
            </div>

            {/* Feature 4 */}
            <div className={`text-center p-6 rounded-xl hover:shadow-lg transition-shadow duration-300 ${isLoggedIn ? 'bg-white' : ''}`}>
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Progress Insights</h3>
              <p className="text-gray-600">
                Get detailed analytics and reports to understand your productivity patterns and improve.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isLoggedIn && (
      <section className="bg-slate-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            Ready to Get Organized?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who have transformed their productivity with TaskFlow. 
            Start your free trial today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={() => handleNavigation('signup')}
              className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium text-lg w-full sm:w-auto"
            >
              Sign Up Free
            </button>
            <button 
              onClick={() => handleNavigation('login')}
              className="text-gray-600 hover:text-blue-500 transition-colors duration-200 px-4 py-3 text-lg"
            >
              Already have an account? Login →
            </button>
          </div>
        </div>
      </section>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <CheckCircle className="h-6 w-6 text-blue-500" />
              <span className="text-lg font-semibold text-gray-900">TaskFlow</span>
            </div>
            <div className="flex space-x-6 text-sm text-gray-600">
              <a href="#privacy" className="hover:text-blue-500 transition-colors duration-200">
                Privacy Policy
              </a>
              <a href="#terms" className="hover:text-blue-500 transition-colors duration-200">
                Terms of Service
              </a>
              <a href="#support" className="hover:text-blue-500 transition-colors duration-200">
                Support
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-100 text-center text-sm text-gray-500">
            © 2025 TaskFlow. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;