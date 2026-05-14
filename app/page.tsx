"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useTheme } from "next-themes";
import { Calendar } from "@/components/ui/calendar";
import { useNotifications } from "@/app/hooks/useNotifications";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  PlusIcon, TrashIcon, ClockIcon, XIcon, FileTextIcon, LayoutListIcon,
  CalendarDaysIcon, CalendarIcon as CalendarMonthIcon,
  SunIcon, MoonIcon, ListTodoIcon,
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

const CATEGORY_COLORS: Record<string, string> = {
  "Trabalho": "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  "Pessoal": "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
  "Estudos": "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
  "Saúde": "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
  "Família": "bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300",
};

function getCategoryColor(category?: string) {
  if (!category) return "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300";
  return CATEGORY_COLORS[category] || "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
}

function CategorySelector({ value, onChange, customCategories, onAddCategory }: {
  value: string; onChange: (cat: string) => void;
  customCategories: string[]; onAddCategory: (cat: string) => void;
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
          <button key={cat} type="button" onClick={() => onChange(value === cat ? "" : cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${value === cat
              ? "bg-blue-500 text-white border-blue-500"
              : "bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-blue-400 hover:text-blue-500"}`}>
            {cat}
          </button>
        ))}
        <button type="button" onClick={() => setShowInput(!showInput)}
          className="px-3 py-1 rounded-full text-xs font-medium border border-dashed border-gray-300 dark:border-gray-600 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center gap-1">
          <PlusIcon className="w-3 h-3" />Nova
        </button>
      </div>
      {showInput && (
        <div className="flex items-center gap-2">
          <input type="text" placeholder="Nome da categoria" value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="flex-1 px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" autoFocus />
          <button type="button" onClick={handleAdd} className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">Adicionar</button>
          <button type="button" onClick={() => { setShowInput(false); setNewCategory(""); }} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function EventModal({ mode, isOpen, onClose, onSubmit, title, setTitle, dateTime, setDateTime, time, setTime, reminder, setReminder, repeat, setRepeat, category, setCategory, description, setDescription, customCategories, onAddCategory }: {
  mode: "create" | "edit"; isOpen: boolean; onClose: () => void; onSubmit: () => void;
  title: string; setTitle: (v: string) => void; dateTime: Date; setDateTime: (v: Date) => void;
  time: string; setTime: (v: string) => void; reminder: boolean; setReminder: (v: boolean) => void;
  repeat: "none" | "daily" | "weekly" | "monthly"; setRepeat: (v: "none" | "daily" | "weekly" | "monthly") => void;
  category: string; setCategory: (v: string) => void; description: string; setDescription: (v: string) => void;
  customCategories: string[]; onAddCategory: (cat: string) => void;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            {mode === "create" ? "Novo Compromisso" : "Editar Compromisso"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Titulo</label>
              <input type="text" placeholder="Digite o titulo do compromisso" value={title}
                onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onSubmit()}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Data</label>
              <Calendar mode="single" selected={dateTime} onSelect={(date) => date && setDateTime(date)}
                locale={ptBR} className="rounded-md border dark:bg-gray-700 dark:border-gray-600 w-full" />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Horario</label>
              <div className="flex items-center gap-2">
                <ClockIcon className="w-4 h-4 text-gray-400" />
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Lembrete</label>
              <button onClick={() => setReminder(!reminder)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${reminder ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${reminder ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Repetir</label>
              <select value={repeat} onChange={(e) => setRepeat(e.target.value as any)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white">
                <option value="none">Nao repetir</option>
                <option value="daily">Diariamente</option>
                <option value="weekly">Semanalmente</option>
                <option value="monthly">Mensalmente</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Categoria</label>
              <CategorySelector value={category} onChange={setCategory} customCategories={customCategories} onAddCategory={onAddCategory} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Descricao</label>
              <div className="flex items-start gap-2">
                <FileTextIcon className="w-4 h-4 text-gray-400 mt-2" />
                <textarea placeholder="Adicione uma descricao detalhada..." value={description}
                  onChange={(e) => setDescription(e.target.value)} rows={3}
                  className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none dark:text-white" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">Cancelar</button>
          <button onClick={onSubmit} className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            {mode === "create" ? "Adicionar" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function NowLine({ isToday }: { isToday: boolean }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  if (!isToday) return null;

  const minutes = now.getHours() * 60 + now.getMinutes();
  const top = (minutes / 60) * 56; // 56px por hora

  return (
    <div className="absolute left-0 right-0 z-10 pointer-events-none" style={{ top: `${top}px` }}>
      <div className="flex items-center">
        <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 shrink-0" />
        <div className="flex-1 h-px bg-red-500" />
      </div>
    </div>
  );
}

function DayGrid({ events, selectedDate, onEventClick, onAddClick, onToggleComplete }: {
  events: EventType[]; selectedDate: Date;
  onEventClick: (event: EventType) => void;
  onAddClick: () => void;
  onToggleComplete: (id: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  const isToday = selectedDate.toDateString() === today.toDateString();

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 8 * 56;
  }, [selectedDate]);

  function getEventsForHour(hour: number) {
    return events.filter(e => e.dateTime.getHours() === hour);
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="flex border-b border-gray-100 dark:border-gray-700 p-4 items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${isToday ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"}`}>
          {selectedDate.getDate()}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 capitalize">
            {selectedDate.toLocaleDateString("pt-BR", { weekday: "long" })}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {events.length} {events.length === 1 ? "compromisso" : "compromissos"}
          </p>
        </div>
        <button onClick={onAddClick}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors shadow-sm">
          <PlusIcon className="w-4 h-4" />
        </button>
      </div>
      <div ref={scrollRef} className="overflow-y-auto max-h-[600px]">
        <div className="relative">
          {HOURS.map((hour) => {
            const hourEvents = getEventsForHour(hour);
            return (
              <div key={hour} className="flex border-b border-gray-50 dark:border-gray-700/50 min-h-[56px]">
                <div className="w-20 shrink-0 text-xs text-gray-400 dark:text-gray-500 border-r border-gray-100 dark:border-gray-700 text-right pr-3 pt-2">
                  {hour.toString().padStart(2, "0")}:00
                </div>
                <div className="flex-1 p-1">
                  {hourEvents.map((event) => (
                    <Popover key={event.id}>
                      <PopoverTrigger asChild>
                        <button className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium mb-1 transition-opacity hover:opacity-80 ${event.completed ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 line-through" : getCategoryColor(event.category)}`}>
                          <span className="block font-semibold">{event.title}</span>
                          <span className="opacity-70 flex items-center gap-1 mt-0.5">
                            <ClockIcon className="w-3 h-3" />
                            {event.dateTime.getHours().toString().padStart(2, "0")}:{event.dateTime.getMinutes().toString().padStart(2, "0")}
                            {event.category && ` · ${event.category}`}
                          </span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 p-0 dark:bg-gray-800 dark:border-gray-700" align="start" sideOffset={5}>
                        <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                            {event.dateTime.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
                          </p>
                        </div>
                        <div className="p-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${getCategoryColor(event.category).split(" ")[0]}`} />
                            <p className={`text-sm font-medium flex-1 truncate ${event.completed ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-700 dark:text-gray-200"}`}>{event.title}</p>
                          </div>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 pl-4">
                            {event.dateTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            {event.category && ` · ${event.category}`}
                          </p>
                        </div>
                        <div className="p-2 border-t border-gray-100 dark:border-gray-700 flex gap-1">
                          <button
                            onClick={() => onToggleComplete(event.id)}
                            className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${event.completed ? "text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700" : "text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"}`}>
                            {event.completed ? "↩ Pendente" : "✓ Concluído"}
                          </button>
                          <div className="w-px bg-gray-100 dark:bg-gray-700" />
                          <button onClick={() => onEventClick(event)}
                            className="flex-1 text-xs text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 py-1.5 rounded-md transition-colors">
                            Editar →
                          </button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  ))}
                </div>
              </div>
            );
          })}
          <NowLine isToday={isToday} />
        </div>
      </div>
    </div>
  );
}

function WeekGrid({ events, selectedDate, onEventClick, onToggleComplete }: {
  events: EventType[]; selectedDate: Date; onEventClick: (event: EventType) => void; onToggleComplete: (id: number) => void;
}) {
  const startOfWeek = new Date(selectedDate);
  startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 8 * 56;
  }, []);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });
  const today = new Date();

  function getEventsForDayAndHour(day: Date, hour: number) {
    return events.filter(e => e.dateTime.toDateString() === day.toDateString() && e.dateTime.getHours() === hour);
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="flex border-b border-gray-100 dark:border-gray-700">
        <div className="w-20 shrink-0 border-r border-gray-100 dark:border-gray-700" />
        {weekDays.map((day, i) => {
          const isToday = day.toDateString() === today.toDateString();
          return (
            <div key={i} className="flex-1 p-1 relative">
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase text-center">{WEEK_DAYS[i]}</p>
              <p className={`text-sm font-semibold mt-1 w-7 h-7 flex items-center justify-center mx-auto rounded-full ${isToday ? "bg-blue-500 text-white" : "text-gray-700 dark:text-gray-200"}`}>
                {day.getDate()}
              </p>
            </div>
          );
        })}
      </div>
      <div ref={scrollRef} className="overflow-y-auto max-h-[600px]">
        <div className="relative">
          {HOURS.map((hour) => (
            <div key={hour} className="flex border-b border-gray-50 dark:border-gray-700/50 min-h-[56px] min-w-full">
              <div className="w-20 shrink-0 text-xs text-gray-400 dark:text-gray-500 border-r border-gray-100 dark:border-gray-700 text-right pr-3 pt-2">
                {hour.toString().padStart(2, "0")}:00
              </div>
              {weekDays.map((day, dayIndex) => {
                const dayEvents = getEventsForDayAndHour(day, hour);
                return (
                  <div key={dayIndex} className="flex-1 p-1 relative">
                    {dayEvents.map((event) => (
                      <Popover key={event.id}>
                        <PopoverTrigger asChild>
                          <button className={`w-full text-left px-2 py-1 rounded-md text-xs font-medium mb-1 transition-opacity hover:opacity-80 ${event.completed ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 line-through" : getCategoryColor(event.category)}`}>
                            <span className="block truncate">{event.title}</span>
                            <span className="text-xs opacity-70">
                              {event.dateTime.getHours().toString().padStart(2, "0")}:{event.dateTime.getMinutes().toString().padStart(2, "0")}
                            </span>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-0 dark:bg-gray-800 dark:border-gray-700" align="start">
                          <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                              {event.dateTime.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
                            </p>
                          </div>
                          <div className="p-2">
                            <button onClick={() => onEventClick(event)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full shrink-0 ${getCategoryColor(event.category).split(" ")[0]}`} />
                                <p className={`text-sm font-medium flex-1 truncate ${event.completed ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-700 dark:text-gray-200"}`}>{event.title}</p>
                              </div>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 pl-4">
                                {event.dateTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                {event.category && ` · ${event.category}`}
                              </p>
                            </button>
                          </div>
                          <div className="p-2 border-t border-gray-100 dark:border-gray-700 flex gap-1">
                            <button
                              onClick={() => onToggleComplete(event.id)}
                              className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${event.completed ? "text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700" : "text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"}`}>
                              {event.completed ? "↩ Pendente" : "✓ Concluído"}
                            </button>
                            <div className="w-px bg-gray-100 dark:bg-gray-700" />
                            <button onClick={() => onEventClick(event)}
                              className="flex-1 text-xs text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 py-1.5 rounded-md transition-colors">
                              Editar →
                            </button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
          {/* Linha vermelha do agora na semana */}
          {(() => {
            const now = new Date();
            const todayIndex = weekDays.findIndex(d => d.toDateString() === now.toDateString());
            if (todayIndex === -1) return null;
            const [nowState, setNowState] = useState(now);
            useEffect(() => {
              const interval = setInterval(() => setNowState(new Date()), 60000);
              return () => clearInterval(interval);
            }, []);
            const minutes = nowState.getHours() * 60 + nowState.getMinutes();
            const top = (minutes / 60) * 56;
            const leftPercent = (todayIndex / 7) * 100;
            const widthPercent = (1 / 7) * 100;
            return (
              <div className="absolute z-10 pointer-events-none" style={{ top: `${top}px`, left: `calc(80px + ${leftPercent}%)`, width: `${widthPercent}%` }}>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 shrink-0" />
                  <div className="flex-1 h-px bg-red-500" />
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

function MonthGrid({ events, selectedDate, onDayClick, onEventClick }: {
  events: EventType[]; selectedDate: Date;
  onDayClick: (date: Date) => void; onEventClick: (event: EventType) => void;
}) {
  const today = new Date();
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPadding = firstDay.getDay();

  const days: (Date | null)[] = [];
  for (let i = 0; i < startPadding; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
  while (days.length % 7 !== 0) days.push(null);

  function getEventsForDay(date: Date) {
    return events.filter(e => e.dateTime.toDateString() === date.toDateString())
      .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-700">
        {WEEK_DAYS.map((d) => (
          <div key={d} className="py-3 text-center text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((date, idx) => {
          if (!date) return (
            <div key={`empty-${idx}`} className="min-h-[120px] border-b border-r border-gray-50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-900/20" />
          );
          const dayEvents = getEventsForDay(date);
          const isToday = date.toDateString() === today.toDateString();
          const isSelected = date.toDateString() === selectedDate.toDateString();
          const isCurrentMonth = date.getMonth() === month;
          const maxVisible = 3;
          const extra = dayEvents.length - maxVisible;
          const hasEvents = dayEvents.length > 0;

          return (
            <Popover key={date.toISOString()}>
              <PopoverTrigger asChild>
                <div onClick={() => !hasEvents && onDayClick(date)}
                  className={`min-h-[120px] border-b border-r border-gray-100 dark:border-gray-700/50 p-2 cursor-pointer transition-colors hover:bg-blue-50/50 dark:hover:bg-blue-900/10 ${isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-lg font-bold leading-none ${isToday ? "w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 text-white text-base" : isCurrentMonth ? "text-gray-800 dark:text-gray-100" : "text-gray-300 dark:text-gray-600"}`}>
                      {date.getDate()}
                    </span>
                    {hasEvents && <span className="text-xs text-gray-400 dark:text-gray-500">{dayEvents.length} {dayEvents.length === 1 ? "compromisso" : "compromissos"}</span>}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, maxVisible).map((event) => (
                      <div key={event.id} className={`w-full text-left px-2 py-0.5 rounded-md text-xs font-medium truncate ${event.completed ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 line-through" : getCategoryColor(event.category)}`}>
                        {event.title}
                      </div>
                    ))}
                    {extra > 0 && <p className="text-xs text-gray-400 dark:text-gray-500 pl-1">+{extra} mais</p>}
                  </div>
                </div>
              </PopoverTrigger>
              {hasEvents && (
                <PopoverContent className="w-72 p-0 dark:bg-gray-800 dark:border-gray-700" align="start">
                  <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
                    </p>
                  </div>
                  <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
                    {dayEvents.map((event) => (
                      <button key={event.id} onClick={() => onEventClick(event)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${getCategoryColor(event.category).split(" ")[0]}`} />
                          <p className={`text-sm font-medium flex-1 truncate ${event.completed ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-700 dark:text-gray-200"}`}>{event.title}</p>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 pl-4">
                          {event.dateTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          {event.category && ` · ${event.category}`}
                        </p>
                      </button>
                    ))}
                  </div>
                  <div className="p-2 border-t border-gray-100 dark:border-gray-700">
                    <button onClick={() => onDayClick(date)} className="w-full text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 py-1 transition-colors">
                      Ver dia completo →
                    </button>
                  </div>
                </PopoverContent>
              )}
            </Popover>
          );
        })}
      </div>
    </div>
  );
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<EventType[]>([]);
  const { scheduleNotification } = useNotifications();
  const [currentView, setCurrentView] = useState<ViewType>("day");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [eventToDelete, setEventToDelete] = useState<number | null>(null);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDateTime, setFormDateTime] = useState(new Date());
  const [formTime, setFormTime] = useState("12:00");
  const [formReminder, setFormReminder] = useState(false);
  const [formRepeat, setFormRepeat] = useState<"none" | "daily" | "weekly" | "monthly">("none");
  const [formCategory, setFormCategory] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [loaded, setLoaded] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  const isDarkMode = mounted && theme === "dark";
  const toggleTheme = () => setTheme(isDarkMode ? "light" : "dark");

  useEffect(() => {
    const view = searchParams.get("view");
    if (view === "week" || view === "month" || view === "day") setCurrentView(view);
  }, [searchParams]);

  useEffect(() => {
    const saved = localStorage.getItem("events");
    if (saved) setEvents(JSON.parse(saved).map((e: any) => ({ ...e, dateTime: new Date(e.dateTime) })));
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem("events", JSON.stringify(events));
  }, [events, loaded]);

  useEffect(() => {
    const saved = localStorage.getItem("customCategories");
    if (saved) setCustomCategories(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("customCategories", JSON.stringify(customCategories));
  }, [customCategories]);

  function handleAddCustomCategory(cat: string) { setCustomCategories((prev) => [...prev, cat]); }

  function resetForm() {
    setFormTitle(""); setFormDateTime(new Date()); setFormTime("12:00");
    setFormReminder(false); setFormRepeat("none"); setFormCategory(""); setFormDescription("");
    setEditingEventId(null);
  }

  function openCreateModal(date?: Date) {
    resetForm();
    if (date) setFormDateTime(date);
    setModalMode("create");
    setModalOpen(true);
  }

  function openEditModal(event: EventType) {
    setFormTitle(event.title);
    setFormDateTime(event.dateTime);
    setFormTime(`${event.dateTime.getHours().toString().padStart(2, "0")}:${event.dateTime.getMinutes().toString().padStart(2, "0")}`);
    setFormReminder(event.reminder || false);
    setFormRepeat(event.repeat || "none");
    setFormCategory(event.category || "");
    setFormDescription(event.description || "");
    setEditingEventId(event.id);
    setModalMode("edit");
    setModalOpen(true);
  }

  function combineDateAndTime(date: Date, timeString: string): Date {
    const [hours, minutes] = timeString.split(":").map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
  }

  function handleSubmit() {
    if (!formTitle.trim()) { toast.error("Digite um compromisso!"); return; }
    const finalDateTime = combineDateAndTime(formDateTime, formTime);
    if (modalMode === "create") {
      const newEvent = { id: Date.now(), title: formTitle, completed: false, dateTime: finalDateTime, reminder: formReminder, repeat: formRepeat, category: formCategory.trim() || undefined, description: formDescription.trim() || undefined };
      setEvents((prev) => [...prev, newEvent]);
      if (formReminder) scheduleNotification(formTitle, finalDateTime);
      toast.success("Compromisso adicionado!", { description: `${formTitle} - ${finalDateTime.toLocaleDateString("pt-BR")} as ${finalDateTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` });
    } else {
      setEvents((prev) => prev.map((e) => e.id === editingEventId ? { ...e, title: formTitle, dateTime: finalDateTime, reminder: formReminder, repeat: formRepeat, category: formCategory.trim() || undefined, description: formDescription.trim() || undefined } : e));
      if (formReminder) scheduleNotification(formTitle, finalDateTime);
      toast.success("Compromisso editado!");
    }
    setModalOpen(false);
    resetForm();
    window.dispatchEvent(new Event('events-updated'));
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

  function getFilteredEvents() {
    if (currentView === "day") return events.filter(e => e.dateTime.toDateString() === selectedDate.toDateString());
    if (currentView === "week") {
      const start = new Date(selectedDate);
      start.setDate(selectedDate.getDate() - selectedDate.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      return events.filter(e => e.dateTime >= start && e.dateTime < end);
    }
    return events.filter(e => e.dateTime.getMonth() === selectedDate.getMonth() && e.dateTime.getFullYear() === selectedDate.getFullYear());
  }

  const filteredEvents = getFilteredEvents();

  // Dias com eventos para os pontinhos no mini calendário
  const daysWithEvents = events.reduce((acc, e) => {
    const key = e.dateTime.toDateString();
    acc[key] = true;
    return acc;
  }, {} as Record<string, boolean>);

  function getMonthName(month: number) {
    return ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"][month];
  }

  function navigateDate(direction: "prev" | "next") {
    const newDate = new Date(selectedDate);
    if (currentView === "day") newDate.setDate(selectedDate.getDate() + (direction === "next" ? 1 : -1));
    else if (currentView === "week") newDate.setDate(selectedDate.getDate() + (direction === "next" ? 7 : -7));
    else newDate.setMonth(selectedDate.getMonth() + (direction === "next" ? 1 : -1));
    setSelectedDate(newDate);
  }

  function getViewTitle() {
    if (currentView === "day") return selectedDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    if (currentView === "week") {
      const start = new Date(selectedDate);
      start.setDate(selectedDate.getDate() - selectedDate.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return `${start.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} - ${end.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}`;
    }
    return `${getMonthName(selectedDate.getMonth())} ${selectedDate.getFullYear()}`;
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <aside className="w-72 bg-white shadow-lg flex flex-col dark:bg-gray-800 overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:text-white">Smartplanix</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Sua agenda inteligente</p>
        </div>

        <div className="p-4">
          <button onClick={() => openCreateModal()} className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-sm">
            <PlusIcon className="w-5 h-5" />Novo Compromisso
          </button>
        </div>

        {(() => {
          const now = new Date();
          const next = events.filter(e => !e.completed && e.dateTime > now).sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())[0];
          if (!next) return null;
          const diff = next.dateTime.getTime() - now.getTime();
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const timeLabel = days > 1 ? `em ${days} dias` : days === 1 ? `amanhã` : hours > 0 ? `em ${hours}h${mins > 0 ? ` ${mins}min` : ""}` : `em ${mins} min`;
          return (
            <div className="mx-4 mb-3 mt-1 px-3 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 rounded-lg">
              <p className="text-xs text-blue-500 dark:text-blue-400 font-semibold mb-1">Próximo · {timeLabel}</p>
              <p className="text-sm font-bold text-blue-700 dark:text-blue-200 truncate">{next.title}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {next.dateTime.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} às {next.dateTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          );
        })()}

        <nav className="px-4 space-y-1 mb-3">
          {([["day", "Diário", LayoutListIcon], ["week", "Semanal", CalendarDaysIcon], ["month", "Mensal", CalendarMonthIcon]] as const).map(([view, label, Icon]) => (
            <button key={view} onClick={() => setCurrentView(view)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentView === view ? "bg-blue-50 text-blue-600 dark:bg-gray-700 dark:text-blue-400" : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700"}`}>
              <Icon className="w-5 h-5" />
              <span className="font-medium">{label}</span>
            </button>
          ))}
          <button onClick={() => router.push("/tasks")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700">
            <ListTodoIcon className="w-5 h-5" />
            <span className="font-medium">Tarefas</span>
          </button>
        </nav>

        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => { if (date) { setSelectedDate(date); setCurrentView("day"); } }}
            locale={ptBR}
            modifiers={{ hasEvent: (date) => !!daysWithEvents[date.toDateString()] }}
            modifiersClassNames={{ hasEvent: "relative after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-blue-500" }}
            className="rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-700/50 w-full [&_table]:w-full [&_td]:p-0 [&_th]:p-0 [&_button]:w-full [&_button]:text-xs [&_.rdp-caption_label]:text-xs [&_.rdp-nav_button]:h-6 [&_.rdp-nav_button]:w-6"
          />
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={toggleTheme} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
            <div className="flex items-center gap-3">
              {isDarkMode ? <SunIcon className="w-5 h-5 text-yellow-500" /> : <MoonIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{isDarkMode ? "Tema Claro" : "Tema Escuro"}</span>
            </div>
            <div className={`w-10 h-5 rounded-full transition-colors ${isDarkMode ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"}`}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform mt-0.5 ${isDarkMode ? "translate-x-5" : "translate-x-0.5"}`} />
            </div>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <button onClick={() => navigateDate("prev")} className="p-2 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-gray-700 dark:text-gray-300">←</button>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{getViewTitle()}</h2>
              <button onClick={() => navigateDate("next")} className="p-2 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-gray-700 dark:text-gray-300">→</button>
            </div>
          </div>

          {currentView === "day" && <DayGrid events={filteredEvents} selectedDate={selectedDate} onEventClick={openEditModal} onAddClick={() => openCreateModal(selectedDate)} onToggleComplete={toggleComplete} />}
          {currentView === "week" && <WeekGrid events={filteredEvents} selectedDate={selectedDate} onEventClick={openEditModal} onToggleComplete={toggleComplete} />}
          {currentView === "month" && <MonthGrid events={filteredEvents} selectedDate={selectedDate} onDayClick={(date) => { setSelectedDate(date); setCurrentView("day"); }} onEventClick={openEditModal} />}
        </div>
      </main>

      <EventModal
        mode={modalMode} isOpen={modalOpen}
        onClose={() => { setModalOpen(false); resetForm(); }}
        onSubmit={handleSubmit}
        title={formTitle} setTitle={setFormTitle}
        dateTime={formDateTime} setDateTime={setFormDateTime}
        time={formTime} setTime={setFormTime}
        reminder={formReminder} setReminder={setFormReminder}
        repeat={formRepeat} setRepeat={setFormRepeat}
        category={formCategory} setCategory={setFormCategory}
        description={formDescription} setDescription={setFormDescription}
        customCategories={customCategories} onAddCategory={handleAddCustomCategory}
      />

      <Dialog open={eventToDelete !== null} onOpenChange={() => setEventToDelete(null)}>
        <DialogContent className="dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle>Remover compromisso</DialogTitle>
            <DialogDescription>Tem certeza que deseja remover este compromisso? Esta ação não pode ser desfeita.</DialogDescription>
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

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}