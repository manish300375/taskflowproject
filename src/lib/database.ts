import { supabase } from './supabase';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  due_date?: string;
  status: 'pending' | 'completed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  due_date?: string;
  status?: 'pending' | 'completed';
  priority?: 'low' | 'medium' | 'high';
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  due_date?: string;
  status?: 'pending' | 'completed';
  priority?: 'low' | 'medium' | 'high';
}

// Database helper functions for tasks
export const taskHelpers = {
  // Get all tasks for the current user
  getTasks: async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  // Get recent tasks (limit 6)
  getRecentTasks: async (limit: number = 6) => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    return { data, error };
  },

  // Get tasks by status
  getTasksByStatus: async (status: 'pending' | 'completed') => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  // Get tasks by priority
  getTasksByPriority: async (priority: 'low' | 'medium' | 'high') => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('priority', priority)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  // Create a new task
  createTask: async (taskData: CreateTaskData) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert([
        {
          ...taskData,
          user_id: user.id,
        }
      ])
      .select()
      .single();
    
    return { data, error };
  },

  // Update a task
  updateTask: async (taskId: string, updates: UpdateTaskData) => {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();
    
    return { data, error };
  },

  // Delete a task
  deleteTask: async (taskId: string) => {
    const { data, error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .select()
      .single();
    
    return { data, error };
  },

  // Toggle task status (pending <-> completed)
  toggleTaskStatus: async (taskId: string, currentStatus: 'pending' | 'completed') => {
    const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
    
    const { data, error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId)
      .select()
      .single();
    
    return { data, error };
  },

  // Get task statistics
  getTaskStats: async () => {
    const { data: allTasks, error } = await supabase
      .from('tasks')
      .select('status');
    
    if (error) {
      return { data: null, error };
    }

    const stats = {
      total: allTasks.length,
      completed: allTasks.filter(task => task.status === 'completed').length,
      pending: allTasks.filter(task => task.status === 'pending').length,
    };

    return { data: stats, error: null };
  }
};