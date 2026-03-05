import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import AddTaskModal from '../components/AddTaskModal';
import EditTaskModal from '../components/EditTaskModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'completed';
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      const newStatus = task.status === 'completed' ? 'todo' : 'completed';
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', task.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeletingTaskId(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTaskId) return;

    setIsDeleting(true);

    try {
      const { error } = await supabase.from('tasks').delete().eq('id', deletingTaskId);
      if (error) throw error;

      setShowDeleteModal(false);
      setDeletingTaskId(null);
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeletingTaskId(null);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingTask(null);
  };

  const handleAddTask = () => {
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
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
                    <div className="flex items-center gap-2 mb-1">
                      <h3
                        className={`text-lg font-bold text-charcoal ${
                          task.status === 'completed' ? 'line-through' : ''
                        }`}
                      >
                        {task.title}
                      </h3>
                      <span
                        className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                          task.priority === 'high'
                            ? 'bg-red-100 text-red-700'
                            : task.priority === 'medium'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-sm text-mutedGray mb-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span
                        className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                          task.status === 'completed'
                            ? 'bg-sage bg-opacity-20 text-sage'
                            : task.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-mutedGray'
                        }`}
                      >
                        {task.status === 'todo' ? 'To Do' : task.status === 'in_progress' ? 'In Progress' : 'Completed'}
                      </span>
                      {task.due_date && (
                        <span className="inline-block px-3 py-1 bg-softGreen text-sage text-xs font-semibold rounded-full">
                          Due: {new Date(task.due_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
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
                      onClick={() => handleDeleteClick(task.id)}
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

      {showAddModal && (
        <AddTaskModal
          onClose={handleCloseAddModal}
          onSave={() => {
            handleCloseAddModal();
            fetchTasks();
          }}
        />
      )}

      {showEditModal && editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={handleCloseEditModal}
          onSave={() => {
            handleCloseEditModal();
            fetchTasks();
          }}
        />
      )}

      {showDeleteModal && (
        <DeleteConfirmationModal
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          loading={isDeleting}
        />
      )}
    </div>
  );
}
