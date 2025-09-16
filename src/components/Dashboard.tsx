import React, { useState } from 'react';
import { 
  CheckCircle, 
  Clock, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  Calendar,
  BarChart3,
  User,
  LogOut,
  Menu,
  X
} from 'lucide-react';

interface Task {
  id: number;
  title: string;
  dueDate: string;
  status: 'pending' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

interface DashboardProps {
  onLogout: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      title: 'Complete project proposal',
      dueDate: '2025-01-15',
      status: 'pending',
      priority: 'high'
    },
    {
      id: 2,
      title: 'Review team feedback',
      dueDate: '2025-01-12',
      status: 'completed',
      priority: 'medium'
    },
    {
      id: 3,
      title: 'Update documentation',
      dueDate: '2025-01-18',
      status: 'pending',
      priority: 'low'
    },
    {
      id: 4,
      title: 'Schedule client meeting',
      dueDate: '2025-01-14',
      status: 'pending',
      priority: 'high'
    },
    {
      id: 5,
      title: 'Prepare presentation slides',
      dueDate: '2025-01-16',
      status: 'completed',
      priority: 'medium'
    },
    {
      id: 6,
      title: 'Code review for new feature',
      dueDate: '2025-01-13',
      status: 'pending',
      priority: 'high'
    }
  ]);

  const userName = 'John Doe'; // This would come from authentication context

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleTaskComplete = (taskId: number) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, status: task.status === 'completed' ? 'pending' : 'completed' }
        : task
    ));
  };

  const handleTaskDelete = (taskId: number) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const pendingTasks = totalTasks - completedTasks;
  const recentTasks = tasks.slice(0, 6);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

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
              <a href="#dashboard" className="text-blue-500 font-medium border-b-2 border-blue-500 pb-1">
                Dashboard
              </a>
              <a href="#tasks" className="text-gray-600 hover:text-blue-500 transition-colors duration-200">
                All Tasks
              </a>
              <a href="#profile" className="text-gray-600 hover:text-blue-500 transition-colors duration-200">
                Profile
              </a>
            </div>

            {/* Desktop Logout Button */}
            <div className="hidden md:flex items-center">
              <button 
                onClick={onLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-red-500 transition-colors duration-200 px-4 py-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
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
                <a href="#dashboard" className="block px-3 py-2 text-blue-500 font-medium">
                  Dashboard
                </a>
                <a href="#tasks" className="block px-3 py-2 text-gray-600 hover:text-blue-500 transition-colors duration-200">
                  All Tasks
                </a>
                <a href="#profile" className="block px-3 py-2 text-gray-600 hover:text-blue-500 transition-colors duration-200">
                  Profile
                </a>
                <button 
                  onClick={onLogout}
                  className="flex items-center space-x-2 w-full text-left px-3 py-2 text-gray-600 hover:text-red-500 transition-colors duration-200"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-lg text-gray-600">Welcome back, {userName}</p>
        </div>

        {/* Quick Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <BarChart3 className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{totalTasks}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{completedTasks}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{pendingTasks}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Add New Task Button */}
        <div className="mb-8">
          <button className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Add New Task</span>
          </button>
        </div>

        {/* Recent Tasks Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">Recent Tasks</h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            {recentTasks.map((task) => (
              <div key={task.id} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className={`font-medium ${task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                        {task.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(task.dueDate)}</span>
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
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleTaskComplete(task.id)}
                      className={`p-2 rounded-lg transition-colors duration-200 ${
                        task.status === 'completed'
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-gray-400 hover:bg-gray-100 hover:text-green-600'
                      }`}
                      title={task.status === 'completed' ? 'Mark as pending' : 'Mark as complete'}
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      className="p-2 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                      title="Edit task"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleTaskDelete(task.id)}
                      className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                      title="Delete task"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {recentTasks.length === 0 && (
            <div className="px-6 py-12 text-center">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No tasks yet. Create your first task to get started!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}