"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useLocalStorage } from "@/app/hooks/useLocalStorage";
import { Sidebar } from "@/components/sidebar";
import {
  PlusIcon, TrashIcon, CheckCircleIcon, CircleIcon, XIcon,
  ChevronDownIcon, PencilIcon, CheckIcon, ListTodoIcon,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface TaskType {
  id: number;
  title: string;
  completed: boolean;
  createdAt: Date;
}

function reviveTasks(parsed: any[]): TaskType[] {
  return parsed.map((t) => ({ ...t, createdAt: new Date(t.createdAt) }));
}

export default function TasksPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [tasks, setTasks] = useLocalStorage<TaskType[]>("tasks", [], reviveTasks);
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [completedOpen, setCompletedOpen] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  useEffect(() => { setMounted(true); }, []);
  const isDarkMode = mounted && theme === "dark";
  const toggleTheme = () => setTheme(isDarkMode ? "light" : "dark");

  function handleAddTask() {
    if (!newTitle.trim()) { toast.error("Digite o nome da tarefa!"); return; }
    const newTask: TaskType = {
      id: Date.now(), title: newTitle.trim(), completed: false, createdAt: new Date(),
    };
    setTasks((prev) => [newTask, ...prev]);
    setNewTitle("");
    setIsAdding(false);
    toast.success("Tarefa adicionada!");
  }

  function toggleTask(id: number) {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, completed: !t.completed } : t));
  }

  function handleDeleteTask(id: number) {
    const task = tasks.find((t) => t.id === id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setTaskToDelete(null);
    toast.warning("Tarefa removida!", { description: task?.title });
  }

  function startEditing(task: TaskType) {
    setEditingId(task.id);
    setEditingTitle(task.title);
  }

  function saveEditing() {
    if (!editingTitle.trim()) return;
    setTasks((prev) => prev.map((t) => t.id === editingId ? { ...t, title: editingTitle.trim() } : t));
    setEditingId(null);
    setEditingTitle("");
    toast.success("Tarefa atualizada!");
  }

  const pending = tasks.filter(t => !t.completed).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const completed = tasks.filter(t => t.completed).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const progress = tasks.length ? Math.round((completed.length / tasks.length) * 100) : 0;

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar
        activeView="tasks"
        onNewClick={() => setIsAdding(true)}
        newButtonLabel="Nova Tarefa"
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        panel={tasks.length > 0 && (
          <div className="mx-4 mb-3 px-3 py-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/40 rounded-lg">
            <p className="text-xs text-purple-500 dark:text-purple-400 font-semibold mb-1">Progresso</p>
            <p className="text-sm font-bold text-purple-700 dark:text-purple-200">{completed.length} de {tasks.length} concluídas</p>
            <div className="h-1.5 bg-purple-100 dark:bg-purple-900/40 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-8 space-y-4">

          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Minhas Tarefas</h2>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{pending.length} pendentes · {completed.length} concluídas</p>
              </div>
              <button onClick={() => setIsAdding(true)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors shadow-sm">
                <PlusIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Card de tarefas pendentes */}
          {(pending.length > 0 || isAdding) && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 divide-y divide-gray-50 dark:divide-gray-700/50">
              {/* Input inline */}
              {isAdding && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-t-xl">
                  <CircleIcon className="w-5 h-5 text-gray-300 dark:text-gray-600 shrink-0" />
                  <input type="text" placeholder="Nome da tarefa..." value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddTask(); if (e.key === "Escape") { setIsAdding(false); setNewTitle(""); } }}
                    className="flex-1 bg-transparent focus:outline-none text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400"
                    autoFocus />
                  <button onClick={() => { setIsAdding(false); setNewTitle(""); }} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                    <XIcon className="w-4 h-4" />
                  </button>
                  <button onClick={handleAddTask} className="px-3 py-1 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 transition-colors">
                    Adicionar
                  </button>
                </div>
              )}

              {pending.map((task) => (
                <div key={task.id} className="group flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <button onClick={() => toggleTask(task.id)} className="text-gray-400 hover:text-green-500 transition-colors shrink-0">
                    <CircleIcon className="w-5 h-5" />
                  </button>

                  {editingId === task.id ? (
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") saveEditing(); if (e.key === "Escape") setEditingId(null); }}
                      className="flex-1 bg-transparent border-b border-blue-400 focus:outline-none text-sm text-gray-700 dark:text-gray-200"
                      autoFocus
                    />
                  ) : (
                    <p className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-200">{task.title}</p>
                  )}

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {editingId === task.id ? (
                      <button onClick={saveEditing} className="p-1.5 text-green-500 hover:text-green-600 transition-colors">
                        <CheckIcon className="w-4 h-4" />
                      </button>
                    ) : (
                      <button onClick={() => startEditing(task)} className="p-1.5 text-gray-400 hover:text-yellow-500 transition-colors">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => setTaskToDelete(task.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {pending.length === 0 && !isAdding && (
                <div className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
                  Nenhuma tarefa pendente
                </div>
              )}
            </div>
          )}

          {/* Estado vazio total */}
          {tasks.length === 0 && !isAdding && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <ListTodoIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium mb-4">Nenhuma tarefa ainda</p>
              <button onClick={() => setIsAdding(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm">
                <PlusIcon className="w-4 h-4" />Adicionar tarefa
              </button>
            </div>
          )}

          {/* Card separado de concluídas */}
          {completed.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 divide-y divide-gray-50 dark:divide-gray-700/50">
              <button onClick={() => setCompletedOpen(!completedOpen)}
                className="w-full px-4 py-3 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-t-xl">
                <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${completedOpen ? "" : "-rotate-90"}`} />
                <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">
                  Concluídas ({completed.length})
                </span>
              </button>

              {completedOpen && completed.map((task) => (
                <div key={task.id} className="group flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <button onClick={() => toggleTask(task.id)} className="text-green-500 hover:text-gray-400 transition-colors shrink-0">
                    <CheckCircleIcon className="w-5 h-5" />
                  </button>
                  <p className="flex-1 text-sm font-medium line-through text-gray-400 dark:text-gray-500">{task.title}</p>
                  <button onClick={() => setTaskToDelete(task.id)}
                    className="p-1.5 text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Dialog open={taskToDelete !== null} onOpenChange={() => setTaskToDelete(null)}>
        <DialogContent className="dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle>Remover tarefa</DialogTitle>
            <DialogDescription>Tem certeza que deseja remover esta tarefa?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button onClick={() => setTaskToDelete(null)} className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">Cancelar</button>
            <button onClick={() => taskToDelete !== null && handleDeleteTask(taskToDelete)} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">Remover</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}