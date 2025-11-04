import React from 'react';
import { CheckCircle, Calendar, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { taskHelpers, Task } from '../lib/database';

export default function ArchivePage() {
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const { data } = await taskHelpers.getCompletedTasksArchive();
      setTasks(data || []);
      setIsLoading(false);
    };
    load();
  }, []);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-8 w-8 text-blue-500 animate-spin" />
          <span className="text-lg text-gray-600">Loading archive...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-blue-500" />
              <span className="text-xl font-bold text-gray-900">Archive</span>
            </div>
            <Link to="/" className="flex items-center space-x-2 text-gray-600 hover:text-blue-500 transition-colors duration-200">
              <Home className="h-5 w-5" />
              <span>Home</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Completed Tasks</h3>
          </div>

          {tasks.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              No completed tasks yet.
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {tasks.map(task => (
                <li key={task.id} className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <h4 className="font-medium text-gray-900 line-through">{task.title}</h4>
                      </div>
                      {task.description && (
                        <p className="text-gray-600 mt-2 ml-8 line-through">{task.description}</p>
                      )}
                      <div className="flex items-center space-x-2 text-sm text-gray-500 mt-2 ml-8">
                        <Calendar className="h-4 w-4" />
                        <span>Completed on {formatDateTime(task.updated_at)}</span>
                      </div>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium rounded-full text-green-700 bg-green-50 border border-green-200">completed</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}


