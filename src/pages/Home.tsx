import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, Menu, X, CheckCircle2, CreditCard as Edit3, Lock, ListTodo } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const elements = document.querySelectorAll('.fade-in-on-scroll');
      elements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight - 100;
        if (isVisible) {
          element.classList.add('visible');
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-cream">
      <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-2">
              <Leaf className="w-8 h-8 text-sage" />
              <span className="text-2xl font-bold text-charcoal">TaskFlow</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <button
                onClick={() => scrollToSection('home')}
                className="text-base font-semibold text-charcoal hover:text-sage transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="text-base font-semibold text-charcoal hover:text-sage transition-colors"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="text-base font-semibold text-charcoal hover:text-sage transition-colors"
              >
                How It Works
              </button>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Link
                to="/login"
                className="px-5 py-2.5 border-2 border-sage text-sage rounded-xl font-semibold hover:bg-sage hover:bg-opacity-5 transition-all text-base"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="px-5 py-2.5 bg-sage text-white rounded-xl font-semibold hover:bg-[#6B9D6F] transition-all shadow-sm text-base"
              >
                Get Started Free
              </Link>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-charcoal"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100">
            <div className="px-4 py-4 space-y-3">
              <button
                onClick={() => scrollToSection('home')}
                className="block w-full text-left px-4 py-2 text-base font-semibold text-charcoal hover:bg-softGreen rounded-lg transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="block w-full text-left px-4 py-2 text-base font-semibold text-charcoal hover:bg-softGreen rounded-lg transition-colors"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="block w-full text-left px-4 py-2 text-base font-semibold text-charcoal hover:bg-softGreen rounded-lg transition-colors"
              >
                How It Works
              </button>
              <Link
                to="/login"
                className="block w-full text-center px-5 py-2.5 border-2 border-sage text-sage rounded-xl font-semibold hover:bg-sage hover:bg-opacity-5 transition-all text-base"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="block w-full text-center px-5 py-2.5 bg-sage text-white rounded-xl font-semibold hover:bg-[#6B9D6F] transition-all shadow-sm text-base"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        )}
      </nav>

      <section id="home" className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="fade-in-on-scroll">
              <h1 className="text-5xl sm:text-6xl font-bold text-charcoal mb-6 leading-tight">
                Stay Organized.<br />Get Things Done.
              </h1>
              <p className="text-xl text-mutedGray mb-8 leading-relaxed">
                Manage your daily tasks simply and beautifully.
              </p>
            </div>

            <div className="fade-in-on-scroll lg:pl-8">
              <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md mx-auto">
                <h3 className="text-xl font-bold text-charcoal mb-4">Today's Tasks</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-4 bg-softGreen rounded-xl">
                    <div className="w-5 h-5 rounded border-2 border-sage flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg
                        className="w-4 h-4 text-sage"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-charcoal line-through">Morning workout</p>
                      <p className="text-sm text-mutedGray">Completed</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-white border-2 border-gray-100 rounded-xl">
                    <div className="w-5 h-5 rounded border-2 border-sage flex-shrink-0 mt-0.5"></div>
                    <div className="flex-1">
                      <p className="font-semibold text-charcoal">Finish project proposal</p>
                      <p className="text-sm text-mutedGray">Due today</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-white border-2 border-gray-100 rounded-xl">
                    <div className="w-5 h-5 rounded border-2 border-sage flex-shrink-0 mt-0.5"></div>
                    <div className="flex-1">
                      <p className="font-semibold text-charcoal">Team meeting at 3pm</p>
                      <p className="text-sm text-mutedGray">In progress</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 fade-in-on-scroll">
            <h2 className="text-4xl sm:text-5xl font-bold text-charcoal mb-4">
              Everything You Need
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="fade-in-on-scroll bg-cream rounded-2xl p-8 text-center hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-sage bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-5">
                <ListTodo className="w-8 h-8 text-sage" />
              </div>
              <h3 className="text-xl font-bold text-charcoal mb-3">Add & Organize Tasks</h3>
              <p className="text-mutedGray leading-relaxed">
                Create tasks with titles, descriptions, and due dates to stay on top of everything.
              </p>
            </div>

            <div className="fade-in-on-scroll bg-cream rounded-2xl p-8 text-center hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-coral bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-5">
                <Edit3 className="w-8 h-8 text-coral" />
              </div>
              <h3 className="text-xl font-bold text-charcoal mb-3">Edit Anytime</h3>
              <p className="text-mutedGray leading-relaxed">
                Update your tasks whenever you need. Change details, dates, or priorities easily.
              </p>
            </div>

            <div className="fade-in-on-scroll bg-cream rounded-2xl p-8 text-center hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-sage bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-8 h-8 text-sage" />
              </div>
              <h3 className="text-xl font-bold text-charcoal mb-3">Mark as Complete</h3>
              <p className="text-mutedGray leading-relaxed">
                Check off tasks as you complete them and feel the satisfaction of progress.
              </p>
            </div>

            <div className="fade-in-on-scroll bg-cream rounded-2xl p-8 text-center hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-charcoal bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-5">
                <Lock className="w-8 h-8 text-charcoal" />
              </div>
              <h3 className="text-xl font-bold text-charcoal mb-3">Your Tasks, Private</h3>
              <p className="text-mutedGray leading-relaxed">
                Your data is secure and private. Only you can see and manage your tasks.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 fade-in-on-scroll">
            <h2 className="text-4xl sm:text-5xl font-bold text-charcoal mb-4">
              How It Works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="fade-in-on-scroll text-center">
              <div className="w-20 h-20 bg-sage text-white rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold shadow-lg">
                1
              </div>
              <h3 className="text-2xl font-bold text-charcoal mb-3">Create Account</h3>
              <p className="text-mutedGray text-lg leading-relaxed">
                Sign up for free in seconds. No credit card required.
              </p>
            </div>

            <div className="fade-in-on-scroll text-center">
              <div className="w-20 h-20 bg-sage text-white rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold shadow-lg">
                2
              </div>
              <h3 className="text-2xl font-bold text-charcoal mb-3">Add Tasks</h3>
              <p className="text-mutedGray text-lg leading-relaxed">
                Start adding your tasks and organizing your day.
              </p>
            </div>

            <div className="fade-in-on-scroll text-center">
              <div className="w-20 h-20 bg-sage text-white rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold shadow-lg">
                3
              </div>
              <h3 className="text-2xl font-bold text-charcoal mb-3">Stay on Track</h3>
              <p className="text-mutedGray text-lg leading-relaxed">
                Check off tasks and watch your productivity soar.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-sage">
        <div className="max-w-4xl mx-auto text-center fade-in-on-scroll">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to Get Organized?
          </h2>
          <p className="text-xl text-white text-opacity-90 mb-8">
            Join thousands of people who stay productive with TaskFlow
          </p>
          <Link
            to="/signup"
            className="inline-block px-10 py-4 bg-white text-sage rounded-xl font-bold hover:bg-cream transition-all shadow-lg text-lg"
          >
            Create Free Account
          </Link>
        </div>
      </section>

      <footer className="bg-white py-8 px-4 sm:px-6 lg:px-8 border-t border-gray-100">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-mutedGray text-base">
            2026 TaskFlow. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              to="/login"
              className="text-base font-semibold text-charcoal hover:text-sage transition-colors"
            >
              Log In
            </Link>
            <Link
              to="/signup"
              className="text-base font-semibold text-charcoal hover:text-sage transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
