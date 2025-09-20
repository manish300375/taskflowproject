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

export interface Subtask {
  id: string;
  parent_task_id: string;
  user_id: string;
  title: string;
  status: 'pending' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface CreateSubtaskData {
  parent_task_id: string;
  title: string;
  status?: 'pending' | 'completed';
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

// Database helper functions for subtasks
export const subtaskHelpers = {
  // Get subtasks for a specific task
  getSubtasks: async (parentTaskId: string) => {
    const { data, error } = await supabase
      .from('subtasks')
      .select('*')
      .eq('parent_task_id', parentTaskId)
      .order('created_at', { ascending: true });
    
    return { data, error };
  },

  // Create a new subtask
  createSubtask: async (subtaskData: CreateSubtaskData) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    const { data, error } = await supabase
      .from('subtasks')
      .insert([
        {
          ...subtaskData,
          user_id: user.id,
        }
      ])
      .select()
      .single();
    
    return { data, error };
  },

  // Update a subtask
  updateSubtask: async (subtaskId: string, updates: Partial<CreateSubtaskData>) => {
    const { data, error } = await supabase
      .from('subtasks')
      .update(updates)
      .eq('id', subtaskId)
      .select()
      .single();
    
    return { data, error };
  },

  // Delete a subtask
  deleteSubtask: async (subtaskId: string) => {
    const { data, error } = await supabase
      .from('subtasks')
      .delete()
      .eq('id', subtaskId)
      .select()
      .single();
    
    return { data, error };
  },

  // Toggle subtask status
  toggleSubtaskStatus: async (subtaskId: string, currentStatus: 'pending' | 'completed') => {
    const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
    
    const { data, error } = await supabase
      .from('subtasks')
      .update({ status: newStatus })
      .eq('id', subtaskId)
      .select()
      .single();
    
    return { data, error };
  }
};

// AI helper functions
export const aiHelpers = {
  // Generate subtasks using OpenAI
  generateSubtasks: async (taskTitle: string) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    if (!supabaseUrl) {
      return { data: null, error: { message: 'Supabase URL not configured' } };
    }

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-subtasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ taskTitle }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { data: null, error: errorData };
      }

      const data = await response.json();
      return { data: data.subtasks, error: null };
    } catch (error) {
      console.error('Error generating subtasks:', error);
      return { data: null, error: { message: 'Failed to generate subtasks' } };
    }
  }
};