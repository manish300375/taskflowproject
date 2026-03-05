import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';

interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
}

interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  todo: number;
  overdue: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<TaskStats>({
    total: 0,
    completed: 0,
    inProgress: 0,
    todo: 0,
    overdue: 0,
  });
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchDashboardData();
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const allTasks = tasks || [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const overdue = allTasks.filter((task) => {
        if (task.status === 'completed' || !task.due_date) return false;
        const dueDate = new Date(task.due_date);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today;
      }).length;

      setStats({
        total: allTasks.length,
        completed: allTasks.filter((t) => t.status === 'completed').length,
        inProgress: allTasks.filter((t) => t.status === 'in_progress').length,
        todo: allTasks.filter((t) => t.status === 'todo').length,
        overdue,
      });

      setRecentTasks(allTasks.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
        <div className="mb-8">
          <h1 className="text-[32px] font-bold text-charcoal mb-2">Dashboard</h1>
          <p className="text-mutedGray text-base">Overview of your tasks and progress</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-card shadow-soft p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-mutedGray text-sm font-semibold uppercase tracking-wider mb-1">
                  Total Tasks
                </p>
                <p className="text-3xl font-bold text-charcoal">{stats.total}</p>
              </div>
              <div className="p-3 bg-sage bg-opacity-10 rounded-full">
                <CheckCircle2 className="w-6 h-6 text-sage" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-card shadow-soft p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-mutedGray text-sm font-semibold uppercase tracking-wider mb-1">
                  Completed
                </p>
                <p className="text-3xl font-bold text-charcoal">{stats.completed}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-card shadow-soft p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-mutedGray text-sm font-semibold uppercase tracking-wider mb-1">
                  In Progress
                </p>
                <p className="text-3xl font-bold text-charcoal">{stats.inProgress}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-card shadow-soft p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-mutedGray text-sm font-semibold uppercase tracking-wider mb-1">
                  Overdue
                </p>
                <p className="text-3xl font-bold text-charcoal">{stats.overdue}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-card shadow-soft overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-charcoal">Recent Tasks</h2>
            <Link
              to="/tasks"
              className="text-sage hover:text-[#6B9D6F] font-semibold text-sm transition-colors"
            >
              View All
            </Link>
          </div>

          {recentTasks.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="text-4xl mb-3">📝</div>
              <p className="text-mutedGray mb-4">No tasks yet</p>
              <Link
                to="/tasks"
                className="inline-block px-5 py-3 bg-sage text-white rounded-button text-base font-semibold hover:bg-[#6B9D6F] transition-all shadow-sm"
              >
                Create Your First Task
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {recentTasks.map((task) => (
                <div key={task.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {task.status === 'completed' ? (
                        <CheckCircle2 className="w-5 h-5 text-sage" />
                      ) : (
                        <Circle className="w-5 h-5 text-mutedGray" />
                      )}
                      <div>
                        <p
                          className={`font-semibold text-charcoal ${
                            task.status === 'completed' ? 'line-through opacity-60' : ''
                          }`}
                        >
                          {task.title}
                        </p>
                        {task.due_date && (
                          <p className="text-sm text-mutedGray mt-1">
                            Due:{' '}
                            {new Date(task.due_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                          task.status === 'completed'
                            ? 'bg-sage bg-opacity-20 text-sage'
                            : task.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-mutedGray'
                        }`}
                      >
                        {task.status === 'todo'
                          ? 'To Do'
                          : task.status === 'in_progress'
                          ? 'In Progress'
                          : 'Completed'}
                      </span>
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
