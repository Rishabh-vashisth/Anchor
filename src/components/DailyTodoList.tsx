import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Check, Trash2 } from 'lucide-react';
import { DailyTodo } from '../types';

interface DailyTodoListProps {
  todos: DailyTodo[];
  onAdd: (text: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function DailyTodoList({ todos, onAdd, onToggle, onDelete }: DailyTodoListProps) {
  const [newTodo, setNewTodo] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodo.trim()) {
      onAdd(newTodo.trim());
      setNewTodo('');
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em] block">Today's List</label>
        <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">{todos.filter(t => t.completed).length}/{todos.length} Done</span>
      </div>

      <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-white/10">
        <AnimatePresence mode="popLayout">
          {todos.map((todo) => (
            <motion.div
              key={todo.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`group flex items-center gap-3 p-3 border border-white/5 transition-all ${
                todo.completed ? 'opacity-40 bg-transparent' : 'bg-white/[0.02]'
              }`}
            >
              <button
                onClick={() => onToggle(todo.id)}
                className={`w-5 h-5 border flex items-center justify-center transition-all ${
                  todo.completed ? 'bg-white border-white text-black' : 'border-white/20 text-transparent hover:border-white/40'
                }`}
              >
                <Check className="w-3 h-3" />
              </button>
              
              <span className={`flex-1 text-sm ${todo.completed ? 'line-through' : 'text-white/80'}`}>
                {todo.text}
              </span>

              <button
                onClick={() => onDelete(todo.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-white/20 hover:text-red-400 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {todos.length === 0 && (
          <p className="text-center py-4 text-[10px] font-mono text-white/20 uppercase tracking-widest italic">Inventory clear.</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="relative group">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Quick add..."
          className="w-full bg-transparent border-b border-white/10 py-3 text-sm focus:outline-none focus:border-white/40 transition-all placeholder:text-white/10"
        />
        <button 
          type="submit"
          className={`absolute right-0 top-1/2 -translate-y-1/2 p-2 transition-all ${newTodo.trim() ? 'text-white' : 'text-white/10'}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </form>
    </section>
  );
}
