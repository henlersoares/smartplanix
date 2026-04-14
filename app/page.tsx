"use client";

import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  CircleIcon,
  ClockIcon,
  XIcon,
  FileTextIcon,
  TagIcon,
  LayoutListIcon,
  CalendarDaysIcon,
  CalendarIcon as CalendarMonthIcon,
  SunIcon,
  MoonIcon,
} from "lucide-react";

interface EventType {
  id: number;
  title: string;
  completed: boolean;
  dateTime: Date;
  reminder?: boolean;
  repeat?: "none" | "daily" | "weekly" | "monthly";
  category?: string;
  description?: string;
}

type ViewType = "day" | "week" | "month";

export default function Home() {
  const [title, setTitle] = useState("");
  const [selectedDateTime, setSelectedDateTime] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState("12:00");
  const [events, setEvents] = useState<EventType[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventType | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDateTime, setEditDateTime] = useState(new Date());
  const [editTime, setEditTime] = useState("12:00");
  const [currentView, setCurrentView] = useState<ViewType>("day");
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [reminder, setReminder] = useState(false);
  const [repeat, setRepeat] = useState<"none" | "daily" | "weekly" | "monthly">("none");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [editReminder, setEditReminder] = useState(false);
  const [editRepeat, setEditRepeat] = useState<"none" | "daily" | "weekly" | "monthly">("none");
  const [editCategory, setEditCategory] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Carregar eventos
  useEffect(() => {
    const eventosSalvos = localStorage.getItem("events");
    if (eventosSalvos) {
      const parsedEvents = JSON.parse(eventosSalvos);
      const eventsWithDates = parsedEvents.map((event: any) => ({
        ...event,
        dateTime: new Date(event.dateTime),
      }));
      setEvents(eventsWithDates);
    }
  }, []);

  // Salvar eventos
  useEffect(() => {
    localStorage.setItem("events", JSON.stringify(events));
  }, [events]);

  // Carregar tema salvo
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Salvar tema
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  function combineDateAndTime(date: Date, timeString: string): Date {
    const [hours, minutes] = timeString.split(":").map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
  }

  function handleAddEvent() {
    if (!title.trim()) {
      toast.error("Digite um compromisso!");
      return;
    }

    const finalDateTime = combineDateAndTime(selectedDateTime, selectedTime);

    const newEvent = {
      id: Date.now(),
      title,
      completed: false,
      dateTime: finalDateTime,
      reminder,
      repeat,
      category: category.trim() || undefined,
      description: description.trim() || undefined,
    };

    setEvents([...events, newEvent]);
    resetForm();
    setIsModalOpen(false);
    window.dispatchEvent(new Event('events-updated'));

    toast.success("Compromisso adicionado!", {
      description: `${title} - ${finalDateTime.toLocaleDateString("pt-BR")} as ${finalDateTime.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })}`,
    });
  }

  function handleEditEvent() {
    if (!editingEvent) return;

    if (!editTitle.trim()) {
      toast.error("Digite um titulo!");
      return;
    }

    const finalDateTime = combineDateAndTime(editDateTime, editTime);

    setEvents((prev) =>
      prev.map((event) =>
        event.id === editingEvent.id
          ? {
              ...event,
              title: editTitle,
              dateTime: finalDateTime,
              reminder: editReminder,
              repeat: editRepeat,
              category: editCategory.trim() || undefined,
              description: editDescription.trim() || undefined,
            }
          : event
      )
    );

    setEditingEvent(null);
    window.dispatchEvent(new Event('events-updated'));
    toast.success("Compromisso editado!");
  }

  function resetForm() {
    setTitle("");
    setSelectedDateTime(new Date());
    setSelectedTime("12:00");
    setReminder(false);
    setRepeat("none");
    setCategory("");
    setDescription("");
  }

  function toggleComplete(id: number) {
    setEvents((prev) =>
      prev.map((event) =>
        event.id === id ? { ...event, completed: !event.completed } : event
      )
    );
    window.dispatchEvent(new Event('events-updated'));
  }

  function handleRemoveEvent(id: number) {
    const event = events.find((e) => e.id === id);
    setEvents((prev) => prev.filter((event) => event.id !== id));
    window.dispatchEvent(new Event('events-updated'));
    toast.warning("Compromisso removido!", {
      description: event?.title,
    });
  }

  function formatTime(date: Date): string {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function openCreateModal() {
    resetForm();
    setIsModalOpen(true);
  }

  function getFilteredEvents() {
    if (currentView === "day") {
      return events.filter(event =>
        event.dateTime.toDateString() === selectedDate.toDateString()
      );
    } else if (currentView === "week") {
      const startOfWeek = new Date(selectedDate);
      const day = startOfWeek.getDay();
      startOfWeek.setDate(startOfWeek.getDate() - day);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      return events.filter(event =>
        event.dateTime >= startOfWeek && event.dateTime < endOfWeek
      );
    } else {
      return events.filter(event =>
        event.dateTime.getMonth() === selectedDate.getMonth() &&
        event.dateTime.getFullYear() === selectedDate.getFullYear()
      );
    }
  }

  const filteredEvents = getFilteredEvents();
  const totalEvents = events.length;
  const completedEvents = events.filter(e => e.completed).length;
  const pendingEvents = totalEvents - completedEvents;

  function getMonthName(month: number) {
    const months = [
      "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return months[month];
  }

  function navigateDate(direction: "prev" | "next") {
    const newDate = new Date(selectedDate);
    if (currentView === "day") {
      newDate.setDate(selectedDate.getDate() + (direction === "next" ? 1 : -1));
    } else if (currentView === "week") {
      newDate.setDate(selectedDate.getDate() + (direction === "next" ? 7 : -7));
    } else {
      newDate.setMonth(selectedDate.getMonth() + (direction === "next" ? 1 : -1));
    }
    setSelectedDate(newDate);
  }

  function getViewTitle() {
    if (currentView === "day") {
      return selectedDate.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      });
    } else if (currentView === "week") {
      const startOfWeek = new Date(selectedDate);
      const day = startOfWeek.getDay();
      startOfWeek.setDate(startOfWeek.getDate() - day);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `${startOfWeek.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} - ${endOfWeek.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}`;
    } else {
      return `${getMonthName(selectedDate.getMonth())} ${selectedDate.getFullYear()}`;
    }
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-72 bg-white shadow-lg flex flex-col dark:bg-gray-800">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:text-white">
            Smartplanix
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Sua agenda inteligente</p>
        </div>

        {/* Botão Novo Compromisso */}
        <div className="p-4">
          <button
            onClick={openCreateModal}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <PlusIcon className="w-5 h-5" />
            Novo Compromisso
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 px-4 space-y-1">
          <button
            onClick={() => setCurrentView("day")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === "day"
                ? "bg-blue-50 text-blue-600 dark:bg-gray-700 dark:text-blue-400"
                : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            <LayoutListIcon className="w-5 h-5" />
            <span className="font-medium">Diário</span>
          </button>

          <button
            onClick={() => setCurrentView("week")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === "week"
                ? "bg-blue-50 text-blue-600 dark:bg-gray-700 dark:text-blue-400"
                : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            <CalendarDaysIcon className="w-5 h-5" />
            <span className="font-medium">Semanal</span>
          </button>

          <button
            onClick={() => setCurrentView("month")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === "month"
                ? "bg-blue-50 text-blue-600 dark:bg-gray-700 dark:text-blue-400"
                : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            <CalendarMonthIcon className="w-5 h-5" />
            <span className="font-medium">Mensal</span>
          </button>
        </nav>

        {/* Estatísticas */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="bg-gray-50 rounded-xl p-4 dark:bg-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Resumo</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Total</span>
                <span className="font-semibold text-gray-700 dark:text-gray-200">{totalEvents}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-600 dark:text-green-400">Concluídos</span>
                <span className="font-semibold text-green-600 dark:text-green-400">{completedEvents}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-yellow-600 dark:text-yellow-400">Pendentes</span>
                <span className="font-semibold text-yellow-600 dark:text-yellow-400">{pendingEvents}</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${totalEvents ? (completedEvents / totalEvents) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Toggle de Tema - ADICIONADO AQUI */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <div className="flex items-center gap-3">
              {isDarkMode ? (
                <SunIcon className="w-5 h-5 text-yellow-500" />
              ) : (
                <MoonIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {isDarkMode ? "Tema Claro" : "Tema Escuro"}
              </span>
            </div>
            <div
              className={`w-10 h-5 rounded-full transition-colors ${
                isDarkMode ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform mt-0.5 ${
                  isDarkMode ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          {/* Header com navegação de data */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigateDate("prev")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-gray-700 dark:text-gray-300"
              >
                ←
              </button>

              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                {getViewTitle()}
              </h2>

              <button
                onClick={() => navigateDate("next")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-gray-700 dark:text-gray-300"
              >
                →
              </button>
            </div>
          </div>

          {/* Lista de Compromissos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 dark:bg-gray-800 dark:border-gray-700">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <CalendarMonthIcon className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Nenhum compromisso
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {currentView === "day" && "para este dia"}
                  {currentView === "week" && "para esta semana"}
                  {currentView === "month" && "para este mês"}
                </p>
                <button
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  Adicionar Compromisso
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-shadow dark:bg-gray-700"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <button
                          onClick={() => toggleComplete(event.id)}
                          className="text-gray-400 hover:text-green-500 transition-colors"
                        >
                          {event.completed ? (
                            <CheckCircleIcon className="w-5 h-5 text-green-500" />
                          ) : (
                            <CircleIcon className="w-5 h-5" />
                          )}
                        </button>
                        <div className="flex-1">
                          <p
                            className={`font-medium ${
                              event.completed
                                ? "line-through text-gray-400 dark:text-gray-500"
                                : "text-gray-700 dark:text-gray-200"
                            }`}
                          >
                            {event.title}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1">
                            <span>
                              {event.dateTime.toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "long",
                              })}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <ClockIcon className="w-3 h-3" />
                              {formatTime(event.dateTime)}
                            </span>
                            {event.category && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <TagIcon className="w-3 h-3" />
                                  {event.category}
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditingEvent(event);
                            setEditTitle(event.title);
                            setEditDateTime(event.dateTime);
                            const hours = event.dateTime.getHours().toString().padStart(2, "0");
                            const minutes = event.dateTime.getMinutes().toString().padStart(2, "0");
                            setEditTime(`${hours}:${minutes}`);
                            setEditReminder(event.reminder || false);
                            setEditRepeat(event.repeat || "none");
                            setEditCategory(event.category || "");
                            setEditDescription(event.description || "");
                          }}
                          className="text-gray-400 hover:text-yellow-500 p-2 rounded-lg transition-colors"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveEvent(event.id)}
                          className="text-gray-400 hover:text-red-500 p-2 rounded-lg transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal de Criar Compromisso */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                Novo Compromisso
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Titulo
                  </label>
                  <input
                    type="text"
                    placeholder="Digite o titulo do compromisso"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddEvent()}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data
                  </label>
                  <Calendar
                    mode="single"
                    selected={selectedDateTime}
                    onSelect={(date) => date && setSelectedDateTime(date)}
                    locale={ptBR}
                    className="rounded-md border dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Horario
                  </label>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-gray-400" />
                    <input
                      type="time"
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Lembrete
                  </label>
                  <button
                    onClick={() => setReminder(!reminder)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${reminder ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${reminder ? "translate-x-6" : "translate-x-1"}`}
                    />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Repetir
                  </label>
                  <select
                    value={repeat}
                    onChange={(e) => setRepeat(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  >
                    <option value="none">Nao repetir</option>
                    <option value="daily">Diariamente</option>
                    <option value="weekly">Semanalmente</option>
                    <option value="monthly">Mensalmente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Categoria
                  </label>
                  <div className="flex items-center gap-2">
                    <TagIcon className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Ex: Trabalho, Pessoal, Estudos"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descricao
                  </label>
                  <div className="flex items-start gap-2">
                    <FileTextIcon className="w-4 h-4 text-gray-400 mt-2" />
                    <textarea
                      placeholder="Adicione uma descricao detalhada..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddEvent}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Editar Compromisso */}
      {editingEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                Editar Compromisso
              </h2>
              <button
                onClick={() => setEditingEvent(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Titulo
                  </label>
                  <input
                    type="text"
                    placeholder="Digite o titulo do compromisso"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data
                  </label>
                  <Calendar
                    mode="single"
                    selected={editDateTime}
                    onSelect={(date) => date && setEditDateTime(date)}
                    locale={ptBR}
                    className="rounded-md border dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Horario
                  </label>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-gray-400" />
                    <input
                      type="time"
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Lembrete
                  </label>
                  <button
                    onClick={() => setEditReminder(!editReminder)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editReminder ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editReminder ? "translate-x-6" : "translate-x-1"}`}
                    />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Repetir
                  </label>
                  <select
                    value={editRepeat}
                    onChange={(e) => setEditRepeat(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  >
                    <option value="none">Nao repetir</option>
                    <option value="daily">Diariamente</option>
                    <option value="weekly">Semanalmente</option>
                    <option value="monthly">Mensalmente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Categoria
                  </label>
                  <div className="flex items-center gap-2">
                    <TagIcon className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Ex: Trabalho, Pessoal, Estudos"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descricao
                  </label>
                  <div className="flex items-start gap-2">
                    <FileTextIcon className="w-4 h-4 text-gray-400 mt-2" />
                    <textarea
                      placeholder="Adicione uma descricao detalhada..."
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={3}
                      className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setEditingEvent(null)}
                className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEditEvent}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}