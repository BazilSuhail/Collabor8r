import { useEffect } from "react";
import { documentTitle } from "../../metadata/pages.js";

export default function Page({ name, css, children }) {
  useEffect(() => {
    document.title = documentTitle(name);
  }, [name]);
  return (
    <>
      {css && <link rel="stylesheet" href={css} precedence="route" />}
      <section className="view relative" data-view={name} data-entered="1">
        {children}
      </section>
    </>
  );
}
