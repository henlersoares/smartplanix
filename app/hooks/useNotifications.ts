import { useEffect } from "react";

export function useNotifications() {
    // Pede permissão ao usuário na primeira vez
    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    function scheduleNotification(title: string, dateTime: Date) {
        if (!("Notification" in window)) return;
        if (Notification.permission !== "granted") return;

        const msUntilEvent = dateTime.getTime() - Date.now();
        const msUntilReminder = msUntilEvent - 15 * 60 * 1000;

        // Só agenda se o lembrete ainda está no futuro
        if (msUntilReminder <= 0) return;

        setTimeout(() => {
            new Notification(`Lembrete: ${title}`, {
                body: `Começa em 15 minutos`,
                icon: "/favicon.ico",
            });
        }, msUntilReminder);
    }

    function cancelable(title: string, dateTime: Date) {
        const id = window.setTimeout(() => {
            new Notification(`Lembrete: ${title}`, {
                body: `Começa em 15 minutos`,
                icon: "/favicon.ico",
            });
        }, dateTime.getTime() - Date.now() - 15 * 60 * 1000);

        return id; // guarda o id pra cancelar se deletar o evento
    }

    return { scheduleNotification };
}