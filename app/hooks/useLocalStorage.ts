import { useState, useEffect, useRef } from "react";

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  reviver?: (parsed: any) => T
) {
  const [value, setValue] = useState<T>(initialValue);
  const [loaded, setLoaded] = useState(false);
  const reviverRef = useRef(reviver);
  reviverRef.current = reviver;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        setValue(reviverRef.current ? reviverRef.current(parsed) : parsed);
      }
    } catch (err) {
      console.error(`Falha ao carregar "${key}" do localStorage:`, err);
    } finally {
      setLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error(`Falha ao salvar "${key}" no localStorage:`, err);
    }
  }, [key, value, loaded]);

  return [value, setValue, loaded] as const;
}