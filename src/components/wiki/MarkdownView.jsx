import { Fragment } from "react";
import { cn } from "../../utils/cn.js";

// Renders a small Markdown subset as React elements. Raw HTML is never parsed:
// every piece of text becomes a text node, so markup in the source shows as text.
const INLINE = /`([^`\n]+)`|\[([^\]\n]+)\]\(([^)\s]+)\)|\*\*([^*\n]+)\*\*|\*([^*\n]+)\*|_([^_\n]+)_/g;
const BLOCK_START = /^(#{1,3}\s|```|>|\s*[-*+]\s|\s*\d+[.)]\s|(-{3,}|\*{3,})\s*$)/;

export function safeHref(url) {
  try {
    const parsed = new URL(url);
    return ["http:", "https:", "mailto:"].includes(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
}

function inline(text, keyBase) {
  const out = [];
  let last = 0;
  let n = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const key = `${keyBase}-${n++}`;
    if (m[1] !== undefined) {
      out.push(
        <code key={key} className="rounded-[6px] bg-well px-[5px] py-[1px] text-[0.92em]">
          {m[1]}
        </code>,
      );
    } else if (m[2] !== undefined) {
      const href = safeHref(m[3]);
      out.push(
        href ? (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[color:var(--iris-t)] underline underline-offset-2"
          >
            {m[2]}
          </a>
        ) : (
          <Fragment key={key}>{m[2]}</Fragment>
        ),
      );
    } else if (m[4] !== undefined) {
      out.push(<strong key={key} className="font-bold">{m[4]}</strong>);
    } else {
      out.push(<em key={key}>{m[5] ?? m[6]}</em>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function parse(source) {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }
    if (line.startsWith("```")) {
      const code = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith("```")) code.push(lines[i++]);
      i += 1;
      blocks.push({ type: "code", text: code.join("\n") });
      continue;
    }
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2] });
      i += 1;
      continue;
    }
    if (/^(-{3,}|\*{3,})\s*$/.test(line)) {
      blocks.push({ type: "rule" });
      i += 1;
      continue;
    }
    if (line.startsWith(">")) {
      const quoted = [];
      while (i < lines.length && lines[i].startsWith(">")) quoted.push(lines[i++].replace(/^>\s?/, ""));
      blocks.push({ type: "quote", text: quoted.join("\n") });
      continue;
    }
    if (/^\s*[-*+]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*+]\s+/, ""));
      blocks.push({ type: "ul", items });
      continue;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+[.)]\s+/, ""));
      blocks.push({ type: "ol", items });
      continue;
    }
    const para = [];
    while (i < lines.length && lines[i].trim() && !BLOCK_START.test(lines[i])) para.push(lines[i++]);
    if (!para.length) para.push(lines[i++]);
    blocks.push({ type: "p", text: para.join(" ") });
  }
  return blocks;
}

function renderBlock(block, index) {
  const key = `b${index}`;
  switch (block.type) {
    case "heading": {
      if (block.level === 1) {
        return (
          <h2 key={key} className="mt-[1.1em] mb-[0.4em] [font:700_22px_var(--display)] tracking-[-0.02em]">
            {inline(block.text, key)}
          </h2>
        );
      }
      if (block.level === 2) {
        return (
          <h3 key={key} className="mt-[1em] mb-[0.35em] [font:600_18px_var(--display)] tracking-[-0.015em]">
            {inline(block.text, key)}
          </h3>
        );
      }
      return (
        <h4 key={key} className="mt-[0.9em] mb-[0.3em] font-bold text-[15px]">
          {inline(block.text, key)}
        </h4>
      );
    }
    case "code":
      return (
        <pre key={key} className="my-[10px] overflow-x-auto rounded-[12px] bg-well p-[12px] text-[13px] leading-[1.5]">
          <code>{block.text}</code>
        </pre>
      );
    case "rule":
      return <hr key={key} className="my-[16px] border-0 border-t border-line" />;
    case "quote":
      return (
        <blockquote key={key} className="my-[10px] border-l-[3px] border-line-2 pl-[14px] text-muted">
          {inline(block.text, key)}
        </blockquote>
      );
    case "ul":
      return (
        <ul key={key} className="my-[8px] list-disc pl-[22px]">
          {block.items.map((item, n) => (
            <li key={`${key}-${n}`}>{inline(item, `${key}-${n}`)}</li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol key={key} className="my-[8px] list-decimal pl-[22px]">
          {block.items.map((item, n) => (
            <li key={`${key}-${n}`}>{inline(item, `${key}-${n}`)}</li>
          ))}
        </ol>
      );
    default:
      return (
        <p key={key} className="my-[8px]">
          {inline(block.text, key)}
        </p>
      );
  }
}

// Accepts a Markdown string or an object with a text field.
export default function MarkdownView({ text, className }) {
  const source =
    typeof text === "string" ? text : typeof text?.text === "string" ? text.text : "";
  const blocks = parse(source);
  return (
    <div className={cn("break-words text-[15px] leading-[1.65] text-text", className)}>
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
}
