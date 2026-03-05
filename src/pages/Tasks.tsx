import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import AddTaskModal from '../components/AddTaskModal';
import EditTaskModal from '../components/EditTaskModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import SmartSearch from '../components/SmartSearch';

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

interface Subtask {
  id: string;
  task_id: string;
  title: string;
  completed: boolean;
  order: number;
  created_at: string;
}

export default function Tasks() {
  const { user, session } = useAuth();
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
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [subtasks, setSubtasks] = useState<Map<string, Subtask[]>>(new Map());
  const [loadingSubtasks, setLoadingSubtasks] = useState<Set<string>>(new Set());
  const [searchResultIds, setSearchResultIds] = useState<string[] | null>(null);

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

  const handleExpandTask = async (taskId: string, taskTitle: string) => {
    const newExpanded = new Set(expandedTasks);

    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
      setExpandedTasks(newExpanded);
      return;
    }

    newExpanded.add(taskId);
    setExpandedTasks(newExpanded);

    if (subtasks.has(taskId)) {
      return;
    }

    setLoadingSubtasks(new Set([...loadingSubtasks, taskId]));

    try {
      const { data: existingSubtasks, error: fetchError } = await supabase
        .from('subtasks')
        .select('*')
        .eq('task_id', taskId)
        .order('order', { ascending: true });

      if (fetchError) throw fetchError;

      if (existingSubtasks && existingSubtasks.length > 0) {
        setSubtasks(new Map(subtasks.set(taskId, existingSubtasks)));
        setLoadingSubtasks(new Set([...loadingSubtasks].filter(id => id !== taskId)));
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-subtasks`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskId, taskTitle }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Edge function error:', errorData);
        alert(`Failed to generate subtasks: ${errorData.error || 'Unknown error'}`);
        throw new Error(errorData.error || 'Failed to generate subtasks');
      }

      const result = await response.json();
      console.log('Edge function response:', result);

      const { data: newSubtasks, error: refetchError } = await supabase
        .from('subtasks')
        .select('*')
        .eq('task_id', taskId)
        .order('order', { ascending: true });

      if (refetchError) throw refetchError;

      setSubtasks(new Map(subtasks.set(taskId, newSubtasks || [])));

      if (newSubtasks && newSubtasks.length > 0) {
        console.log(`Successfully generated ${newSubtasks.length} subtasks`);
      }
    } catch (error) {
      console.error('Error loading subtasks:', error);
    } finally {
      setLoadingSubtasks(new Set([...loadingSubtasks].filter(id => id !== taskId)));
    }
  };

  const handleToggleSubtask = async (taskId: string, subtaskId: string, currentCompleted: boolean) => {
    try {
      const { error } = await supabase
        .from('subtasks')
        .update({ completed: !currentCompleted })
        .eq('id', subtaskId);

      if (error) throw error;

      const taskSubtasks = subtasks.get(taskId) || [];
      const updatedSubtasks = taskSubtasks.map(st =>
        st.id === subtaskId ? { ...st, completed: !currentCompleted } : st
      );
      setSubtasks(new Map(subtasks.set(taskId, updatedSubtasks)));
    } catch (error) {
      console.error('Error toggling subtask:', error);
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
    let filtered = tasks;

    if (searchResultIds !== null) {
      filtered = tasks.filter((task) => searchResultIds.includes(task.id));
    }

    return filtered.filter((task) => {
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
  }, [tasks, filterPriority, filterStatus, filterDueDate, searchResultIds]);

  const clearFilters = () => {
    setFilterPriority('all');
    setFilterStatus('all');
    setFilterDueDate('all');
    setSearchResultIds(null);
  };

  const hasActiveFilters = filterPriority !== 'all' || filterStatus !== 'all' || filterDueDate !== 'all' || searchResultIds !== null;

  const handleSearchResults = (taskIds: string[]) => {
    setSearchResultIds(taskIds);
  };

  const handleClearSearch = () => {
    setSearchResultIds(null);
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

        {tasks.length > 0 && (
          <SmartSearch
            onSearchResults={handleSearchResults}
            onClearSearch={handleClearSearch}
          />
        )}

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
                    filteredTasks.map((task) => {
                      const isExpanded = expandedTasks.has(task.id);
                      const taskSubtasks = subtasks.get(task.id) || [];
                      const isLoadingSubtasks = loadingSubtasks.has(task.id);

                      return (
                        <>
                          <tr
                            key={task.id}
                            className={`hover:bg-gray-50 transition-colors ${
                              task.status === 'completed' ? 'opacity-60' : ''
                            }`}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => handleExpandTask(task.id, task.title)}
                                  className="p-1 text-mutedGray hover:text-sage hover:bg-sage hover:bg-opacity-10 rounded transition-all flex-shrink-0"
                                  aria-label="Expand task"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="w-4 h-4" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4" />
                                  )}
                                </button>
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
                      {isExpanded && (
                        <tr key={`${task.id}-subtasks`}>
                          <td colSpan={5} className="px-6 py-4 bg-gray-50">
                            <div className="ml-12">
                              {isLoadingSubtasks ? (
                                <div className="flex items-center gap-2 text-mutedGray text-sm py-2">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>Generating subtasks...</span>
                                </div>
                              ) : taskSubtasks.length > 0 ? (
                                <div className="space-y-2">
                                  <div className="text-xs font-semibold text-mutedGray uppercase tracking-wider mb-3">
                                    Subtasks
                                  </div>
                                  {taskSubtasks.map((subtask) => (
                                    <div
                                      key={subtask.id}
                                      className="flex items-center gap-3 py-1"
                                    >
                                      <button
                                        onClick={() => handleToggleSubtask(task.id, subtask.id, subtask.completed)}
                                        className="w-4 h-4 rounded border-2 border-sage flex items-center justify-center hover:bg-sage hover:bg-opacity-10 transition-all flex-shrink-0"
                                      >
                                        {subtask.completed && (
                                          <svg
                                            className="w-3 h-3 text-sage"
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
                                        className={`text-sm text-charcoal ${
                                          subtask.completed ? 'line-through opacity-60' : ''
                                        }`}
                                      >
                                        {subtask.title}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-sm text-mutedGray py-2">
                                  No subtasks available
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                    );
                  })
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
