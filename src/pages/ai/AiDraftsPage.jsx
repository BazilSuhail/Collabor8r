// feat(pages/ai/AiDraftsPage): show the user's AI drafts and daily usage, and let them accept or discard each draft.
import { useState } from "react";
import PageHead from "../../components/layout/PageHead.jsx";
import Badge from "../../components/ui/Badge.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import DraftPreview from "../../components/ai/DraftPreview.jsx";
import UsageMeter from "../../components/ai/UsageMeter.jsx";
import { listDrafts, usage } from "../../libs/api/ai.js";
import { emptyCopy } from "../../metadata/empty.js";
import { relativeTime } from "../../utils/format.js";
import { usePaged } from "../../utils/usePaged.js";
import { useResource } from "../../utils/useResource.js";
import { bindLift, cardRise, fadeUp, useViewEntry } from "../../utils/motion.js";

const idOf = (item) => String(item?.id ?? item?._id);

const KIND_LABEL = { issues: "Issue", summary: "Summary", wikiPage: "Wiki outline" };

const STATUS = {
  ready: { label: "Ready", tone: "spruce" },
  pending: { label: "Drafting", tone: "saffron" },
  failed: { label: "Failed", tone: "ember" },
  accepted: { label: "Accepted", tone: "plain" },
  discarded: { label: "Discarded", tone: "plain" },
};

export default function AiDraftsPage() {
  const drafts = usePaged((params) => listDrafts(params), {});
  const usageRes = useResource(() => usage(), []);
  const [active, setActive] = useState(null);

  const unavailable = [drafts.error, usageRes.error].some((err) => err?.status === 503);
  const rows = drafts.items.map((draft) => ({ ...draft, id: idOf(draft) }));
  const ready = drafts.status === "success";

  useViewEntry(
    "ai",
    ({ q, root }) => {
      fadeUp(q(".head__sub"), { y: 8 });
      cardRise(q(".card"), { y: 26, stagger: 0.07 });
      return bindLift(root);
    },
    [ready],
  );

  const columns = [
    { key: "kind", label: "Kind", render: (row) => KIND_LABEL[row.kind] ?? row.kind },
    {
      key: "project",
      label: "Project",
      render: (row) => (row.projectId ? `Project ${String(row.projectId).slice(-6)}` : "Personal"),
    },
    {
      key: "created",
      label: "Created",
      render: (row) => (row.createdAt ? relativeTime(row.createdAt) : "Unknown"),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        const info = STATUS[row.status] ?? { label: row.status, tone: "plain" };
        return (
          <Badge variant="status" tone={info.tone}>
            {info.label}
          </Badge>
        );
      },
    },
  ];

  let usageCard;
  if (usageRes.status === "loading") {
    usageCard = <Skeleton variant="cards" count={1} />;
  } else if (usageRes.status === "error") {
    usageCard = <EmptyState tone="error" title="Usage did not load" text={usageRes.error?.message} onRetry={usageRes.reload} />;
  } else {
    usageCard = <UsageMeter usage={usageRes.data} />;
  }

  return (
    <>
      <PageHead
        title="AI drafts"
        sub="Drafts you asked for, with today's usage. Accept a draft to use it, or discard it."
      />
      {unavailable ? (
        <section className="card p-[16px]">
          <EmptyState
            icon="sparkle"
            title="AI is not configured on this server"
            text="An administrator needs to turn on AI before drafts can be made."
          />
        </section>
      ) : (
        <>
          <section className="card mb-[var(--gap)] p-[20px]">{usageCard}</section>
          <section className="card">
            <DataTable
              label="AI drafts"
              columns={columns}
              rows={rows}
              rowKey="id"
              status={drafts.status}
              error={drafts.error}
              onRetry={drafts.reload}
              empty={{ ...emptyCopy("ai"), action: null }}
              onRowClick={(row) => setActive(row)}
              hasMore={drafts.hasMore}
              onLoadMore={drafts.loadMore}
              loadingMore={drafts.loadingMore}
            />
          </section>
        </>
      )}
      <DraftPreview
        open={Boolean(active)}
        onClose={() => setActive(null)}
        draft={active}
        onAccepted={() => {
          setActive(null);
          drafts.reload();
        }}
        onDiscarded={() => {
          setActive(null);
          drafts.reload();
        }}
      />
    </>
  );
}
