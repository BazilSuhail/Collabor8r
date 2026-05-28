import { useState } from "react";
import { cn } from "../../utils/cn.js";

// Light and dark SVG pair from public/illustrations/<name>-light.svg and <name>-dark.svg.
// The dark image shows through the dark: variant, which follows [data-theme=dark].
// If a file is missing, the illustration hides itself instead of showing a broken image.
export default function Illustration({ name, alt = "", className }) {
  const [broken, setBroken] = useState(false);
  if (broken) return null;
  const base = `/illustrations/${name}`;
  const onError = () => setBroken(true);
  return (
    <span className={cn("grid justify-items-center", className)} aria-hidden={alt ? undefined : "true"}>
      <img src={`${base}-light.svg`} alt={alt} loading="lazy" decoding="async" onError={onError} className="block w-full h-auto dark:hidden" />
      <img src={`${base}-dark.svg`} alt={alt} loading="lazy" decoding="async" onError={onError} className="hidden w-full h-auto dark:block" />
    </span>
  );
}
