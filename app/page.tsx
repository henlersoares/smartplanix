"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { Calendar } from "@/components/ui/calendar";
import { useNotifications } from "./hooks/useNotifications";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

const DEFAULT_CATEGORIES = ["Trabalho", "Pessoal", "Estudos", "Saúde", "Família"];

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function CategorySelector({
  value,
  onChange,
  customCategories,
  onAddCategory,
}: {
  value: string;
  onChange: (cat: string) => void;
  customCategories: string[];
  onAddCategory: (cat: string) => void;
}) {
  const [showInput, setShowInput] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories];

  function handleAdd() {
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    if (!allCategories.includes(trimmed)) onAddCategory(trimmed);
    onChange(trimmed);
    setNewCategory("");
    setShowInput(false);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {allCategories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => onChange(value === cat ? "" : cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${value === cat
              ? "bg-blue-500 text-white border-blue-500"
              : "bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-blue-400 hover:text-blue-500"
              }`}
          >
            {cat}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowInput(!showInput)}
          className="px-3 py-1 rounded-full text-xs font-medium border border-dashed border-gray-300 dark:border-gray-600 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center gap-1"
        >
          <PlusIcon className="w-3 h-3" />
          Nova
        </button>
      </div>
      {showInput && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Nome da categoria"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="flex-1 px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            autoFocus
          />
          <button
            type="button"
            onClick={handleAdd}
            className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Adicionar
          </button>
          <button
            type="button"
            onClick={() => { setShowInput(false); setNewCategory(""); }}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// Grade semanal
function WeekGrid({
  events,
  selectedDate,
  onEventClick,
}: {
  events: EventType[];
  selectedDate: Date;
  onEventClick: (event: EventType) => void;
}) {
  const startOfWeek = new Date(selectedDate);
  startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 8 * 56; // 8h * 56px por hora
    }
  }, []);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const today = new Date();

  function getEventsForDayAndHour(day: Date, hour: number) {
    return events.filter((e) => {
      return (
        e.dateTime.toDateString() === day.toDateString() &&
        e.dateTime.getHours() === hour
      );
    });
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Header com dias da semana */}
      <div className="flex border-b border-gray-100 dark:border-gray-700">
        <div className="w-20 shrink-0 border-r border-gray-100 dark:border-gray-700" />
        {weekDays.map((day, i) => {
          const isToday = day.toDateString() === today.toDateString();
          return (
            <div
              key={i}
              className="flex-1 p-1 relative"
            >
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase text-center">
                {WEEK_DAYS[i]}
              </p>
              <p className={`text-sm font-semibold mt-1 w-7 h-7 flex items-center justify-center mx-auto rounded-full ${isToday ? "bg-blue-500 text-white" : "text-gray-700 dark:text-gray-200"
                }`}>
                {day.getDate()}
              </p>
            </div>
          );
        })}
      </div>

      {/* Grade de horários */}
      <div ref={scrollRef} className="overflow-y-auto max-h-[600px]">
        {HOURS.map((hour) => (
          <div
            key={hour}
            className="flex border-b border-gray-50 dark:border-gray-700/50 min-h-[56px] min-w-full"
          >
            {/* Coluna de hora */}
            <div className="w-20 shrink-0 text-xs text-gray-400 dark:text-gray-500 border-r border-gray-100 dark:border-gray-700 text-right pr-3 pt-2">
              {hour.toString().padStart(2, "0")}:00
            </div>

            {/* Células dos dias */}
            {weekDays.map((day, dayIndex) => {
              const dayEvents = getEventsForDayAndHour(day, hour);
              return (
                <div
                  key={dayIndex}
                  className="flex-1 border-r border-gray-100 dark:border-gray-700/50 last:border-r-0 p-1 relative"
                >
                  {dayEvents.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className={`w-full text-left px-2 py-1 rounded-md text-xs font-medium mb-1 transition-opacity hover:opacity-80 ${event.completed
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 line-through"
                        : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                        }`}
                    >
                      <span className="block truncate">{event.title}</span>
                      <span className="text-xs opacity-70">
                        {event.dateTime.getHours().toString().padStart(2, "0")}:
                        {event.dateTime.getMinutes().toString().padStart(2, "0")}
                      </span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [title, setTitle] = useState("");
  const [selectedDateTime, setSelectedDateTime] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState("12:00");
  const [events, setEvents] = useState<EventType[]>([]);
  const { scheduleNotification } = useNotifications();
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
  const [eventToDelete, setEventToDelete] = useState<number | null>(null);
  const [customCategories, setCustomCategories] = useState<string[]>([]);

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const isDarkMode = mounted && theme === "dark";
  const toggleTheme = () => setTheme(isDarkMode ? "light" : "dark");

  useEffect(() => {
    const saved = localStorage.getItem("events");
    if (saved) {
      const parsed = JSON.parse(saved);
      setEvents(parsed.map((e: any) => ({ ...e, dateTime: new Date(e.dateTime) })));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("events", JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    const saved = localStorage.getItem("customCategories");
    if (saved) setCustomCategories(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("customCategories", JSON.stringify(customCategories));
  }, [customCategories]);

  function handleAddCustomCategory(cat: string) {
    setCustomCategories((prev) => [...prev, cat]);
  }

  function combineDateAndTime(date: Date, timeString: string): Date {
    const [hours, minutes] = timeString.split(":").map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
  }

  function handleAddEvent() {
    if (!title.trim()) { toast.error("Digite um compromisso!"); return; }
    const finalDateTime = combineDateAndTime(selectedDateTime, selectedTime);
    const newEvent = {
      id: Date.now(), title, completed: false, dateTime: finalDateTime,
      reminder, repeat,
      category: category.trim() || undefined,
      description: description.trim() || undefined,
    };
    setEvents([...events, newEvent]);
    resetForm();
    setIsModalOpen(false);
    window.dispatchEvent(new Event('events-updated'));
    if (reminder) scheduleNotification(title, finalDateTime);
    toast.success("Compromisso adicionado!", {
      description: `${title} - ${finalDateTime.toLocaleDateString("pt-BR")} as ${finalDateTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
    });
  }

  function handleEditEvent() {
    if (!editingEvent) return;
    if (!editTitle.trim()) { toast.error("Digite um titulo!"); return; }
    const finalDateTime = combineDateAndTime(editDateTime, editTime);
    setEvents((prev) =>
      prev.map((event) =>
        event.id === editingEvent.id
          ? { ...event, title: editTitle, dateTime: finalDateTime, reminder: editReminder, repeat: editRepeat, category: editCategory.trim() || undefined, description: editDescription.trim() || undefined }
          : event
      )
    );
    setEditingEvent(null);
    window.dispatchEvent(new Event('events-updated'));
    if (editReminder) scheduleNotification(editTitle, finalDateTime);
    toast.success("Compromisso editado!");
  }

  function resetForm() {
    setTitle(""); setSelectedDateTime(new Date()); setSelectedTime("12:00");
    setReminder(false); setRepeat("none"); setCategory(""); setDescription("");
  }

  function toggleComplete(id: number) {
    setEvents((prev) => prev.map((e) => e.id === id ? { ...e, completed: !e.completed } : e));
    window.dispatchEvent(new Event('events-updated'));
  }

  function handleRemoveEvent(id: number) {
    const event = events.find((e) => e.id === id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
    window.dispatchEvent(new Event('events-updated'));
    toast.warning("Compromisso removido!", { description: event?.title });
  }

  function formatTime(date: Date): string {
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  function openCreateModal() { resetForm(); setIsModalOpen(true); }

  function openEditFromWeek(event: EventType) {
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
  }

  function getFilteredEvents() {
    if (currentView === "day") {
      return events.filter(e => e.dateTime.toDateString() === selectedDate.toDateString());
    } else if (currentView === "week") {
      const start = new Date(selectedDate);
      start.setDate(selectedDate.getDate() - selectedDate.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      return events.filter(e => e.dateTime >= start && e.dateTime < end);
    } else {
      return events.filter(e =>
        e.dateTime.getMonth() === selectedDate.getMonth() &&
        e.dateTime.getFullYear() === selectedDate.getFullYear()
      );
    }
  }

  const filteredEvents = getFilteredEvents();

  function getMonthName(month: number) {
    return ["Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"][month];
  }

  function navigateDate(direction: "prev" | "next") {
    const newDate = new Date(selectedDate);
    if (currentView === "day") newDate.setDate(selectedDate.getDate() + (direction === "next" ? 1 : -1));
    else if (currentView === "week") newDate.setDate(selectedDate.getDate() + (direction === "next" ? 7 : -7));
    else newDate.setMonth(selectedDate.getMonth() + (direction === "next" ? 1 : -1));
    setSelectedDate(newDate);
  }

  function getViewTitle() {
    if (currentView === "day") {
      return selectedDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    } else if (currentView === "week") {
      const start = new Date(selectedDate);
      start.setDate(selectedDate.getDate() - selectedDate.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return `${start.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} - ${end.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}`;
    } else {
      return `${getMonthName(selectedDate.getMonth())} ${selectedDate.getFullYear()}`;
    }
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-72 bg-white shadow-lg flex flex-col dark:bg-gray-800 overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:text-white">
            Smartplanix
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Sua agenda inteligente</p>
        </div>

        <div className="p-4">
          <button
            onClick={openCreateModal}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <PlusIcon className="w-5 h-5" />
            Novo Compromisso
          </button>
        </div>

        {(() => {
          const now = new Date();
          const next = events
            .filter(e => !e.completed && e.dateTime > now)
            .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())[0];

          if (!next) return null;

          const diff = next.dateTime.getTime() - now.getTime();
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

          const timeLabel =
            days > 1 ? `em ${days} dias` :
              days === 1 ? `amanhã` :
                hours > 0 ? `em ${hours}h${mins > 0 ? ` ${mins}min` : ""}` :
                  `em ${mins} min`;

          return (
            <div className="mx-4 mb-3 mt-1 px-3 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 rounded-lg">
              <p className="text-xs text-blue-500 dark:text-blue-400 font-semibold mb-1">
                Próximo · {timeLabel}
              </p>
              <p className="text-sm font-bold text-blue-700 dark:text-blue-200 truncate">
                {next.title}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {next.dateTime.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} às {next.dateTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          );
        })()}

        <nav className="px-4 space-y-1 mb-3">
          {([["day", "Diário", LayoutListIcon], ["week", "Semanal", CalendarDaysIcon], ["month", "Mensal", CalendarMonthIcon]] as const).map(([view, label, Icon]) => (
            <button
              key={view}
              onClick={() => setCurrentView(view)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentView === view
                ? "bg-blue-50 text-blue-600 dark:bg-gray-700 dark:text-blue-400"
                : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700"
                }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </nav>

        {/* Mini Calendário */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => { if (date) { setSelectedDate(date); setCurrentView("day"); } }}
            locale={ptBR}
            className="rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-700/50 w-full [&_table]:w-full [&_td]:p-0 [&_th]:p-0 [&_button]:w-full [&_button]:text-xs [&_.rdp-caption_label]:text-xs [&_.rdp-nav_button]:h-6 [&_.rdp-nav_button]:w-6"
          />
        </div>

        {/* Toggle de Tema */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <div className="flex items-center gap-3">
              {isDarkMode ? <SunIcon className="w-5 h-5 text-yellow-500" /> : <MoonIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {isDarkMode ? "Tema Claro" : "Tema Escuro"}
              </span>
            </div>
            <div className={`w-10 h-5 rounded-full transition-colors ${isDarkMode ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"}`}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform mt-0.5 ${isDarkMode ? "translate-x-5" : "translate-x-0.5"}`} />
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <button onClick={() => navigateDate("prev")} className="p-2 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-gray-700 dark:text-gray-300">←</button>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{getViewTitle()}</h2>
              <button onClick={() => navigateDate("next")} className="p-2 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-gray-700 dark:text-gray-300">→</button>
            </div>
          </div>

          {/* View Semanal */}
          {currentView === "week" && (
            <WeekGrid
              events={filteredEvents}
              selectedDate={selectedDate}
              onEventClick={openEditFromWeek}
            />
          )}

          {/* View Diária e Mensal */}
          {currentView !== "week" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 dark:bg-gray-800 dark:border-gray-700">
              {filteredEvents.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <CalendarMonthIcon className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Nenhum compromisso</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    {currentView === "day" && "para este dia"}
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
                    <div key={event.id} className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-shadow dark:bg-gray-700">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1">
                          <button onClick={() => toggleComplete(event.id)} className="text-gray-400 hover:text-green-500 transition-colors">
                            {event.completed ? <CheckCircleIcon className="w-5 h-5 text-green-500" /> : <CircleIcon className="w-5 h-5" />}
                          </button>
                          <div className="flex-1">
                            <p className={`font-medium ${event.completed ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-700 dark:text-gray-200"}`}>
                              {event.title}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1 flex-wrap">
                              <span>{event.dateTime.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <ClockIcon className="w-3 h-3" />
                                {formatTime(event.dateTime)}
                              </span>
                              {event.category && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
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
                          <button onClick={() => setEventToDelete(event.id)} className="text-gray-400 hover:text-red-500 p-2 rounded-lg transition-colors">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modal de Criar Compromisso */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Novo Compromisso</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Titulo</label>
                  <input type="text" placeholder="Digite o titulo do compromisso" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddEvent()} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" autoFocus />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Data</label>
                  <Calendar mode="single" selected={selectedDateTime} onSelect={(date) => date && setSelectedDateTime(date)} locale={ptBR} className="rounded-md border dark:bg-gray-700 dark:border-gray-600 w-full" />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Horario</label>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-gray-400" />
                    <input type="time" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Lembrete</label>
                  <button onClick={() => setReminder(!reminder)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${reminder ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${reminder ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Repetir</label>
                  <select value={repeat} onChange={(e) => setRepeat(e.target.value as any)} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white">
                    <option value="none">Nao repetir</option>
                    <option value="daily">Diariamente</option>
                    <option value="weekly">Semanalmente</option>
                    <option value="monthly">Mensalmente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Categoria</label>
                  <CategorySelector value={category} onChange={setCategory} customCategories={customCategories} onAddCategory={handleAddCustomCategory} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Descricao</label>
                  <div className="flex items-start gap-2">
                    <FileTextIcon className="w-4 h-4 text-gray-400 mt-2" />
                    <textarea placeholder="Adicione uma descricao detalhada..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none dark:text-white" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">Cancelar</button>
              <button onClick={handleAddEvent} className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">Adicionar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Editar Compromisso */}
      {editingEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Editar Compromisso</h2>
              <button onClick={() => setEditingEvent(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray:300 transition-colors">
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Titulo</label>
                  <input type="text" placeholder="Digite o titulo do compromisso" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Data</label>
                  <Calendar mode="single" selected={editDateTime} onSelect={(date) => date && setEditDateTime(date)} locale={ptBR} className="rounded-md border dark:bg-gray-700 dark:border-gray-600 w-full" />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Horario</label>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-gray-400" />
                    <input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Lembrete</label>
                  <button onClick={() => setEditReminder(!editReminder)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editReminder ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editReminder ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Repetir</label>
                  <select value={editRepeat} onChange={(e) => setEditRepeat(e.target.value as any)} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white">
                    <option value="none">Nao repetir</option>
                    <option value="daily">Diariamente</option>
                    <option value="weekly">Semanalmente</option>
                    <option value="monthly">Mensalmente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Categoria</label>
                  <CategorySelector value={editCategory} onChange={setEditCategory} customCategories={customCategories} onAddCategory={handleAddCustomCategory} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Descricao</label>
                  <div className="flex items-start gap-2">
                    <FileTextIcon className="w-4 h-4 text-gray-400 mt-2" />
                    <textarea placeholder="Adicione uma descricao detalhada..." value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none dark:text-white" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => setEditingEvent(null)} className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancelar</button>
              <button onClick={handleEditEvent} className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog de confirmação de remoção */}
      <Dialog open={eventToDelete !== null} onOpenChange={() => setEventToDelete(null)}>
        <DialogContent className="dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle>Remover compromisso</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover este compromisso? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button onClick={() => setEventToDelete(null)} className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">Cancelar</button>
            <button onClick={() => { if (eventToDelete !== null) handleRemoveEvent(eventToDelete); setEventToDelete(null); }} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">Remover</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}