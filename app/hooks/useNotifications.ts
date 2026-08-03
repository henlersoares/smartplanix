import { useEffect, useRef } from "react";

export function useNotifications() {
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  function scheduleNotification(
    title: string,
    dateTime: Date,
    minutesBefore = 15
  ): number | null {
    if (!("Notification" in window)) return null;
    if (Notification.permission !== "granted") return null;

    const msUntilReminder = dateTime.getTime() - Date.now() - minutesBefore * 60 * 1000;
    if (msUntilReminder <= 0) return null;

    const id = window.setTimeout(() => {
      new Notification(`Lembrete: ${title}`, {
        body: `Começa em ${minutesBefore} minutos`,
        icon: "/favicon.ico",
      });
    }, msUntilReminder);

    return id;
  }

  function cancelNotification(id: number | null) {
    if (id !== null) window.clearTimeout(id);
  }

  return { scheduleNotification, cancelNotification };
}