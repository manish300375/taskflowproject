import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  Plus,
  Calendar,
  BarChart3,
  Edit3,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  AlertCircle,
  Home,
  LogOut,
  Sparkles,
  Save
} from 'lucide-react';
import { taskHelpers, subtaskHelpers, aiHelpers, Task, Subtask, CreateTaskData, UpdateTaskData } from '../lib/database';
import ProfileSection from './ProfileSection';

interface DashboardProps {
  onLogout: () => void;
  onNavigateHome: () => void;
  user: any;
}

export default function Dashboard({ onLogout, onNavigateHome, user }: DashboardProps) {
  const [currentView, setCurrentView] = useState<'tasks' | 'profile'>('tasks');
  const [currentUser, setCurrentUser] = useState(user);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subtasks, setSubtasks] = useState<{ [taskId: string]: Subtask[] }>({});
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [generatingSubtasks, setGeneratingSubtasks] = useState<string | null>(null);
  const [taskStats, setTaskStats] = useState({
    total: 0,
    completed: 0,
    pending: 0
  });

  const [newTask, setNewTask] = useState<CreateTaskData>({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium',
    status: 'pending'
  });

  const [editTask, setEditTask] = useState<UpdateTaskData>({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium',
    status: 'pending'
  });

  useEffect(() => {
    loadTasks();
    loadTaskStats();
  }, []);

  useEffect(() => {
    setCurrentUser(user);
  }, [user]);
  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await taskHelpers.getTasks();
      if (error) {
        console.error('Error loading tasks:', error);
      } else {
        setTasks(data || []);
        // Load subtasks for each task
        if (data) {
          for (const task of data) {
            await loadSubtasks(task.id);
          }
        }
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSubtasks = async (taskId: string) => {
    try {
      const { data, error } = await subtaskHelpers.getSubtasks(taskId);
      if (error) {
        console.error('Error loading subtasks:', error);
      } else {
        setSubtasks(prev => ({
          ...prev,
          [taskId]: data || []
        }));
      }
    } catch (error) {
      console.error('Error loading subtasks:', error);
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
    } catch (error) {
      console.error('Error loading task stats:', error);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    try {
      const { data, error } = await taskHelpers.createTask(newTask);
      if (error) {
        console.error('Error creating task:', error);
      } else {
        setTasks(prev => [data, ...prev]);
        setNewTask({
          title: '',
          description: '',
          due_date: '',
          priority: 'medium',
          status: 'pending'
        });
        setShowCreateForm(false);
        loadTaskStats();
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleUpdateTask = async (taskId: string) => {
    if (!editTask.title?.trim()) return;

    try {
      const { data, error } = await taskHelpers.updateTask(taskId, editTask);
      if (error) {
        console.error('Error updating task:', error);
      } else {
        setTasks(prev => prev.map(task => task.id === taskId ? data : task));
        setEditingTask(null);
        setEditTask({
          title: '',
          description: '',
          due_date: '',
          priority: 'medium',
          status: 'pending'
        });
        loadTaskStats();
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const { error } = await taskHelpers.deleteTask(taskId);
      if (error) {
        console.error('Error deleting task:', error);
      } else {
        setTasks(prev => prev.filter(task => task.id !== taskId));
        setSubtasks(prev => {
          const newSubtasks = { ...prev };
          delete newSubtasks[taskId];
          return newSubtasks;
        });
        loadTaskStats();
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleToggleTaskStatus = async (taskId: string, currentStatus: 'pending' | 'completed') => {
    try {
      const { data, error } = await taskHelpers.toggleTaskStatus(taskId, currentStatus);
      if (error) {
        console.error('Error toggling task status:', error);
      } else {
        setTasks(prev => prev.map(task => task.id === taskId ? data : task));
        loadTaskStats();
      }
    } catch (error) {
      console.error('Error toggling task status:', error);
    }
  };

  const handleToggleSubtaskStatus = async (subtaskId: string, currentStatus: 'pending' | 'completed', taskId: string) => {
    try {
      const { data, error } = await subtaskHelpers.toggleSubtaskStatus(subtaskId, currentStatus);
      if (error) {
        console.error('Error toggling subtask status:', error);
      } else {
        setSubtasks(prev => ({
          ...prev,
          [taskId]: prev[taskId]?.map(subtask => subtask.id === subtaskId ? data : subtask) || []
        }));
      }
    } catch (error) {
      console.error('Error toggling subtask status:', error);
    }
  };

  const handleGenerateSubtasks = async (taskId: string, taskTitle: string) => {
    setGeneratingSubtasks(taskId);
    try {
      const { data, error } = await aiHelpers.generateSubtasks(taskTitle);
      if (error) {
        console.error('Error generating subtasks:', error);
        alert('Failed to generate subtasks. Please try again.');
      } else if (data && Array.isArray(data)) {
        // Create subtasks in the database
        for (const subtaskTitle of data) {
          await subtaskHelpers.createSubtask({
            parent_task_id: taskId,
            title: subtaskTitle,
            status: 'pending'
          });
        }
        // Reload subtasks for this task
        await loadSubtasks(taskId);
        // Expand the task to show the new subtasks
        setExpandedTasks(prev => new Set([...prev, taskId]));
      }
    } catch (error) {
      console.error('Error generating subtasks:', error);
      alert('Failed to generate subtasks. Please try again.');
    } finally {
      setGeneratingSubtasks(null);
    }
  };

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const startEditingTask = (task: Task) => {
    setEditingTask(task.id);
    setEditTask({
      title: task.title,
      description: task.description || '',
      due_date: task.due_date || '',
      priority: task.priority,
      status: task.status
    });
  };

  const cancelEditing = () => {
    setEditingTask(null);
    setEditTask({
      title: '',
      description: '',
      due_date: '',
      priority: 'medium',
      status: 'pending'
    });
  };

  const handleUserUpdate = (updatedUser: any) => {
    setCurrentUser(updatedUser);
  };
  const formatDate = (dateString: string) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric' 
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'completed' 
      ? 'text-green-600 bg-green-50 border-green-200' 
      : 'text-yellow-600 bg-yellow-50 border-yellow-200';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-8 w-8 text-blue-500 animate-spin" />
          <span className="text-lg text-gray-600">Loading your tasks...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-8 w-8 text-blue-500" />
                <span className="text-xl font-bold text-gray-900">TaskFlow</span>
              </div>
              <span className="text-gray-400">|</span>
              <nav className="flex space-x-6">
                <button
                  onClick={() => setCurrentView('tasks')}
                  className={`text-sm font-medium transition-colors duration-200 ${
                    currentView === 'tasks' 
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-4' 
                      : 'text-gray-600 hover:text-blue-500'
                  }`}
                >
                  Tasks
                </button>
                <button
                  onClick={() => setCurrentView('profile')}
                  className={`text-sm font-medium transition-colors duration-200 ${
                    currentView === 'profile' 
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-4' 
                      : 'text-gray-600 hover:text-blue-500'
                  }`}
                >
                  Profile
                </button>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={onNavigateHome}
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-500 transition-colors duration-200"
              >
                <Home className="h-5 w-5" />
                <span>Home</span>
              </button>
              <span className="text-gray-300">|</span>
              <div className="flex items-center space-x-2">
                {currentUser?.user_metadata?.avatar_url && (
                  <img
                    src={currentUser.user_metadata.avatar_url}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
                <span className="text-gray-600">
                  {currentUser?.user_metadata?.full_name || currentUser?.email || 'User'}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-red-500 transition-colors duration-200"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'profile' ? (
          <ProfileSection user={currentUser} onUserUpdate={handleUserUpdate} />
        ) : (
          <>
        {/* Stats Cards */}
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

        {/* Create Task Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Create New Task</span>
          </button>
        </div>

        {/* Create Task Form */}
        {showCreateForm && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New Task</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter task title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter task description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask(prev => ({ ...prev, due_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Create Task</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tasks List */}
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-100 text-center">
              <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
              <p className="text-gray-600 mb-6">Create your first task to get started with TaskFlow!</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium flex items-center space-x-2 mx-auto"
              >
                <Plus className="h-5 w-5" />
                <span>Create Your First Task</span>
              </button>
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="bg-white rounded-lg shadow-sm border border-gray-100">
                {/* Task Header */}
                <div className="p-6">
                  {editingTask === task.id ? (
                    // Edit Form
                    <form onSubmit={(e) => { e.preventDefault(); handleUpdateTask(task.id); }} className="space-y-4">
                      <div>
                        <input
                          type="text"
                          value={editTask.title}
                          onChange={(e) => setEditTask(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-lg"
                          required
                        />
                      </div>

                      <div>
                        <textarea
                          value={editTask.description}
                          onChange={(e) => setEditTask(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Task description"
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <input
                            type="date"
                            value={editTask.due_date}
                            onChange={(e) => setEditTask(prev => ({ ...prev, due_date: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <select
                            value={editTask.priority}
                            onChange={(e) => setEditTask(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="low">Low Priority</option>
                            <option value="medium">Medium Priority</option>
                            <option value="high">High Priority</option>
                          </select>
                        </div>

                        <div>
                          <select
                            value={editTask.status}
                            onChange={(e) => setEditTask(prev => ({ ...prev, status: e.target.value as 'pending' | 'completed' }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex space-x-3">
                        <button
                          type="submit"
                          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium flex items-center space-x-2"
                        >
                          <Save className="h-4 w-4" />
                          <span>Save</span>
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditing}
                          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    // Task Display
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <button
                              onClick={() => handleToggleTaskStatus(task.id, task.status)}
                              className={`p-1 rounded-full transition-colors duration-200 ${
                                task.status === 'completed' 
                                  ? 'text-green-500 hover:text-green-600' 
                                  : 'text-gray-400 hover:text-green-500'
                              }`}
                            >
                              <CheckCircle className={`h-6 w-6 ${task.status === 'completed' ? 'fill-current' : ''}`} />
                            </button>
                            <h3 className={`text-xl font-semibold ${
                              task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'
                            }`}>
                              {task.title}
                            </h3>
                          </div>

                          {task.description && (
                            <p className={`text-gray-600 mb-3 ml-9 ${
                              task.status === 'completed' ? 'line-through' : ''
                            }`}>
                              {task.description}
                            </p>
                          )}

                          <div className="flex items-center space-x-4 ml-9">
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(task.due_date || '')}</span>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(task.priority)}`}>
                              {task.priority} priority
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(task.status)}`}>
                              {task.status}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleGenerateSubtasks(task.id, task.title)}
                            disabled={generatingSubtasks === task.id}
                            className="p-2 text-purple-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors duration-200 disabled:opacity-50"
                            title="Generate AI subtasks"
                          >
                            {generatingSubtasks === task.id ? (
                              <div className="animate-spin">
                                <Sparkles className="h-5 w-5" />
                              </div>
                            ) : (
                              <Sparkles className="h-5 w-5" />
                            )}
                          </button>
                          <button
                            onClick={() => startEditingTask(task)}
                            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                          >
                            <Edit3 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                          {subtasks[task.id] && subtasks[task.id].length > 0 && (
                            <button
                              onClick={() => toggleTaskExpansion(task.id)}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                            >
                              {expandedTasks.has(task.id) ? (
                                <ChevronUp className="h-5 w-5" />
                              ) : (
                                <ChevronDown className="h-5 w-5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Subtasks */}
                {subtasks[task.id] && subtasks[task.id].length > 0 && expandedTasks.has(task.id) && (
                  <div className="border-t border-gray-100 bg-gray-50">
                    <div className="p-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Subtasks</h4>
                      <div className="space-y-2">
                        {subtasks[task.id].map((subtask) => (
                          <div key={subtask.id} className="flex items-center space-x-3 p-2 bg-white rounded border">
                            <button
                              onClick={() => handleToggleSubtaskStatus(subtask.id, subtask.status, task.id)}
                              className={`p-1 rounded-full transition-colors duration-200 ${
                                subtask.status === 'completed' 
                                  ? 'text-green-500 hover:text-green-600' 
                                  : 'text-gray-400 hover:text-green-500'
                              }`}
                            >
                              <CheckCircle className={`h-4 w-4 ${subtask.status === 'completed' ? 'fill-current' : ''}`} />
                            </button>
                            <span className={`flex-1 text-sm ${
                              subtask.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-700'
                            }`}>
                              {subtask.title}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              subtask.status === 'completed' 
                                ? 'text-green-600 bg-green-50' 
                                : 'text-yellow-600 bg-yellow-50'
                            }`}>
                              {subtask.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
          </>
        )}
      </main>
    </div>
  );
}