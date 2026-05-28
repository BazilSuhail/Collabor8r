const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export default function Highlight({ text = "", query = "" }) {
  const q = String(query ?? "").trim();
  const value = String(text ?? "");
  if (!q) return value;
  const parts = value.split(new RegExp(`(${escapeRegExp(q)})`, "gi"));
  return parts.map((part, i) => (i % 2 === 1 ? <mark key={i}>{part}</mark> : part));
}
