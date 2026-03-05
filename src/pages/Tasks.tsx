import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, CreditCard as Edit2, CheckSquare, Clock, AlertCircle, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  created_at: string;
}

interface Subtask {
  id: string;
  task_id: string;
  title: string;
  completed: boolean;
  order: number;
}

export default function Tasks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo' as Task['status'],
    priority: 'medium' as Task['priority'],
    due_date: '',
  });
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [subtasks, setSubtasks] = useState<Record<string, Subtask[]>>({});
  const [generatingSubtasks, setGeneratingSubtasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchTasks();
  }, [user, navigate]);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingTask) {
        const { error } = await supabase
          .from('tasks')
          .update({
            title: formData.title,
            description: formData.description || null,
            status: formData.status,
            priority: formData.priority,
            due_date: formData.due_date || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingTask.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tasks')
          .insert({
            user_id: user.id,
            title: formData.title,
            description: formData.description || null,
            status: formData.status,
            priority: formData.priority,
            due_date: formData.due_date || null,
          });

        if (error) throw error;
      }

      setShowModal(false);
      setEditingTask(null);
      setFormData({ title: '', description: '', status: 'todo', priority: 'medium', due_date: '' });
      fetchTasks();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      due_date: task.due_date || '',
    });
    setShowModal(true);
  };

  const fetchSubtasks = async (taskId: string) => {
    try {
      const { data, error } = await supabase
        .from('subtasks')
        .select('*')
        .eq('task_id', taskId)
        .order('order', { ascending: true });

      if (error) throw error;
      setSubtasks(prev => ({ ...prev, [taskId]: data || [] }));
    } catch (error) {
      console.error('Error fetching subtasks:', error);
    }
  };

  const handleToggleExpand = async (taskId: string) => {
    const newExpanded = new Set(expandedTasks);

    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
      if (!subtasks[taskId]) {
        await fetchSubtasks(taskId);
      }
    }

    setExpandedTasks(newExpanded);
  };

  const handleGenerateSubtasks = async (task: Task) => {
    if (generatingSubtasks.has(task.id)) return;

    setGeneratingSubtasks(prev => new Set(prev).add(task.id));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-subtasks`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: task.id,
          taskTitle: task.title,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate subtasks');
      }

      await fetchSubtasks(task.id);

      if (!expandedTasks.has(task.id)) {
        setExpandedTasks(prev => new Set(prev).add(task.id));
      }
    } catch (error) {
      console.error('Error generating subtasks:', error);
      alert(`Failed to generate subtasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setGeneratingSubtasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(task.id);
        return newSet;
      });
    }
  };

  const handleToggleSubtask = async (subtask: Subtask) => {
    try {
      const { error } = await supabase
        .from('subtasks')
        .update({ completed: !subtask.completed })
        .eq('id', subtask.id);

      if (error) throw error;
      await fetchSubtasks(subtask.task_id);
    } catch (error) {
      console.error('Error toggling subtask:', error);
    }
  };


  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckSquare className="w-4 h-4" />;
      case 'in_progress':
        return <Clock className="w-4 h-4" />;
      case 'todo':
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">My Tasks</h2>
          <button
            onClick={() => {
              setEditingTask(null);
              setFormData({ title: '', description: '', status: 'todo', priority: 'medium', due_date: '' });
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>

        {tasks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
            <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No tasks yet. Create your first task to get started!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-2 flex-1">
                      <button
                        onClick={() => handleToggleExpand(task.id)}
                        className="p-1 text-slate-400 hover:text-slate-600 transition mt-0.5"
                      >
                        {expandedTasks.has(task.id) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(task.status)}
                          <h3 className="font-semibold text-slate-900">{task.title}</h3>
                          <span className={`text-xs px-2 py-1 rounded border ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-sm text-slate-600 mb-2">{task.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="capitalize">{task.status.replace('_', ' ')}</span>
                          {task.due_date && (
                            <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(task)}
                        className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {expandedTasks.has(task.id) && (
                  <div className="border-t border-slate-200 bg-slate-50 p-4">
                    {subtasks[task.id] && subtasks[task.id].length > 0 ? (
                      <div className="space-y-2">
                        {subtasks[task.id].map((subtask) => (
                          <div
                            key={subtask.id}
                            className="flex items-center gap-2 text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={subtask.completed}
                              onChange={() => handleToggleSubtask(subtask)}
                              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className={subtask.completed ? 'line-through text-slate-400' : 'text-slate-700'}>
                              {subtask.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : generatingSubtasks.has(task.id) ? (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating subtasks...</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleGenerateSubtasks(task)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Generate subtasks with AI
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">
              {editingTask ? 'Edit Task' : 'New Task'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Task['status'] })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingTask(null);
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {editingTask ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
