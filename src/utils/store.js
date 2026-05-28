import { useCallback, useEffect, useState } from "react";
const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : raw;
  } catch {
    return fallback;
  }
};
const write = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
  }
};
const resolve = (pref) => pref === "system" ? matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light" : pref;
export function useTheme() {
  const [pref, setPref] = useState(() => {
    try {
      return JSON.parse(read("hearth:theme", '"light"'));
    } catch {
      return "light";
    }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = resolve(pref);
    write("hearth:theme", JSON.stringify(pref));
  }, [pref]);
  useEffect(() => {
    if (pref !== "system") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const sync = () => {
      document.documentElement.dataset.theme = resolve("system");
    };
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [pref]);
  const resolved = resolve(pref);
  const toggle = useCallback(() => {
    setPref(resolve(pref) === "dark" ? "light" : "dark");
  }, [pref]);
  return { pref, setPref, resolved, toggle };
}
export function useSidebar() {
  const [mini, setMini] = useState(() => read("hearth:mini", "0") === "1");
  useEffect(() => {
    document.documentElement.classList.toggle("side-mini", mini);
    write("hearth:mini", mini ? "1" : "0");
  }, [mini]);
  return { mini, setMini, toggle: useCallback(() => setMini((m) => !m), []) };
}
export function useDrawer() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle("side-open", open);
    if (!open) return;
    const esc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    addEventListener("keydown", esc);
    return () => removeEventListener("keydown", esc);
  }, [open]);
  return { open, setOpen, toggle: useCallback(() => setOpen((o) => !o), []) };
}

export function useDensity() {
  const [density, setDensity] = useState(() =>
    read("hearth:density", "comfortable") === "compact" ? "compact" : "comfortable",
  );
  useEffect(() => {
    document.documentElement.dataset.density = density;
    write("hearth:density", density);
  }, [density]);
  return { density, setDensity };
}
