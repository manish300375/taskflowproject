import React from 'react';
import { CheckCircle, Clock, Users, BarChart3, Menu, X } from 'lucide-react';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import Dashboard from './components/Dashboard';

function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState<'home' | 'login' | 'signup' | 'dashboard'>('home');
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

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

  const handleLogout = () => {
    setIsLoggedIn(false);
    handleNavigation('home');
  };

  if (currentPage === 'dashboard') {
    return (
      <Dashboard onLogout={handleLogout} />
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
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-white to-slate-50 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              TaskFlow
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 mb-4 font-light">
              Simple Task Management
            </p>
            <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              Get organized and boost your productivity with our intuitive task management platform. 
              Streamline your workflow, collaborate with your team, and achieve your goals faster.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button 
                onClick={() => handleNavigation('signup')}
                className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium text-lg w-full sm:w-auto"
              >
                Get Started Free
              </button>
              <button 
                onClick={() => handleNavigation('login')}
                className="border-2 border-blue-500 text-blue-500 px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors duration-200 font-medium text-lg w-full sm:w-auto"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
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
            <div className="text-center p-6 rounded-xl hover:shadow-lg transition-shadow duration-300">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Simple Task Management</h3>
              <p className="text-gray-600">
                Create, organize, and track your tasks with our intuitive interface. No complexity, just results.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-6 rounded-xl hover:shadow-lg transition-shadow duration-300">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Time Tracking</h3>
              <p className="text-gray-600">
                Monitor how much time you spend on tasks and projects to optimize your productivity.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-6 rounded-xl hover:shadow-lg transition-shadow duration-300">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Team Collaboration</h3>
              <p className="text-gray-600">
                Work together seamlessly with shared projects, assignments, and real-time updates.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="text-center p-6 rounded-xl hover:shadow-lg transition-shadow duration-300">
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