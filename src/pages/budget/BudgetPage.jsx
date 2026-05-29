// feat(pages/budget/BudgetPage): plan budget lines, record actual spend and compare planned against actual.
import { useEffect, useRef, useState } from "react";
import PageHead from "../../components/layout/PageHead.jsx";
import Button from "../../components/ui/Button.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import SideModal from "../../components/ui/SideModal.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import { useProject } from "../../context/ProjectContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { budgetSummary, deleteBudgetLine, listActuals } from "../../libs/api/planning.js";
import { EMPTY } from "../../metadata/empty.js";
import { formatDate, formatMoney } from "../../utils/format.js";
import { bindLift, cardRise, countUp, fadeUp, useViewEntry } from "../../utils/motion.js";
import { useResource } from "../../utils/useResource.js";
import { usePaged } from "../../utils/usePaged.js";
import ActualModal from "./components/ActualModal.jsx";
import BudgetLineModal from "./components/BudgetLineModal.jsx";

const withIds = (res) => ({ ...res, data: res.data.map((r) => ({ ...r, id: r.id ?? r._id })) });
// The server filters by budgetLineId; the client check keeps the drawer right against a server that still ignores it.
const fetchActuals = ({ pid, budgetLineId, ...p }) =>
  listActuals(pid, { budgetLineId, ...p })
    .then(withIds)
    .then((res) =>
      budgetLineId ? { ...res, data: res.data.filter((r) => String(r.budgetLineId?._id ?? r.budgetLineId) === String(budgetLineId)) } : res,
    );

// Share of planned spent so far: spruce under 85 percent, saffron to 100, ember over budget.
const meterTone = (pct) => (pct > 100 ? "" : pct >= 85 ? "meter__fill--saffron" : "meter__fill--spruce");

function ActualsBody({ projectId, lineId, currency }) {
  const actuals = usePaged(fetchActuals, { pid: projectId, budgetLineId: lineId });

  if (actuals.status === "loading") return <Skeleton variant="feed" count={4} />;

  if (actuals.status === "error") {
    return <EmptyState tone="error" title="Actuals did not load" text="Try again in a moment." onRetry={actuals.reload} />;
  }

  if (!actuals.items.length) {
    return <EmptyState icon="dollar" title="No actuals yet" text="Record spend against this line to see it here." />;
  }

  return (
    <div className="grid gap-[12px]">
      <ul className="grid gap-[8px] list-none p-0 m-0">
        {actuals.items.map((a) => (
          <li
            key={a.id}
            className="flex items-center gap-[12px] rounded-[14px] border border-line bg-surface p-[12px]"
          >
            <span className="grid gap-[2px] min-w-0 flex-1">
              <span className="font-semibold text-text truncate">{a.vendor || a.description || "Spend"}</span>
              <span className="text-muted text-[12.5px]">{formatDate(a.incurredOn)}</span>
            </span>
            <span className="font-semibold text-text tnum">{formatMoney(a.amount, a.currency ?? currency)}</span>
          </li>
        ))}
      </ul>
      {actuals.hasMore ? (
        <Button variant="soft" size="sm" onClick={actuals.loadMore} loading={actuals.loadingMore} disabled={actuals.loadingMore}>
          Show more
        </Button>
      ) : null}
    </div>
  );
}

