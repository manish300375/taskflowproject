import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  created_at: string;
  user_id: string;
}

interface TaskModalProps {
  task: Task | null;
  onClose: () => void;
  onSave: () => void;
}

export default function TaskModal({ task, onClose, onSave }: TaskModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending' as Task['status'],
    priority: 'medium' as Task['priority'],
    due_date: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        due_date: task.due_date || '',
      });
    }
  }, [task]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !validateForm()) return;

    setLoading(true);

    try {
      if (task) {
        const { error } = await supabase
          .from('tasks')
          .update({
            title: formData.title.trim(),
            description: formData.description.trim() || null,
            status: formData.status,
            priority: formData.priority,
            due_date: formData.due_date || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', task.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('tasks').insert({
          user_id: user.id,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          status: formData.status,
          priority: formData.priority,
          due_date: formData.due_date || null,
        });

        if (error) throw error;
      }

      onSave();
    } catch (error) {
      console.error('Error saving task:', error);
      setErrors({ general: 'Failed to save task. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-card shadow-soft max-w-lg w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-mutedGray hover:text-charcoal transition-all"
          aria-label="Close modal"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-charcoal mb-6">
          {task ? 'Edit Task' : 'Add New Task'}
        </h2>

        {errors.general && (
          <div className="mb-6 p-4 bg-red-50 border border-softRed rounded-button text-softRed text-sm">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="title" className="block text-base font-semibold text-charcoal mb-2">
              Task Title
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                if (errors.title) {
                  setErrors({ ...errors, title: '' });
                }
              }}
              className={`w-full px-4 py-3 text-base border ${
                errors.title ? 'border-softRed' : 'border-gray-300'
              } rounded-button focus:ring-2 focus:ring-sage focus:border-transparent outline-none transition`}
              placeholder="Enter task title"
            />
            {errors.title && <p className="mt-2 text-sm text-softRed">{errors.title}</p>}
          </div>

          <div>
            <label htmlFor="description" className="block text-base font-semibold text-charcoal mb-2">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-button focus:ring-2 focus:ring-sage focus:border-transparent outline-none transition resize-none"
              placeholder="Add more details about this task"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="status" className="block text-base font-semibold text-charcoal mb-2">
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as Task['status'] })
                }
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-button focus:ring-2 focus:ring-sage focus:border-transparent outline-none transition"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="block text-base font-semibold text-charcoal mb-2">
                Priority
              </label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value as Task['priority'] })
                }
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-button focus:ring-2 focus:ring-sage focus:border-transparent outline-none transition"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="due_date" className="block text-base font-semibold text-charcoal mb-2">
              Due Date (Optional)
            </label>
            <input
              type="date"
              id="due_date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-button focus:ring-2 focus:ring-sage focus:border-transparent outline-none transition"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-5 py-3 border-2 border-gray-300 text-charcoal rounded-button text-base font-semibold hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-5 py-3 bg-sage text-white rounded-button text-base font-semibold hover:bg-[#6B9D6F] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : task ? 'Update Task' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
