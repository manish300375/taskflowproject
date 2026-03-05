import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus, Pencil, Trash2, ChevronDown } from 'lucide-react';
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
  const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'todo' | 'in_progress' | 'completed'>('all');
  const [filterDueDate, setFilterDueDate] = useState<'all' | 'overdue' | 'today' | 'upcoming' | 'no_date'>('all');

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

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filterPriority !== 'all' && task.priority !== filterPriority) {
        return false;
      }

      if (filterStatus !== 'all' && task.status !== filterStatus) {
        return false;
      }

      if (filterDueDate !== 'all') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (filterDueDate === 'no_date' && task.due_date !== null) {
          return false;
        }

        if (filterDueDate !== 'no_date' && task.due_date === null) {
          return false;
        }

        if (task.due_date) {
          const dueDate = new Date(task.due_date);
          dueDate.setHours(0, 0, 0, 0);

          if (filterDueDate === 'overdue' && dueDate >= today) {
            return false;
          }

          if (filterDueDate === 'today' && dueDate.getTime() !== today.getTime()) {
            return false;
          }

          if (filterDueDate === 'upcoming' && dueDate <= today) {
            return false;
          }
        }
      }

      return true;
    });
  }, [tasks, filterPriority, filterStatus, filterDueDate]);

  const clearFilters = () => {
    setFilterPriority('all');
    setFilterStatus('all');
    setFilterDueDate('all');
  };

  const hasActiveFilters = filterPriority !== 'all' || filterStatus !== 'all' || filterDueDate !== 'all';

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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-[32px] font-bold text-charcoal mb-2">Your Tasks</h1>
            <p className="text-mutedGray text-base">
              {tasks.length === 0
                ? 'No tasks yet. Add your first one!'
                : `Showing ${filteredTasks.length} of ${tasks.length} tasks`}
            </p>
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
            <p className="text-mutedGray text-lg">Start organizing your work by adding your first task!</p>
          </div>
        ) : (
          <div className="bg-white rounded-card shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-charcoal uppercase tracking-wider">Task</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-charcoal uppercase tracking-wider">Status</span>
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                          className="text-xs px-2 py-1 bg-white border border-gray-300 rounded-lg text-charcoal focus:outline-none focus:border-sage transition-colors cursor-pointer"
                        >
                          <option value="all">All</option>
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-charcoal uppercase tracking-wider">Due Date</span>
                        <select
                          value={filterDueDate}
                          onChange={(e) => setFilterDueDate(e.target.value as typeof filterDueDate)}
                          className="text-xs px-2 py-1 bg-white border border-gray-300 rounded-lg text-charcoal focus:outline-none focus:border-sage transition-colors cursor-pointer"
                        >
                          <option value="all">All</option>
                          <option value="overdue">Overdue</option>
                          <option value="today">Today</option>
                          <option value="upcoming">Upcoming</option>
                          <option value="no_date">No Date</option>
                        </select>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-charcoal uppercase tracking-wider">Priority</span>
                        <select
                          value={filterPriority}
                          onChange={(e) => setFilterPriority(e.target.value as typeof filterPriority)}
                          className="text-xs px-2 py-1 bg-white border border-gray-300 rounded-lg text-charcoal focus:outline-none focus:border-sage transition-colors cursor-pointer"
                        >
                          <option value="all">All</option>
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-charcoal uppercase tracking-wider">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="text-4xl mb-3">🔍</div>
                        <p className="text-mutedGray">No tasks match your filters.</p>
                        <button
                          onClick={clearFilters}
                          className="mt-3 text-sage hover:text-[#6B9D6F] font-semibold transition-colors text-sm"
                        >
                          Clear Filters
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task) => (
                      <tr
                        key={task.id}
                        className={`hover:bg-gray-50 transition-colors ${
                          task.status === 'completed' ? 'opacity-60' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleToggleComplete(task)}
                              className="w-5 h-5 rounded border-2 border-sage flex items-center justify-center hover:bg-sage hover:bg-opacity-10 transition-all flex-shrink-0"
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
                            <span
                              className={`font-semibold text-charcoal ${
                                task.status === 'completed' ? 'line-through' : ''
                              }`}
                            >
                              {task.title}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
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
                        </td>
                        <td className="px-6 py-4">
                          {task.due_date ? (
                            <span className="text-sm text-charcoal">
                              {new Date(task.due_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          ) : (
                            <span className="text-sm text-mutedGray">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                              task.priority === 'high'
                                ? 'bg-red-100 text-red-700'
                                : task.priority === 'medium'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(task)}
                              className="p-2 text-mutedGray hover:text-sage hover:bg-sage hover:bg-opacity-10 rounded-lg transition-all"
                              aria-label="Edit task"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(task.id)}
                              className="p-2 text-mutedGray hover:text-coral hover:bg-coral hover:bg-opacity-10 rounded-lg transition-all"
                              aria-label="Delete task"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
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
