const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), Math.max(lo, hi));

export function inViewport(el) {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.right > 0 && r.top < window.innerHeight && r.left < window.innerWidth;
}

// Positions a fixed-position popup next to an anchor.
// placement: "bottom-start" | "bottom-end" | "bottom" | "top-start" | "top-end" | "top"
//            | "right" | "left"
// Flips to the opposite side when there is no room, clamps to the viewport.
// Returns { side, origin } so the caller can set transform-origin.
export function place(anchor, pop, { placement = "bottom-start", offset = 8, margin = 12 } = {}) {
  const a = anchor.getBoundingClientRect();
  const w = pop.offsetWidth;
  const h = pop.offsetHeight;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const [want, align = "start"] = placement.split("-");

  let side = want;
  if (side === "bottom" && h + offset > vh - a.bottom - margin && a.top - margin > vh - a.bottom - margin) side = "top";
  else if (side === "top" && h + offset > a.top - margin && vh - a.bottom - margin > a.top - margin) side = "bottom";

  let top;
  let left;
  if (side === "bottom" || side === "top") {
    top = side === "bottom" ? a.bottom + offset : a.top - h - offset;
    if (align === "end") left = a.right - w;
    else if (align === "center") left = a.left + a.width / 2 - w / 2;
    else left = a.left;
  } else {
    left = side === "right" ? a.right + offset : a.left - w - offset;
    top = align === "end" ? a.bottom - h : a.top;
  }

  left = clamp(left, margin, vw - w - margin);
  top = clamp(top, margin, vh - h - margin);
  pop.style.left = `${Math.round(left)}px`;
  pop.style.top = `${Math.round(top)}px`;

  const vert = side === "top" ? "bottom" : side === "bottom" ? "top" : "";
  const horiz = align === "end" ? "right" : align === "center" ? "center" : "left";
  const origin = side === "left" || side === "right"
    ? `${side === "right" ? "left" : "right"} ${align === "end" ? "bottom" : "top"}`
    : `${horiz} ${vert}`;
  pop.style.transformOrigin = origin;
  return { side, origin };
}
