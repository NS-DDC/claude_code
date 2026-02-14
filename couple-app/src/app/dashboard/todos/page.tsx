'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

interface Todo {
  _id: string;
  title: string;
  completed: boolean;
  assignedTo?: { _id: string; nickname: string };
  dueDate?: string;
  createdBy: { _id: string; nickname: string };
}

export default function TodosPage() {
  const { token, user, partner } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('all');

  const fetchTodos = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/todos', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.todos) setTodos(data.todos);
    } catch {}
  }, [token]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newTodo }),
      });
      if (res.ok) {
        setNewTodo('');
        fetchTodos();
      }
    } catch {}
  };

  const toggleTodo = async (id: string, completed: boolean) => {
    try {
      await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ completed: !completed }),
      });
      fetchTodos();
    } catch {}
  };

  const deleteTodo = async (id: string) => {
    try {
      await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTodos();
    } catch {}
  };

  const filteredTodos = todos.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'done') return t.completed;
    return true;
  });

  const completedCount = todos.filter((t) => t.completed).length;
  const totalCount = todos.length;

  return (
    <div className="px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">✅ 할 일</h1>
        <span className="text-sm text-gray-400">
          {completedCount}/{totalCount} 완료
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-300 to-primary-400 rounded-full transition-all duration-500"
            style={{ width: totalCount ? `${(completedCount / totalCount) * 100}%` : '0%' }}
          />
        </div>
      </div>

      {/* Add Todo */}
      <form onSubmit={addTodo} className="flex gap-2 mb-4">
        <input
          type="text"
          className="input-field flex-1"
          placeholder="할 일을 입력하세요"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
        />
        <button type="submit" className="btn-primary py-2 px-4">추가</button>
      </form>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {([['all', '전체'], ['active', '진행 중'], ['done', '완료']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`text-sm px-4 py-1.5 rounded-full transition-colors ${
              filter === key
                ? 'bg-primary-400 text-white'
                : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Todo List */}
      <div className="space-y-2">
        {filteredTodos.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-3xl mb-2">📝</p>
            <p className="text-sm text-gray-400">
              {filter === 'done' ? '완료한 할 일이 없어요' : '할 일을 추가해보세요'}
            </p>
          </div>
        ) : (
          filteredTodos.map((todo) => (
            <div
              key={todo._id}
              className={`card flex items-center gap-3 animate-fade-in ${
                todo.completed ? 'opacity-60' : ''
              }`}
            >
              <button
                onClick={() => toggleTodo(todo._id, todo.completed)}
                className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                  todo.completed
                    ? 'bg-primary-400 border-primary-400 text-white'
                    : 'border-gray-300 hover:border-primary-300'
                }`}
              >
                {todo.completed && <span className="text-xs">✓</span>}
              </button>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm ${
                    todo.completed ? 'line-through text-gray-400' : 'text-gray-700'
                  }`}
                >
                  {todo.title}
                </p>
                <p className="text-xs text-gray-300 mt-0.5">
                  {todo.createdBy?.nickname}
                  {todo.assignedTo && ` → ${todo.assignedTo.nickname}`}
                </p>
              </div>
              <button
                onClick={() => deleteTodo(todo._id)}
                className="text-gray-300 hover:text-red-400 text-sm p-1 flex-shrink-0"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>

      <div className="bottom-nav-spacer" />
    </div>
  );
}
