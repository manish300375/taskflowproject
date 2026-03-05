import { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';

interface AddTaskModalProps {
  onClose: () => void;
  onSave: () => void;
}

export default function AddTaskModal({ onClose, onSave }: AddTaskModalProps) {
  const { user, session } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [status, setStatus] = useState<'todo' | 'in_progress' | 'completed'>('todo');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please enter a task title.');
      return;
    }

    if (!user) return;

    setLoading(true);

    try {
      const { data: newTask, error: saveError } = await supabase.from('tasks').insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        due_date: dueDate || null,
        status,
        priority,
      }).select().single();

      if (saveError) throw saveError;

      if (newTask && session) {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-task-embedding`;
        fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            taskId: newTask.id,
            title: newTask.title,
            description: newTask.description,
          }),
        }).catch((err) => console.error('Error generating embedding:', err));
      }

      onSave();
    } catch (err) {
      console.error('Error saving task:', err);
      setError('Failed to save task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div
        className="bg-cream rounded-2xl shadow-xl max-w-[500px] w-full p-8 relative animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-mutedGray hover:text-charcoal transition-colors"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-[28px] font-bold text-charcoal mb-2">Add New Task</h2>
        <p className="text-mutedGray mb-6">Fill in the details below.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-charcoal mb-2">
              Task Title*
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What do you need to do?"
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-charcoal placeholder-mutedGray focus:outline-none focus:border-sage transition-colors text-base"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-charcoal mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details (optional)"
              rows={4}
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-charcoal placeholder-mutedGray focus:outline-none focus:border-sage transition-colors resize-none text-base"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="priority" className="block text-sm font-semibold text-charcoal mb-2">
                Priority
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-charcoal focus:outline-none focus:border-sage transition-colors text-base"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-semibold text-charcoal mb-2">
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'todo' | 'in_progress' | 'completed')}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-charcoal focus:outline-none focus:border-sage transition-colors text-base"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="dueDate" className="block text-sm font-semibold text-charcoal mb-2">
              Due Date
            </label>
            <input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-charcoal focus:outline-none focus:border-sage transition-colors text-base"
            />
          </div>

          {error && (
            <div className="bg-coral bg-opacity-10 border-2 border-coral rounded-xl px-4 py-3 text-coral text-sm font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sage text-white font-semibold py-3 rounded-xl hover:bg-[#6B9D6F] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base shadow-sm"
          >
            {loading ? 'Adding Task...' : 'Add Task'}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full text-mutedGray hover:text-charcoal transition-colors text-sm font-medium"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
