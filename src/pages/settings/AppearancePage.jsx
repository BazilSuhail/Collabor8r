// feat(pages/settings/AppearancePage): switch theme and density, remembered on this device.
import { useTheme, useDensity } from "../../utils/store.js";
import { useViewEntry, fadeUp } from "../../utils/motion.js";
import { THEME_OPTIONS, DENSITY_OPTIONS } from "../../metadata/settings.js";
import PageHead from "../../components/layout/PageHead.jsx";
import SegmentedControl from "../../components/ui/SegmentedControl.jsx";
import { Icon } from "../../components/ui/Icon.jsx";

export default function AppearancePage() {
  const { pref, setPref } = useTheme();
  const { density, setDensity } = useDensity();

  useViewEntry(
    "appearance",
    ({ q }) => {
      fadeUp(q(".card"), { y: 20, stagger: 0.07 });
    },
    [],
  );

  return (
    <>
      <PageHead title="Appearance" sub="Theme and density. These choices stay on this device." />

      <div className="grid gap-[var(--gap)]">
        <section className="card p-[24px] grid gap-[16px]">
          <div>
            <h2 className="[font:600_17px_var(--display)] tracking-[-0.01em] text-text">Theme</h2>
            <p className="text-muted text-[13.5px]">Light, dark, or follow your system setting.</p>
          </div>
          <div role="group" aria-label="Theme" className="grid grid-cols-[repeat(3,minmax(0,1fr))] gap-[12px] w560:grid-cols-[minmax(0,1fr)]">
            {THEME_OPTIONS.map((opt) => {
              const on = pref === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setPref(opt.id)}
                  className={`flex flex-col items-start gap-[12px] rounded-card border p-[16px] text-left transition-colors ${
                    on ? "border-ember bg-[color:var(--ember-soft)]" : "border-line-2 bg-surface hover:bg-surface-2"
                  }`}
                >
                  <span className="grid place-items-center size-[40px] rounded-[12px] bg-well text-text">
                    <Icon name={opt.icon} />
                  </span>
                  <span className="font-bold text-text">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="card p-[24px] grid gap-[16px]">
          <div>
            <h2 className="[font:600_17px_var(--display)] tracking-[-0.01em] text-text">Density</h2>
            <p className="text-muted text-[13.5px]">Compact fits more rows on screen. Comfortable is the default.</p>
          </div>
          <div>
            <SegmentedControl
              label="Density"
              value={density}
              onChange={setDensity}
              options={DENSITY_OPTIONS.map((d) => ({ value: d.id, label: d.label }))}
            />
          </div>
        </section>
      </div>
    </>
  );
}
