import React from 'react';
import { CheckCircle } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-blue-500" />
              <span className="text-xl font-bold text-gray-900">TaskFlow</span>
            </div>
          </div>
        </div>
      </nav>

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
            </p>
          </div>
        </div>
      </section>

      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <CheckCircle className="h-6 w-6 text-blue-500" />
              <span className="text-lg font-semibold text-gray-900">TaskFlow</span>
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
