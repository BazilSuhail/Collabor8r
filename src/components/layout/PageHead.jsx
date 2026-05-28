import { Link } from "react-router-dom";
import SplitTitle from "../SplitTitle.jsx";
import Button from "../ui/Button.jsx";
import { Icon } from "../ui/Icon.jsx";

// stats: [{ key, icon?, label, value }]. back: { to, label }.
export default function PageHead({ title, sub, actions, stats, back }) {
  return (
    <header className="head">
      <div className="head__lead">
        {back && (
          <Button size="sm" variant="ghost" icon="chevL" as={Link} to={back.to} className="mb-[8px] justify-self-start">
            {back.label}
          </Button>
        )}
        <div className="head__text">
          <SplitTitle text={title} />
          {sub && <p className="head__sub">{sub}</p>}
        </div>
      </div>
      {actions && <div className="head__actions">{actions}</div>}
      {stats?.length > 0 && (
        <dl className="head__stats mt-[6px]">
          {stats.map((s) => (
            <div className="stat" data-stat={s.key} key={s.key}>
              {s.icon && (
                <span className="stat__ico">
                  <Icon name={s.icon} />
                </span>
              )}
              <div className="stat__body">
                <dd className="stat__value">
                  <b>{s.value}</b>
                </dd>
                <dt className="stat__label">{s.label}</dt>
              </div>
            </div>
          ))}
        </dl>
      )}
    </header>
  );
}
