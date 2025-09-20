import React, { useState, useEffect } from 'react';
import { taskHelpers, subtaskHelpers, aiHelpers } from '../lib/database';
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
  X,
  AlertCircle,
  Save,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  status: 'pending' | 'completed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
}

interface Subtask {
  id: string;
  parent_task_id: string;
  title: string;
  status: 'pending' | 'completed';
  created_at: string;
  updated_at: string;
}

interface CreateTaskData {
  title: string;
  description?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed';
}

interface DashboardProps {
  onLogout: () => void;
  onNavigateHome: () => void;
  user?: any;
}

export default function Dashboard({ onLogout, onNavigateHome, user }: DashboardProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'all-tasks' | 'profile'>('dashboard');
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [subtasks, setSubtasks] = useState<Record<string, Subtask[]>>({});
  const [suggestedSubtasks, setSuggestedSubtasks] = useState<Record<string, string[]>>({});
  const [generatingSubtasks, setGeneratingSubtasks] = useState<Set<string>>(new Set());
  const [taskStats, setTaskStats] = useState({
    total: 0,
    completed: 0,
    pending: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newTask, setNewTask] = useState<CreateTaskData>({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium',
    status: 'pending'
  });
  const [editTask, setEditTask] = useState<CreateTaskData>({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium',
    status: 'pending'
  });

  const userName = user?.user_metadata?.full_name || user?.email || 'User';

  // Load tasks and stats on component mount
  useEffect(() => {
    loadTasks();
    loadTaskStats();
  }, [currentView]);

  const toggleTaskExpansion = async (taskId: string) => {
    const newExpandedTasks = new Set(expandedTasks);
    
    if (expandedTasks.has(taskId)) {
      newExpandedTasks.delete(taskId);
    } else {
      newExpandedTasks.add(taskId);
      // Load subtasks when expanding
      if (!subtasks[taskId]) {
        try {
          const { data, error } = await subtaskHelpers.getSubtasks(taskId);
          if (error) {
            console.error('Error loading subtasks:', error);
          } else {
            setSubtasks(prev => ({ ...prev, [taskId]: data || [] }));
          }
        } catch (err) {
          console.error('Error loading subtasks:', err);
        }
      }
    }
    
    setExpandedTasks(newExpandedTasks);
  };

  const handleGenerateSubtasks = async (taskId: string, taskTitle: string) => {
    setGeneratingSubtasks(prev => new Set(prev).add(taskId));
    setError(null);

    try {
      const { data, error } = await aiHelpers.generateSubtasks(taskTitle);
      if (error) {
        console.error('Error generating subtasks:', error);
        setError('Failed to generate subtasks');
      } else {
        setSuggestedSubtasks(prev => ({ ...prev, [taskId]: data || [] }));
      }
    } catch (err) {
      console.error('Error generating subtasks:', err);
      setError('Failed to generate subtasks');
    } finally {
      setGeneratingSubtasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  const handleSaveSubtask = async (taskId: string, subtaskTitle: string) => {
    try {
      const { data, error } = await subtaskHelpers.createSubtask({
        parent_task_id: taskId,
        title: subtaskTitle,
        status: 'pending'
      });
      
      if (error) {
        console.error('Error saving subtask:', error);
        setError('Failed to save subtask');
      } else {
        // Update local subtasks state
        setSubtasks(prev => ({
          ...prev,
          [taskId]: [...(prev[taskId] || []), data]
        }));
        
        // Remove from suggestions
        setSuggestedSubtasks(prev => ({
          ...prev,
          [taskId]: prev[taskId]?.filter(suggestion => suggestion !== subtaskTitle) || []
        }));
      }
    } catch (err) {
      console.error('Error saving subtask:', err);
      setError('Failed to save subtask');
    }
  };

  const handleSubtaskComplete = async (subtaskId: string, currentStatus: 'pending' | 'completed') => {
    try {
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      const { data, error } = await subtaskHelpers.updateSubtask(subtaskId, { status: newStatus });
      
      if (error) {
        console.error('Error updating subtask:', error);
        setError('Failed to update subtask');
      } else {
        // Update local subtasks state
        setSubtasks(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(taskId => {
            updated[taskId] = updated[taskId].map(subtask =>
              subtask.id === subtaskId ? { ...subtask, status: newStatus } : subtask
            );
          });
          return updated;
        });
      }
    } catch (err) {
      console.error('Error updating subtask:', err);
      setError('Failed to update subtask');
    }
  };

  const loadTasks = async () => {
    try {
      // Load more tasks if viewing all tasks, otherwise just recent tasks
      const { data, error } = currentView === 'all-tasks' 
        ? await taskHelpers.getTasks()
        : await taskHelpers.getRecentTasks(6);
      if (error) {
        setError('Failed to load tasks');
        console.error('Error loading tasks:', error);
      } else {
        setTasks(data || []);
      }
    } catch (err) {
      setError('Failed to load tasks');
      console.error('Error loading tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTaskStats = async () => {
    try {
      const { data, error } = await taskHelpers.getTaskStats();
      if (error) {
        console.error('Error loading task stats:', error);
      } else {
        setTaskStats(data || { total: 0, completed: 0, pending: 0 });
      }
    } catch (err) {
      console.error('Error loading task stats:', err);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleTaskComplete = async (taskId: string, currentStatus: 'pending' | 'completed') => {
    try {
      const { data, error } = await taskHelpers.toggleTaskStatus(taskId, currentStatus);
      if (error) {
        console.error('Error updating task:', error);
        setError('Failed to update task');
      } else {
        // Update local state
        setTasks(tasks.map(task => 
          task.id === taskId 
            ? { ...task, status: data.status }
            : task
        ));
        // Reload stats
        loadTaskStats();
      }
    } catch (err) {
      console.error('Error updating task:', err);
      setError('Failed to update task');
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    try {
      const { error } = await taskHelpers.deleteTask(taskId);
      if (error) {
        console.error('Error deleting task:', error);
        setError('Failed to delete task');
      } else {
        // Update local state
        setTasks(tasks.filter(task => task.id !== taskId));
        // Reload stats
        loadTaskStats();
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task');
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTask.title.trim()) {
      setError('Task title is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const taskData: CreateTaskData = {
        title: newTask.title.trim(),
        description: newTask.description?.trim() || undefined,
        due_date: newTask.due_date || undefined,
        priority: newTask.priority,
        status: newTask.status
      };

      const { data, error } = await taskHelpers.createTask(taskData);
      
      if (error) {
        console.error('Error creating task:', error);
        setError('Failed to create task');
      } else {
        // Reset form
        setNewTask({
          title: '',
          description: '',
          due_date: '',
          priority: 'medium',
          status: 'pending'
        });
        
        // Close modal
        setIsAddTaskModalOpen(false);
        
        // Reload tasks and stats
        loadTasks();
        loadTaskStats();
      }
    } catch (err) {
      console.error('Error creating task:', err);
      setError('Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewTask(prev => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditTask(prev => ({ ...prev, [name]: value }));
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setEditTask({
      title: task.title,
      description: task.description || '',
      due_date: task.due_date || '',
      priority: task.priority,
      status: task.status
    });
    setIsEditTaskModalOpen(true);
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingTask || !editTask.title.trim()) {
      setError('Task title is required');
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      const updateData = {
        title: editTask.title.trim(),
        description: editTask.description?.trim() || undefined,
        due_date: editTask.due_date || undefined,
        priority: editTask.priority,
        status: editTask.status
      };

      const { data, error } = await taskHelpers.updateTask(editingTask.id, updateData);
      
      if (error) {
        console.error('Error updating task:', error);
        setError('Failed to update task');
      } else {
        // Update local state
        setTasks(tasks.map(task => 
          task.id === editingTask.id ? { ...task, ...data } : task
        ));
        
        // Reset form and close modal
        setEditTask({
          title: '',
          description: '',
          due_date: '',
          priority: 'medium',
          status: 'pending'
        });
        setEditingTask(null);
        setIsEditTaskModalOpen(false);
        
        // Reload stats in case status changed
        loadTaskStats();
      }
    } catch (err) {
      console.error('Error updating task:', err);
      setError('Failed to update task');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No due date';
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-8 w-8 text-blue-500 animate-spin" />
          <span className="text-lg text-gray-600">Loading dashboard...</span>
        </div>
      </div>
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
              <button onClick={onNavigateHome} className="text-gray-600 hover:text-blue-500 transition-colors duration-200">
                Home
              </button>
              <button className="text-blue-500 font-medium border-b-2 border-blue-500 pb-1">
                Dashboard
              </button>
              <button 
                onClick={() => setCurrentView('all-tasks')}
                className={`transition-colors duration-200 ${
                  currentView === 'all-tasks' 
                    ? 'text-blue-500 font-medium border-b-2 border-blue-500 pb-1' 
                    : 'text-gray-600 hover:text-blue-500'
                }`}
              >
                All Tasks
              </button>
              <button 
                onClick={() => setCurrentView('profile')}
                className={`transition-colors duration-200 ${
                  currentView === 'profile' 
                    ? 'text-blue-500 font-medium border-b-2 border-blue-500 pb-1' 
                    : 'text-gray-600 hover:text-blue-500'
                }`}
              >
                Profile
              </button>
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
                <button onClick={onNavigateHome} className="block px-3 py-2 text-gray-600 hover:text-blue-500 transition-colors duration-200 w-full text-left">
                  Home
                </button>
                <button className="block px-3 py-2 text-blue-500 font-medium w-full text-left">
                  Dashboard
                </button>
                <button 
                  onClick={() => {
                    setCurrentView('all-tasks');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`block px-3 py-2 transition-colors duration-200 w-full text-left ${
                    currentView === 'all-tasks' 
                      ? 'text-blue-500 font-medium' 
                      : 'text-gray-600 hover:text-blue-500'
                  }`}
                >
                  All Tasks
                </button>
                <button 
                  onClick={() => {
                    setCurrentView('profile');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`block px-3 py-2 transition-colors duration-200 w-full text-left ${
                    currentView === 'profile' 
                      ? 'text-blue-500 font-medium' 
                      : 'text-gray-600 hover:text-blue-500'
                  }`}
                >
                  Profile
                </button>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {currentView === 'dashboard' && 'Dashboard'}
            {currentView === 'all-tasks' && 'All Tasks'}
            {currentView === 'profile' && 'Profile'}
          </h1>
          <p className="text-lg text-gray-600">
            {currentView === 'dashboard' && `Welcome back, ${userName}`}
            {currentView === 'all-tasks' && 'Manage all your tasks'}
            {currentView === 'profile' && 'Your account settings'}
          </p>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-700">{error}</span>
              <button 
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          )}
        </div>

          {/* Profile View */}
          {currentView === 'profile' && (
            <div className="space-y-8">
              {/* User Information Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-xl font-semibold text-gray-900">Account Information</h2>
                </div>
                <div className="px-6 py-6">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="bg-blue-100 p-4 rounded-full">
                      <User className="h-8 w-8 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{userName}</h3>
                      <p className="text-gray-600">{user?.email}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                        {user?.user_metadata?.full_name || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                        {user?.email}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Created
                      </label>
                      <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                        {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Sign In
                      </label>
                      <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                        {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Task Statistics Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-xl font-semibold text-gray-900">Task Statistics</h2>
                </div>
                <div className="px-6 py-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="bg-blue-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                        <BarChart3 className="h-8 w-8 text-blue-500" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mb-1">{taskStats.total}</p>
                      <p className="text-sm text-gray-600">Total Tasks</p>
                    </div>
                    <div className="text-center">
                      <div className="bg-green-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                        <CheckCircle className="h-8 w-8 text-green-500" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mb-1">{taskStats.completed}</p>
                      <p className="text-sm text-gray-600">Completed</p>
                    </div>
                    <div className="text-center">
                      <div className="bg-yellow-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                        <Clock className="h-8 w-8 text-yellow-500" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mb-1">{taskStats.pending}</p>
                      <p className="text-sm text-gray-600">Pending</p>
                    </div>
                  </div>
                  
                  {/* Completion Rate */}
                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">Completion Rate</p>
                      <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                        <div 
                          className="bg-green-500 h-3 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">
                        {taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Actions Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-xl font-semibold text-gray-900">Account Actions</h2>
                </div>
                <div className="px-6 py-6">
                  <div className="space-y-4">
                    <button className="w-full md:w-auto bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium">
                      Update Profile
                    </button>
                    <button className="w-full md:w-auto ml-0 md:ml-4 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium">
                      Change Password
                    </button>
                    <button 
                      onClick={onLogout}
                      className="w-full md:w-auto ml-0 md:ml-4 bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors duration-200 font-medium flex items-center justify-center space-x-2"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dashboard and All Tasks Views */}
          {(currentView === 'dashboard' || currentView === 'all-tasks') && (
            <>
              {/* Quick Stats Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
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

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
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

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
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

              {/* Add New Task Button */}
              <div className="mb-8">
                <button 
                  onClick={() => setIsAddTaskModalOpen(true)}
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium flex items-center space-x-2"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add New Task</span>
                </button>
              </div>

              {/* Tasks Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {currentView === 'dashboard' ? 'Recent Tasks' : 'All Tasks'}
                  </h2>
                </div>
                
                <div className="divide-y divide-gray-100">
                  {tasks.map((task) => (
                    <div key={task.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <div className="px-6 py-4">
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
                          
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => toggleTaskExpansion(task.id)}
                              className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors duration-200"
                              title="Show subtasks"
                            >
                              {expandedTasks.has(task.id) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleTaskComplete(task.id, task.status)}
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
                              onClick={() => handleEditTask(task)}
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

                      {/* Expanded Task Content */}
                      {expandedTasks.has(task.id) && (
                        <div className="px-6 pb-4 border-t border-gray-100 bg-gray-50">
                          <div className="pt-4">
                            {/* Generate Subtasks Button */}
                            <div className="mb-4">
                              <button
                                onClick={() => handleGenerateSubtasks(task.id, task.title)}
                                disabled={generatingSubtasks.has(task.id)}
                                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium flex items-center space-x-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Sparkles className="h-4 w-4" />
                                <span>
                                  {generatingSubtasks.has(task.id) ? 'Generating...' : 'Generate Subtasks with AI'}
                                </span>
                              </button>
                            </div>

                            {/* AI Suggested Subtasks */}
                            {suggestedSubtasks[task.id] && suggestedSubtasks[task.id].length > 0 && (
                              <div className="mb-4">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">AI Suggested Subtasks:</h4>
                                <div className="space-y-2">
                                  {suggestedSubtasks[task.id].map((suggestion, index) => (
                                    <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                                      <span className="text-sm text-gray-700">{suggestion}</span>
                                      <button
                                        onClick={() => handleSaveSubtask(task.id, suggestion)}
                                        className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600 transition-colors duration-200 font-medium"
                                      >
                                        Save
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Existing Subtasks */}
                            {subtasks[task.id] && subtasks[task.id].length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Subtasks:</h4>
                                <div className="space-y-2">
                                  {subtasks[task.id].map((subtask) => (
                                    <div key={subtask.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                                      <div className="flex items-center space-x-3">
                                        <button
                                          onClick={() => handleSubtaskComplete(subtask.id, subtask.status)}
                                          className={`p-1 rounded transition-colors duration-200 ${
                                            subtask.status === 'completed'
                                              ? 'text-green-600 hover:bg-green-50'
                                              : 'text-gray-400 hover:bg-gray-100 hover:text-green-600'
                                          }`}
                                        >
                                          <Check className="h-3 w-3" />
                                        </button>
                                        <span className={`text-sm ${
                                          subtask.status === 'completed' 
                                            ? 'text-gray-500 line-through' 
                                            : 'text-gray-700'
                                        }`}>
                                          {subtask.title}
                                        </span>
                                      </div>
                                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        subtask.status === 'completed' 
                                          ? 'text-green-600 bg-green-50' 
                                          : 'text-yellow-600 bg-yellow-50'
                                      }`}>
                                        {subtask.status === 'completed' ? 'Done' : 'Pending'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {tasks.length === 0 && !isLoading && (
                  <div className="px-6 py-12 text-center">
                    <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No tasks yet. Create your first task to get started!</p>
                  </div>
                )}
              </div>
            </>
          )}
      </main>

      {/* Add Task Modal */}
      {isAddTaskModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Add New Task</h3>
                <button
                  onClick={() => setIsAddTaskModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleAddTask} className="px-6 py-4 space-y-4">
              {/* Title Field */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Task Title *
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  value={newTask.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  placeholder="Enter task title"
                />
              </div>

              {/* Description Field */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={newTask.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  placeholder="Enter task description (optional)"
                />
              </div>

              {/* Due Date Field */}
              <div>
                <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <input
                  id="due_date"
                  name="due_date"
                  type="date"
                  value={newTask.due_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                />
              </div>

              {/* Priority Field */}
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={newTask.priority}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              {/* Status Field */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={newTask.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddTaskModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newTask.title.trim()}
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{isSubmitting ? 'Creating...' : 'Create Task'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {isEditTaskModalOpen && editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Edit Task</h3>
                <button
                  onClick={() => {
                    setIsEditTaskModalOpen(false);
                    setEditingTask(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdateTask} className="px-6 py-4 space-y-4">
              {/* Title Field */}
              <div>
                <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-2">
                  Task Title *
                </label>
                <input
                  id="edit-title"
                  name="title"
                  type="text"
                  required
                  value={editTask.title}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  placeholder="Enter task title"
                />
              </div>

              {/* Description Field */}
              <div>
                <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="edit-description"
                  name="description"
                  rows={3}
                  value={editTask.description}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  placeholder="Enter task description (optional)"
                />
              </div>

              {/* Due Date Field */}
              <div>
                <label htmlFor="edit-due_date" className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <input
                  id="edit-due_date"
                  name="due_date"
                  type="date"
                  value={editTask.due_date}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                />
              </div>

              {/* Priority Field */}
              <div>
                <label htmlFor="edit-priority" className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  id="edit-priority"
                  name="priority"
                  value={editTask.priority}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              {/* Status Field */}
              <div>
                <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  id="edit-status"
                  name="status"
                  value={editTask.status}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditTaskModalOpen(false);
                    setEditingTask(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating || !editTask.title.trim()}
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{isUpdating ? 'Updating...' : 'Update Task'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}