export default function BudgetPage() {
  const { projectId, can } = useProject();
  const toast = useToast();
  const canEdit = can("budget.edit");
  const canDelete = can("budget.delete");
  const summary = useResource(() => budgetSummary(projectId), [projectId]);
  const [lineModal, setLineModal] = useState({ open: false, target: null });
  const [actualOpen, setActualOpen] = useState(false);
  const [actualLine, setActualLine] = useState("");
  const [drawer, setDrawer] = useState({ open: false, line: null });
  const [deleting, setDeleting] = useState(null);
  const plannedRef = useRef(null);
  const actualRef = useRef(null);
  const varianceRef = useRef(null);
  const ready = summary.status === "success";

  const lines = summary.data?.lines ?? [];
  const totals = summary.data?.totals ?? { planned: 0, actual: 0, variance: 0 };
  const currency = lines[0]?.currency ?? "USD";
  const money = (v) => formatMoney(v, currency);

  useViewEntry(
    "budget",
    ({ q, root }) => {
      fadeUp(q(".head__sub"), { y: 8 });
      cardRise(q(".kpi"), { y: 26 });
      return bindLift(root);
    },
    [ready],
  );

  useEffect(() => {
    if (!ready) return;
    countUp(plannedRef.current, totals.planned, money);
    countUp(actualRef.current, totals.actual, money);
    countUp(varianceRef.current, totals.variance, money);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, totals.planned, totals.actual, totals.variance, currency]);

  const confirmDelete = async () => {
    try {
      await deleteBudgetLine(projectId, deleting.lineId);
      toast.success("Line deleted");
      setDeleting(null);
      summary.reload();
    } catch {
      // The API layer shows the failure. The dialog stays open so the user can retry.
    }
  };

  const columns = [
    {
      key: "name",
      label: "Line",
      render: (row) => (
        <span className="grid gap-[2px] min-w-0">
          <span className="font-semibold text-text truncate">{row.name}</span>
          {row.category ? <span className="text-muted text-[12.5px]">{row.category}</span> : null}
        </span>
      ),
    },
    { key: "planned", label: "Planned", align: "right", render: (row) => formatMoney(row.planned, row.currency) },
    { key: "actual", label: "Actual", align: "right", render: (row) => formatMoney(row.actual, row.currency) },
    {
      key: "variance",
      label: "Variance",
      render: (row) => {
        const over = row.actual > row.planned;
        const pct = row.planned ? (row.actual / row.planned) * 100 : row.actual > 0 ? 101 : 0;
        return (
          <span className="grid gap-[6px] min-w-[150px]">
            <span className="meter">
              <span className={`meter__fill ${meterTone(pct)}`} style={{ width: `${Math.min(pct, 100)}%` }} />
            </span>
            <span className={`text-[12.5px] tnum ${over ? "text-bad" : "text-muted"}`}>
              {over ? "Over by " : ""}
              {formatMoney(Math.abs(row.variance), row.currency)}
            </span>
          </span>
        );
      },
    },
  ];

  const rowMenu = canEdit
    ? (row) => [
        { id: "actual", label: "Record actual", icon: "dollar", onSelect: () => { setActualLine(row.lineId); setActualOpen(true); } },
        { id: "edit", label: "Edit line", icon: "edit", onSelect: () => setLineModal({ open: true, target: row }) },
        ...(canDelete ? ["separator", { id: "delete", label: "Delete line", icon: "trash", danger: true, onSelect: () => setDeleting(row) }] : []),
      ]
    : undefined;

  const kpis = [
    { key: "planned", tone: "iris", icon: "budget", label: "Planned", ref: plannedRef, foot: `${lines.length} lines` },
    { key: "actual", tone: "ember", icon: "coins", label: "Actual", ref: actualRef, foot: "Recorded spend" },
    {
      key: "variance",
      tone: totals.variance < 0 ? "ember" : "spruce",
      icon: totals.variance < 0 ? "trendDown" : "trend",
      label: totals.variance < 0 ? "Over budget" : "Remaining",
      ref: varianceRef,
      foot: totals.variance < 0 ? "Spend is above plan" : "Within plan",
    },
  ];

  return (
    <>
      <PageHead
        title="Budget"
        sub="Planned cost per line, what has been spent, and where the gap is."
        actions={
          canEdit ? (
            <>
              <Button variant="soft" icon="plus" onClick={() => setLineModal({ open: true, target: null })}>
                Add line
              </Button>
              <Button
                variant="ember"
                icon="plus"
                onClick={() => {
                  setActualLine("");
                  setActualOpen(true);
                }}
              >
                Record actual
              </Button>
            </>
          ) : null
        }
      />
      {summary.status === "error" ? (
        <section className="card p-[22px] mb-[var(--gap)]">
          <EmptyState tone="error" title="The budget did not load" text="Try again in a moment." onRetry={summary.reload} />
        </section>
      ) : (
        <div className="grid gap-[var(--gap)] grid-cols-[repeat(3,minmax(0,1fr))] w1100:grid-cols-[minmax(0,1fr)] mb-[var(--gap)]">
          {summary.status === "success"
            ? kpis.map((k) => (
                <section key={k.key} className={`card kpi kpi--${k.tone}`}>
                  <div className="kpi__body">
                    <div className="kpi__top">
                      <span className="kpi__ico">
                        <Icon name={k.icon} />
                      </span>
                      <span className="kpi__label">{k.label}</span>
                    </div>
                    <span ref={k.ref} className="kpi__value tnum" />
                  </div>
                  <div className="kpi__foot">{k.foot}</div>
                </section>
              ))
            : [0, 1, 2].map((i) => (
                <section key={i} className="card p-[18px]" aria-busy="true">
                  <span className="sr">Loading</span>
                  <span className="block h-[12px] w-[40%] rounded-[12px] bg-well animate-pulse motion-reduce:animate-none" />
                  <span className="mt-[12px] block h-[26px] w-[60%] rounded-[12px] bg-well animate-pulse motion-reduce:animate-none" />
                </section>
              ))}
        </div>
      )}
      {summary.status !== "error" ? (
        <DataTable
          label="Budget lines"
          rowKey="lineId"
          columns={columns}
          rows={lines}
          status={summary.status}
          error={summary.error}
          onRetry={summary.reload}
          empty={{
            ...EMPTY.budget,
            action: canEdit ? (
              <Button variant="ember" size="sm" icon="plus" onClick={() => setLineModal({ open: true, target: null })}>
                Add line
              </Button>
            ) : null,
          }}
          onRowClick={(row) => setDrawer({ open: true, line: row })}
          rowMenu={rowMenu}
        />
      ) : null}
      <SideModal
        open={drawer.open}
        onClose={() => setDrawer((d) => ({ ...d, open: false }))}
        title={drawer.line?.name ?? "Actuals"}
        subtitle="Spend recorded against this line"
      >
        {drawer.open && drawer.line ? (
          <ActualsBody projectId={projectId} lineId={drawer.line.lineId} currency={drawer.line.currency} />
        ) : null}
      </SideModal>
      <BudgetLineModal
        open={lineModal.open}
        onClose={() => setLineModal({ open: false, target: null })}
        projectId={projectId}
        line={lineModal.target}
        onSaved={() => {
          setLineModal({ open: false, target: null });
          summary.reload();
        }}
      />
      <ActualModal
        open={actualOpen}
        onClose={() => setActualOpen(false)}
        projectId={projectId}
        lines={lines}
        defaultLineId={actualLine}
        onSaved={() => {
          setActualOpen(false);
          summary.reload();
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete budget line?"
        text={`"${deleting?.name ?? ""}" is removed with its planned amount. This cannot be undone.`}
        confirmLabel="Delete"
        tone="danger"
        onConfirm={confirmDelete}
      />
    </>
  );
}
