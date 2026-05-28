import { useEffect, useRef } from "react";
import { BOTTOM_NAV } from "../../metadata/nav.js";
import { paths } from "../../routes/paths.js";
import { gsap, prefersReduced } from "../../utils/motion.js";
import { Icon } from "../ui/Icon.jsx";

const ITEM_CLASS =
  "tabbar__item z-[1] min-h-[52px] [color:inherit] rounded-[16px] content-center justify-items-center gap-[3px] text-[11px] font-bold [display:grid] relative [&_.ico]:w-[21px] [&_.ico]:h-[21px] aria-[current=page]:text-side-text aria-[current=page]:[&_.ico]:text-[#ff8a62] focus-visible:outline-side-text focus-visible:outline-offset-[-2px]";

// Bottom tab bar for small screens. Project tabs without a project point at the project list.
export default function BottomNav({ pathname, pid, badges = {}, drawerOpen, onMore }) {
  const barRef = useRef(null);
  const indRef = useRef(null);

  const tabs = BOTTOM_NAV.map((t) => {
    const needsProject = Boolean(t.project);
    const href = t.to ? (needsProject && !pid ? paths.projects() : t.to(pid)) : null;
    return { ...t, href, matchable: Boolean(href) && !(needsProject && !pid) };
  });

  let activeIdx = tabs.length - 1;
  let best = -1;
  tabs.forEach((t, i) => {
    if (!t.matchable || !t.href) return;
    const hit = pathname === t.href || pathname.startsWith(`${t.href}/`);
    if (hit && t.href.length > best) {
      best = t.href.length;
      activeIdx = i;
    }
  });

  useEffect(() => {
    const bar = barRef.current;
    const ind = indRef.current;
    if (!bar || !ind) return;
    const reduced = prefersReduced();
    if (reduced || !bar.offsetWidth) {
      gsap.set(ind, { xPercent: activeIdx * 100 });
    } else {
      gsap.to(ind, { xPercent: activeIdx * 100, duration: 0.5, ease: "back.out(1.4)", overwrite: true });
    }
    const ico = bar.querySelector(".tabbar__item[aria-current] .ico");
    if (ico && !reduced && bar.offsetWidth) {
      gsap.fromTo(
        ico,
        { y: 3, scale: 0.85 },
        { y: 0, scale: 1, duration: 0.5, ease: "back.out(3)", overwrite: true, clearProps: "transform" },
      );
    }
  }, [activeIdx]);

  return (
    <nav className="tabbar hidden w760:[display:grid] w760:z-40 w760:left-[10px] w760:right-[10px] w760:bottom-[calc(10px_+_env(safe-area-inset-bottom))] w760:bg-[color-mix(in_srgb,var(--side-bg)_94%,transparent)] w760:text-side-muted w760:[-webkit-backdrop-filter:blur(16px)_saturate(1.3)] w760:[backdrop-filter:blur(16px)_saturate(1.3)] w760:rounded-[22px] w760:grid-cols-[repeat(5,minmax(0,1fr))] w760:p-[6px] w760:fixed w760:shadow-[0_18px_40px_-16px_#140e0a8c,inset_0_1px_#ffffff0f] w760:[[data-theme=dark]_&]:shadow-[0_18px_40px_-16px_#000c,inset_0_0_0_1px_var(--side-line)]" aria-label="Primary" ref={barRef}>
      <span className="pointer-events-none w-[calc(20%_-_2.4px)] absolute top-[6px] bottom-[6px] left-[6px] w760:before:content-[''] w760:before:absolute w760:before:[inset:0_4px] w760:before:rounded-[16px] w760:before:[background-color:var(--side-pill)] w760:before:[box-shadow:inset_0_1px_#ffffff0f] w760:after:content-[''] w760:after:absolute w760:after:bottom-[3px] w760:after:left-0 w760:after:right-0 w760:after:[margin:0_auto] w760:after:h-[3px] w760:after:w-[18px] w760:after:rounded-[3px] w760:after:bg-ember w760:after:[box-shadow:0_0_10px_1px_#e4572e99]" aria-hidden="true" ref={indRef} />
      {tabs.map((t, i) => {
        const current = i === activeIdx;
        if (t.id === "more") {
          return (
            <button
              key={t.id}
              type="button"
              className={ITEM_CLASS}
              data-tab="more"
              aria-controls="side"
              aria-expanded={drawerOpen}
              aria-current={current ? "page" : undefined}
              onClick={onMore}
            >
              <Icon name={t.icon} />
              <span>More</span>
            </button>
          );
        }
        const badge = badges[t.id];
        return (
          <a
            key={t.id}
            className={ITEM_CLASS}
            href={t.href}
            data-tab={t.id}
            aria-current={current ? "page" : undefined}
          >
            <Icon name={t.icon} />
            <span>{t.label}</span>
            {badge ? (
              <i className="tabbar__badge bg-ember text-[color:var(--on-ember)] min-w-[17px] h-[17px] [font:700_10.5px/17px_var(--font)] text-center shadow-[0_0_0_2px_var(--side-bg)] rounded-[999px] px-[5px] not-italic absolute top-[5px] left-[calc(50%_+_6px)]" data-tabbadge={t.id}>
                {badge}
              </i>
            ) : null}
          </a>
        );
      })}
    </nav>
  );
}
