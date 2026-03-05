import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import TaskModal from '../components/TaskModal';

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

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchTasks();

    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);

  const fetchTasks = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const sortedTasks = (data || []).sort((a, b) => {
        if (a.status === 'completed' && b.status !== 'completed') return 1;
        if (a.status !== 'completed' && b.status === 'completed') return -1;
        return 0;
      });

      setTasks(sortedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', task.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTask(null);
  };

  const handleAddTask = () => {
    setEditingTask(null);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-mutedGray">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-[32px] font-bold text-charcoal mb-2">Your Tasks</h1>
            <p className="text-mutedGray text-base">Here's what you have going on today.</p>
          </div>
          <button
            onClick={handleAddTask}
            className="flex items-center gap-2 px-5 py-3 bg-sage text-white rounded-button text-base font-semibold hover:bg-[#6B9D6F] transition-all shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Add Task
          </button>
        </div>

        {tasks.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-card shadow-soft">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-mutedGray text-lg">No tasks yet. Add your first one!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`bg-white rounded-card shadow-soft p-5 hover:shadow-md transition-all ${
                  task.status === 'completed' ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 pt-1">
                    <button
                      onClick={() => handleToggleComplete(task)}
                      className="w-5 h-5 rounded border-2 border-sage flex items-center justify-center hover:bg-sage hover:bg-opacity-10 transition-all"
                    >
                      {task.status === 'completed' && (
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
                      )}
                    </button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3
                      className={`text-lg font-bold text-charcoal mb-1 ${
                        task.status === 'completed' ? 'line-through' : ''
                      }`}
                    >
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-sm text-mutedGray mb-2">{task.description}</p>
                    )}
                    {task.due_date && (
                      <span className="inline-block px-3 py-1 bg-softGreen text-sage text-xs font-semibold rounded-full">
                        Due: {new Date(task.due_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(task)}
                      className="p-2 text-mutedGray hover:text-coral hover:bg-coral hover:bg-opacity-10 rounded-button transition-all"
                      aria-label="Edit task"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="p-2 text-mutedGray hover:text-coral hover:bg-coral hover:bg-opacity-10 rounded-button transition-all"
                      aria-label="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <TaskModal
          task={editingTask}
          onClose={handleCloseModal}
          onSave={() => {
            handleCloseModal();
            fetchTasks();
          }}
        />
      )}
    </div>
  );
}
