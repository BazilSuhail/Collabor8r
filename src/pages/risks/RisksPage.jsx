// feat(pages/risks/RisksPage): keep a project risk register with a probability by impact matrix.
import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import PageHead from "../../components/layout/PageHead.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import { useProject } from "../../context/ProjectContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { deleteRisk, listRisks } from "../../libs/api/planning.js";
import { EMPTY } from "../../metadata/empty.js";
import { bindLift, cardRise, fadeUp, flip, useViewEntry } from "../../utils/motion.js";
import { usePaged } from "../../utils/usePaged.js";
import RiskFormModal from "./components/RiskFormModal.jsx";
import RiskMatrix, { riskTone } from "./components/RiskMatrix.jsx";

const withIds = (res) => ({ ...res, data: res.data.map((r) => ({ ...r, id: r.id ?? r._id })) });
const fetchRisks = ({ pid, ...p }) => listRisks(pid, p).then(withIds);

const SCORE_BADGE = { ok: "spruce", warn: "saffron", bad: "ember" };
const STATUS_LABEL = { open: "Open", mitigating: "Mitigating", accepted: "Accepted", closed: "Closed" };
const STATUS_TONE = { open: "ember", mitigating: "saffron", accepted: "iris", closed: "spruce" };

export default function RisksPage() {
  const { projectId, can, members } = useProject();
  const toast = useToast();
  const canEdit = can("risk.edit");
  const risks = usePaged(fetchRisks, { pid: projectId });
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ open: false, target: null });
  const [deleting, setDeleting] = useState(null);
  const tableRef = useRef(null);
  const ready = risks.status === "success";

  useViewEntry(
    "risks",
    ({ q, root }) => {
      fadeUp(q(".head__sub"), { y: 8 });
      cardRise(q(".card"), { y: 26 });
      return bindLift(root);
    },
    [ready],
  );

  const visible = selected
    ? risks.items.filter((r) => r.probability === selected.p && r.impact === selected.i)
    : risks.items;

  const pickCell = (cell) => {
    flip(tableRef.current, () => flushSync(() => setSelected(cell)));
  };

  const confirmDelete = async () => {
    try {
      await deleteRisk(projectId, deleting.id);
      toast.success("Risk deleted");
      setDeleting(null);
      risks.reload();
    } catch {
      // The API layer shows the failure. The dialog stays open so the user can retry.
    }
  };

  const columns = [
    {
      key: "title",
      label: "Risk",
      render: (row) => (
        <span className="grid gap-[2px] min-w-0">
          <span className="font-semibold text-text truncate">{row.title}</span>
          {row.category ? <span className="text-muted text-[12.5px]">{row.category}</span> : null}
        </span>
      ),
    },
    { key: "probability", label: "Probability", align: "center", render: (row) => row.probability },
    { key: "impact", label: "Impact", align: "center", render: (row) => row.impact },
    {
      key: "score",
      label: "Score",
      align: "center",
      render: (row) => {
        const score = (row.probability ?? 0) * (row.impact ?? 0);
        return (
          <Badge variant="count" tone={SCORE_BADGE[riskTone(score)]} label={`Score ${score}`}>
            {score}
          </Badge>
        );
      },
    },
    {
      key: "owner",
      label: "Owner",
      render: (row) =>
        row.ownerName ? (
          <span className="flex items-center gap-[8px] min-w-0">
            <Avatar name={row.ownerName} size="xs" id={row.ownerId} />
            <span className="truncate">{row.ownerName}</span>
          </span>
        ) : (
          <span className="text-faint">No owner</span>
        ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Badge variant="status" tone={STATUS_TONE[row.status] ?? "plain"}>
          {STATUS_LABEL[row.status] ?? "Open"}
        </Badge>
      ),
    },
  ];

  const rowMenu = canEdit
    ? (row) => [
        { id: "edit", label: "Edit", icon: "edit", onSelect: () => setForm({ open: true, target: row }) },
        "separator",
        { id: "delete", label: "Delete", icon: "trash", danger: true, onSelect: () => setDeleting(row) },
      ]
    : undefined;

  return (
    <>
      <PageHead
        title="Risks"
        sub="Every risk the project carries, placed by how likely it is and how hard it would hit."
        actions={
          canEdit ? (
            <Button variant="ember" icon="plus" onClick={() => setForm({ open: true, target: null })}>
              New risk
            </Button>
          ) : null
        }
      />
      <section className="card p-[18px] grid gap-[14px] mb-[var(--gap)]" aria-label="Risk matrix">
        <div className="flex items-center gap-[10px] flex-wrap">
          <h2 className="[font:600_17px_var(--display)] tracking-[-0.015em] text-text">Probability by impact</h2>
          <span className="text-muted text-[13px]">
            {selected ? `Showing probability ${selected.p}, impact ${selected.i}.` : "Select a cell to filter the register."}
          </span>
          {selected ? (
            <Button variant="ghost" size="sm" icon="close" className="ml-auto" onClick={() => pickCell(null)}>
              Clear filter
            </Button>
          ) : null}
        </div>
        <RiskMatrix risks={risks.items} selected={selected} onSelect={pickCell} />
      </section>
      <div ref={tableRef}>
        <DataTable
          label="Risk register"
          columns={columns}
          rows={visible}
          status={risks.status}
          error={risks.error}
          onRetry={risks.reload}
          empty={{
            ...EMPTY.risks,
            action: canEdit ? (
              <Button variant="ember" size="sm" icon="plus" onClick={() => setForm({ open: true, target: null })}>
                New risk
              </Button>
            ) : null,
          }}
          rowMenu={rowMenu}
          hasMore={risks.hasMore}
          onLoadMore={risks.loadMore}
          loadingMore={risks.loadingMore}
        />
      </div>
      <RiskFormModal
        open={form.open}
        onClose={() => setForm({ open: false, target: null })}
        projectId={projectId}
        risk={form.target}
        members={members}
        onSaved={() => {
          setForm({ open: false, target: null });
          risks.reload();
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete risk?"
        text={`"${deleting?.title ?? ""}" is removed from the register. This cannot be undone.`}
        confirmLabel="Delete"
        tone="danger"
        onConfirm={confirmDelete}
      />
    </>
  );
}
