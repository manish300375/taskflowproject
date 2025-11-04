import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Menu, X } from 'lucide-react';

interface NavigationProps {
  isLoggedIn: boolean;
  user: any;
  onLogout: () => void;
}

export default function Navigation({ isLoggedIn, user, onLogout }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const navigate = useNavigate();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = async () => {
    try {
      await onLogout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <CheckCircle className="h-8 w-8 text-blue-500" />
            <span className="text-xl font-bold text-gray-900">TaskFlow</span>
          </Link>

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
                <Link 
                  to="/login"
                  className="text-gray-600 hover:text-blue-500 transition-colors duration-200 px-4 py-2"
                >
                  Login
                </Link>
                <Link 
                  to="/signup"
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                <Link 
                  to="/dashboard"
                  className="text-blue-500 hover:text-blue-600 transition-colors duration-200 px-4 py-2 font-medium"
                >
                  Dashboard
                </Link>
                <Link 
                  to="/archive"
                  className="text-gray-600 hover:text-blue-500 transition-colors duration-200 px-4 py-2"
                >
                  Archive
                </Link>
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
                  <Link 
                    to="/login"
                    className="text-gray-600 hover:text-blue-500 transition-colors duration-200 px-4 py-2 text-left"
                  >
                    Login
                  </Link>
                  <Link 
                    to="/signup"
                    className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium"
                  >
                    Sign Up
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col space-y-2 px-3 pt-4">
                  <Link 
                    to="/dashboard"
                    className="text-blue-500 hover:text-blue-600 transition-colors duration-200 px-4 py-2 text-left font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/archive"
                    className="text-gray-600 hover:text-blue-500 transition-colors duration-200 px-4 py-2 text-left"
                  >
                    Archive
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="text-gray-600 hover:text-red-500 transition-colors duration-200 px-4 py-2 text-left"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
