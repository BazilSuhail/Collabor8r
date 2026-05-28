import { Outlet } from "react-router-dom";
import { BrandMark } from "../ui/Icon.jsx";
import { BRAND } from "../../metadata/brand.js";
import shellCss from "../../styles/shell.css?url";

export default function AuthLayout() {
  return (
    <>
      <link rel="stylesheet" href={shellCss} precedence="shell" />
      <div className="glow pointer-events-none fixed inset-0 z-[-1] overflow-hidden" aria-hidden="true">
        <i className="glow__a absolute rounded-[50%] will-change-transform motion-reduce:will-change-auto w-[60vmax] h-[60vmax] top-[-26vmax] right-[-20vmax] bg-[radial-gradient(closest-side,var(--glow-a),transparent)]" />
        <i className="glow__b absolute rounded-[50%] will-change-transform motion-reduce:will-change-auto w-[54vmax] h-[54vmax] bottom-[-30vmax] left-[10vmax] bg-[radial-gradient(closest-side,var(--glow-b),transparent)]" />
      </div>
      <div className="min-h-[100dvh] px-[var(--gutter)] pb-[56px]">
        <main id="main" className="card w-[min(440px,100%_-_32px)] mx-auto mt-[12vh] p-[28px]">
          <div className="brand inline-flex items-center gap-[11px] mb-[22px]">
            <span className="brand__mark overflow-hidden [display:grid] place-items-center flex-none w-[38px] h-[38px] rounded-[12px] bg-ember text-[color:var(--on-ember)] shadow-[var(--shadow)] [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:[stroke-width:1.9px] [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-linejoin:round] [&_svg]:w-[22px] [&_svg]:h-[22px]" aria-hidden="true">
              <BrandMark className="w-full h-full object-cover" />
            </span>
            <span className="brand__name [font:700_19px/1_var(--display)] tracking-[-0.02em] whitespace-nowrap">{BRAND.name}</span>
          </div>
          <Outlet />
        </main>
      </div>
    </>
  );
}
