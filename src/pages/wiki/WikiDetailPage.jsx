// feat(pages/wiki/WikiDetailPage): read a wiki page with its place in the tree and its version history.
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageHead from "../../components/layout/PageHead.jsx";
import Button from "../../components/ui/Button.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import MarkdownView from "../../components/wiki/MarkdownView.jsx";
import WikiHistoryDrawer from "../../components/wiki/WikiHistoryDrawer.jsx";
import WikiList from "../../components/wiki/WikiList.jsx";
import { useProject } from "../../context/ProjectContext.jsx";
import { deletePage, getPage, listPages } from "../../libs/api/wiki.js";
import { paths } from "../../routes/paths.js";
import { relativeTime } from "../../utils/format.js";
import { useMutation } from "../../utils/useMutation.js";
import { usePaged } from "../../utils/usePaged.js";
import { useResource } from "../../utils/useResource.js";
import { bindLift, cardRise, fadeUp, useViewEntry } from "../../utils/motion.js";

const NONE = Promise.resolve({ data: [], meta: null });

export default function WikiDetailPage() {
  const { projectId, can } = useProject();
  const { pageId } = useParams();
  const navigate = useNavigate();
  const page = useResource(() => getPage(projectId, pageId), [projectId, pageId]);
  const doc = page.data;
  const siblings = usePaged((params) => (params.spaceId ? listPages(projectId, params) : NONE), {
    spaceId: doc ? String(doc.spaceId) : null,
  });
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const ready = page.status === "success";

  useViewEntry(
    "wiki-detail",
    ({ q, root }) => {
      fadeUp(q(".head__sub"), { y: 8 });
      cardRise(q(".card"), { y: 26, stagger: 0.07 });
      return bindLift(root);
    },
    [ready],
  );

  const remove = useMutation(
    async () => {
      await deletePage(projectId, pageId);
      return true;
    },
    { success: "Page deleted", error: (err) => err.message || "Could not delete this page" },
  );

  const confirmDelete = async () => {
    const done = await remove.run();
    if (done) navigate(paths.wiki(projectId));
  };

  const canEdit = can("wiki.page.edit");
  const canDelete = can("wiki.page.delete");
  const bodyText = doc ? (typeof doc.body === "string" ? doc.body : (doc.body?.text ?? "")) : "";

  let article;
  if (page.status === "loading") {
    article = <Skeleton variant="cards" count={1} />;
  } else if (page.status === "error") {
    const notFound = page.error?.status === 404;
    article = (
      <EmptyState
        tone="error"
        title={notFound ? "Page not found" : "This page did not load"}
        text={notFound ? "It may have been deleted or moved." : page.error?.message}
        onRetry={notFound ? undefined : page.reload}
      />
    );
  } else {
    article = (
      <>
        <h2 className="[font:700_26px_var(--display)] tracking-[-0.02em]">{doc.title}</h2>
        {doc.summary ? <p className="mt-[6px] text-muted">{doc.summary}</p> : null}
        {bodyText.trim() ? (
          <MarkdownView text={bodyText} className="mt-[18px]" />
        ) : (
          <EmptyState icon="wiki" title="This page is empty" text={canEdit ? "Open Edit to write the first section." : undefined} />
        )}
        <p className="mt-[18px] text-[13px] text-muted tabular-nums">
          Version {doc.currentVersion}
          {doc.updatedAt ? ` · Updated ${relativeTime(doc.updatedAt)}` : ""}
          {doc.lastEditedByName ? ` by ${doc.lastEditedByName}` : ""}
        </p>
      </>
    );
  }

  return (
    <>
      <PageHead
        title={doc?.title ?? "Wiki page"}
        sub={doc?.authorName ? `Started by ${doc.authorName}` : undefined}
        actions={
          <>
            <Button variant="ghost" size="sm" icon="chevL" as={Link} to={paths.wiki(projectId)}>
              Wiki
            </Button>
            {doc ? (
              <Button variant="soft" size="sm" icon="history" onClick={() => setHistoryOpen(true)}>
                History
              </Button>
            ) : null}
            {doc && canEdit ? (
              <Button variant="soft" size="sm" icon="edit" as={Link} to={paths.wikiEdit(projectId, pageId)}>
                Edit
              </Button>
            ) : null}
            {doc && canDelete ? (
              <Button variant="ghost" size="sm" icon="trash" onClick={() => setDeleteOpen(true)}>
                Delete
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid grid-cols-[280px_minmax(0,1fr)] items-start gap-[var(--gap)] w900:grid-cols-[minmax(0,1fr)]">
        <aside aria-label="Pages in this space" className="card p-[12px] w900:hidden">
          {doc ? (
            <WikiList
              pid={projectId}
              pages={siblings.items}
              activeId={pageId}
              hasMore={siblings.hasMore}
              loadingMore={siblings.loadingMore}
              onLoadMore={siblings.loadMore}
            />
          ) : (
            <Skeleton variant="feed" count={4} />
          )}
        </aside>
        <article className="card min-w-0 p-[24px]">{article}</article>
      </div>

      {doc ? (
        <WikiHistoryDrawer
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          pid={projectId}
          pageId={pageId}
          canRestore={canEdit}
          onRestored={page.reload}
        />
      ) : null}

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete this page?"
        text="The page is removed for everyone in this project."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={confirmDelete}
      />
    </>
  );
}
