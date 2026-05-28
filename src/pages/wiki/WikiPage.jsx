// feat(pages/wiki/WikiPage): browse a project's wiki spaces and page tree and start new pages.
import { useState } from "react";
import { Link } from "react-router-dom";
import PageHead from "../../components/layout/PageHead.jsx";
import Button from "../../components/ui/Button.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Illustration from "../../components/ui/Illustration.jsx";
import Input from "../../components/ui/Input.jsx";
import SegmentedControl from "../../components/ui/SegmentedControl.jsx";
import Select from "../../components/ui/Select.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import SpaceFormModal from "../../components/wiki/SpaceFormModal.jsx";
import WikiList from "../../components/wiki/WikiList.jsx";
import { useProject } from "../../context/ProjectContext.jsx";
import { deleteSpace, listPages, listSpaces } from "../../libs/api/wiki.js";
import { emptyCopy } from "../../metadata/empty.js";
import { paths } from "../../routes/paths.js";
import { useMutation } from "../../utils/useMutation.js";
import { usePaged } from "../../utils/usePaged.js";
import { useResource } from "../../utils/useResource.js";
import { bindLift, cardRise, fadeUp, useViewEntry } from "../../utils/motion.js";

const idOf = (item) => String(item?.id ?? item?._id);
const NONE = Promise.resolve({ data: [], meta: null });

export default function WikiPage() {
  const { projectId, can } = useProject();
  const spaces = useResource(() => listSpaces(projectId, { limit: 100 }), [projectId]);
  const spaceItems = Array.isArray(spaces.data) ? spaces.data : [];
  const [chosen, setChosen] = useState(null);
  const activeSpaceId = chosen ?? (spaceItems[0] ? idOf(spaceItems[0]) : null);
  const pages = usePaged((params) => (params.spaceId ? listPages(projectId, params) : NONE), {
    spaceId: activeSpaceId,
  });
  const [query, setQuery] = useState("");
  const [spaceFormOpen, setSpaceFormOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const canManageSpaces = can("wiki.space.manage");
  const canEdit = can("wiki.page.edit");
  const ready = spaces.status === "success" && pages.status === "success";
  const activeSpace = spaceItems.find((space) => idOf(space) === activeSpaceId) ?? null;

  useViewEntry(
    "wiki",
    ({ q, root }) => {
      fadeUp(q(".head__sub"), { y: 8 });
      cardRise(q(".card"), { y: 26, stagger: 0.07 });
      return bindLift(root);
    },
    [ready],
  );

  const removeSpace = useMutation(
    async () => {
      await deleteSpace(projectId, activeSpaceId);
      return true;
    },
    { success: "Space deleted", error: (err) => err.message || "Could not delete this space" },
  );

  const confirmDeleteSpace = async () => {
    const done = await removeSpace.run();
    if (done) {
      setDeleteOpen(false);
      setChosen(null);
      spaces.reload();
    }
  };

  const openNewSpace = () => {
    setEditingSpace(null);
    setSpaceFormOpen(true);
  };

  const spaceOptions = spaceItems.map((space) => ({ value: idOf(space), label: space.name }));

  let body;
  if (spaces.status === "error" || pages.status === "error") {
    body = (
      <EmptyState
        tone="error"
        title="Wiki pages did not load"
        text={(spaces.error ?? pages.error)?.message}
        onRetry={() => {
          spaces.reload();
          pages.reload();
        }}
      />
    );
  } else if (spaces.status === "loading" || (activeSpaceId && pages.status === "loading" && !pages.items.length)) {
    body = <Skeleton variant="feed" count={5} />;
  } else if (!spaceItems.length) {
    body = (
      <div className="grid justify-items-center gap-[8px]">
        <Illustration name="wiki" alt="" className="w-[180px] w1000:hidden" />
        <EmptyState
          icon="wiki"
          title="No wiki spaces yet"
          text="Create a space to group the pages of this project."
          action={canManageSpaces ? <Button variant="soft" icon="space" onClick={openNewSpace}>New space</Button> : null}
        />
      </div>
    );
  } else if (!pages.items.length && !query.trim()) {
    body = (
      <EmptyState
        {...emptyCopy("wiki")}
        action={
          canEdit ? (
            <Button variant="ember" icon="plus" as={Link} to={paths.wikiNew(projectId)}>
              New page
            </Button>
          ) : null
        }
      />
    );
  } else {
    body = (
      <WikiList
        pid={projectId}
        pages={pages.items}
        query={query}
        hasMore={pages.hasMore}
        loadingMore={pages.loadingMore}
        onLoadMore={pages.loadMore}
      />
    );
  }

  return (
    <>
      <PageHead
        title="Wiki"
        sub="Project pages, grouped by space."
        actions={
          <>
            {canManageSpaces ? (
              <Button variant="soft" icon="space" onClick={openNewSpace}>
                New space
              </Button>
            ) : null}
            {canEdit ? (
              <Button variant="ember" icon="plus" as={Link} to={paths.wikiNew(projectId)}>
                New page
              </Button>
            ) : null}
          </>
        }
      />

      <div className="toolbar">
        <Input
          variant="search"
          label="Search pages"
          hideLabel
          placeholder="Search pages"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <span className="toolbar__spacer" />
        {spaceItems.length > 4 ? (
          <Select
            label="Space"
            value={activeSpaceId ?? ""}
            options={spaceOptions}
            onChange={setChosen}
          />
        ) : spaceItems.length ? (
          <SegmentedControl
            label="Space"
            size="sm"
            value={activeSpaceId ?? ""}
            options={spaceOptions}
            onChange={setChosen}
          />
        ) : null}
        {canManageSpaces && activeSpace ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              icon="edit"
              onClick={() => {
                setEditingSpace(activeSpace);
                setSpaceFormOpen(true);
              }}
            >
              Edit space
            </Button>
            <Button variant="ghost" size="sm" icon="trash" onClick={() => setDeleteOpen(true)}>
              Delete space
            </Button>
          </>
        ) : null}
      </div>

      <section className="card p-[16px]">{body}</section>

      <SpaceFormModal
        open={spaceFormOpen}
        onClose={() => setSpaceFormOpen(false)}
        pid={projectId}
        space={editingSpace}
        onSaved={(saved) => {
          setSpaceFormOpen(false);
          spaces.reload();
          if (!editingSpace && saved) setChosen(idOf(saved));
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete this space?"
        text="The space and every page in it are removed for everyone in this project."
        confirmLabel="Delete space"
        tone="danger"
        onConfirm={confirmDeleteSpace}
      />
    </>
  );
}
