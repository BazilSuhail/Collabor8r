// feat(pages/wiki/WikiEditorPage): write or edit a wiki page in Markdown with preview, AI outline drafts and conflict-safe saving.
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHead from "../../components/layout/PageHead.jsx";
import AiButton from "../../components/ai/AiButton.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import MarkdownEditor from "../../components/wiki/MarkdownEditor.jsx";
import { useProject } from "../../context/ProjectContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { createPage, getPage, listPages, listSpaces, updatePage } from "../../libs/api/wiki.js";
import { paths } from "../../routes/paths.js";
import { useMutation } from "../../utils/useMutation.js";
import { useResource } from "../../utils/useResource.js";
import { bindLift, cardRise, fadeUp, useViewEntry } from "../../utils/motion.js";

const idOf = (item) => String(item?.id ?? item?._id);
const NONE = Promise.resolve({ data: [], meta: null });

// Turns an AI outline into Markdown headings and bullets.
const outlineToMarkdown = (output) =>
  (output?.sections ?? [])
  .map((section) => [`## ${section.heading}`, ...(section.points ?? []).map((point) => `- ${point}`)].join("\n"))
  .join("\n\n");

export default function WikiEditorPage() {
  const { projectId, can } = useProject();
  const toast = useToast();
  const { pageId } = useParams();
  const editing = Boolean(pageId);
  const navigate = useNavigate();

  const page = useResource(
  () => (editing ? getPage(projectId, pageId) : NONE),
  [projectId, pageId, editing],
  );
  const spaces = useResource(() => listSpaces(projectId, { limit: 100 }), [projectId]);
  const spaceItems = Array.isArray(spaces.data) ? spaces.data : [];

  const [form, setForm] = useState({ title: "", spaceId: "", parentId: "", body: "" });
  const [serverVersion, setServerVersion] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const baselineRef = useRef(null);

  const doc = page.data;
  useEffect(() => {
  if (loaded) return;
  if (!editing) {
  baselineRef.current = { title: "", spaceId: "", parentId: "", body: "" };
  setLoaded(true);
  return;
  }
  if (!doc) return;
  const next = {
  title: doc.title ?? "",
  spaceId: String(doc.spaceId),
  parentId: doc.parentId ? String(doc.parentId) : "",
  body: typeof doc.body === "string" ? doc.body : (doc.body?.text ?? ""),
  };
  baselineRef.current = next;
  setForm(next);
  setServerVersion(doc.currentVersion);
  setLoaded(true);
  }, [editing, doc, loaded]);

  const effectiveSpaceId = form.spaceId || (spaceItems[0] ? idOf(spaceItems[0]) : "");
  const parents = useResource(
  () => (effectiveSpaceId ? listPages(projectId, { spaceId: effectiveSpaceId, limit: 100 }) : NONE),
  [projectId, effectiveSpaceId],
  );
  const parentOptions = [
  { value: "", label: "No parent (top level)" },
  ...(Array.isArray(parents.data) ? parents.data : [])
  .filter((item) => idOf(item) !== pageId)
  .map((item) => ({ value: idOf(item), label: item.title })),
  ];

  useViewEntry(
 "wiki-editor",
  ({ q, root }) => {
  fadeUp(q(".head__sub"), { y: 8 });
  cardRise(q(".card"), { y: 26, stagger: 0.07 });
  return bindLift(root);
  },
  [loaded],
  );

  const dirty = loaded && JSON.stringify(form) !== JSON.stringify(baselineRef.current);

  useEffect(() => {
  if (!dirty) return undefined;
  const warn = (event) => {
  event.preventDefault();
  event.returnValue = "";
  };
  window.addEventListener("beforeunload", warn);
  return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const refreshVersion = async () => {
  const res = await getPage(projectId, pageId);
  setServerVersion(res.data.currentVersion);
  };

  // The PATCH sends the version this draft was based on. On 409 the server version is refreshed and the draft is kept.
  const save = useMutation(
  async () => {
  const title = form.title.trim();
  const parentId = form.parentId || null;
  if (editing) {
  try {
  const res = await updatePage(projectId, pageId, {
  title,
  parentId,
  body: form.body,
  version: serverVersion,
  });
  baselineRef.current = form;
  setServerVersion(res.data.currentVersion);
  return { id: pageId };
  } catch (err) {
  if (err.status === 409) {
  toast.warning("Changed by someone else. Reloaded.");
  await refreshVersion();
  return undefined;
  }
  throw err;
  }
  }
  const res = await createPage(projectId, {
  spaceId: effectiveSpaceId,
  title,
  parentId,
  body: form.body,
  status: "published",
  });
  return { id: idOf(res.data) };
  },
  {
  success: (result) => (result ? "Page saved" : null),
  error: (err) => err.message || "Could not save the page",
  },
  );

  const set = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));

  const onSubmit = async (event) => {
  event.preventDefault();
  const result = await save.run();
  if (result) navigate(paths.wikiPage(projectId, result.id));
  };

  const leave = () => navigate(editing ? paths.wikiPage(projectId, pageId) : paths.wiki(projectId));
  const cancel = () => (dirty ? setDiscardOpen(true) : leave());

  const canEdit = can("wiki.page.edit");
  const failed = editing && page.status === "error";

  let content;
  if (!canEdit) {
  content = (
  <EmptyState
  icon="lock"
  title="You cannot edit wiki pages here"
  text="Ask a project lead for developer access."
  action={
  <Button variant="soft" onClick={() => navigate(paths.wiki(projectId))}>
  Back to wiki
  </Button>
  }
  />
  );
  } else if (failed) {
  const notFound = page.error?.status === 404;
  content = (
  <EmptyState
  tone="error"
  title={notFound ? "Page not found" : "This page did not load"}
  text={notFound ? "It may have been deleted or moved." : page.error?.message}
  onRetry={notFound ? undefined : page.reload}
  />
  );
  } else if (!loaded) {
  content = <Skeleton variant="cards" count={2} />;
  } else {
  content = (
  <form noValidate onSubmit={onSubmit} className="grid gap-[16px] ">
  <section className="card grid gap-[16px] p-[20px]">
  <h2 className="flex items-center gap-[8px] [font:600_18px_var(--display)] tracking-[-0.015em]">
  <Icon name="note" cls="text-muted" />
  Details
  </h2>
  <Input
  label="Title"
  hint="Required. The page name people see in the wiki."
  value={form.title}
  maxLength={200}
  error={save.fieldErrors.title}
  onChange={(event) => set("title")(event.target.value)}
  />
  <div className="grid grid-cols-2 gap-[var(--gap)] w1000:grid-cols-1">
  <Select
  label="Space"
  hint={editing ? "A page stays in its space." : "The space this page belongs to."}
  value={effectiveSpaceId}
  disabled={editing}
  options={spaceItems.map((space) => ({ value: idOf(space), label: space.name }))}
  onChange={set("spaceId")}
  />
  <Select
  label="Parent page"
  hint="Optional. Nests this page under another page."
  value={form.parentId}
  options={parentOptions}
  error={save.fieldErrors.parentId}
  onChange={set("parentId")}
  />
  </div>
  </section>
  <section className="card grid gap-[12px] p-[20px]">
  <div className="flex flex-wrap items-center justify-between gap-[10px]">
  <h2 className="flex items-center gap-[8px] [font:600_18px_var(--display)] tracking-[-0.015em]">
  <Icon name="wiki" cls="text-muted" />
  Content
  </h2>
  <AiButton
  kind="wikiOutline"
  projectId={projectId}
  text={form.title}
  label="Draft outline"
  onInsert={(output) =>
  setForm((current) => ({
  ...current,
  title: current.title || output?.title || current.title,
  body: [current.body.trimEnd(), outlineToMarkdown(output)].filter(Boolean).join("\n\n"),
  }))
  }
  />
  </div>
  <MarkdownEditor
  id="wiki-body"
  label="Content"
  value={form.body}
  rows={18}
  error={save.fieldErrors.body}
  hint="Markdown: headings with #, lists with -, **bold**, `code`, [links](https://)."
  onChange={set("body")}
  />
  </section>
  <div className="flex flex-wrap items-center justify-end gap-[10px]">
  {dirty ? <Badge tone="saffron" className="mr-auto">Unsaved changes</Badge> : null}
  <Button variant="ghost" onClick={cancel}>
  Cancel
  </Button>
  <Button type="submit" variant="ember" loading={save.pending}>
  Save page
  </Button>
  </div>
  </form>
  );
  }

  return (
  <>
  <PageHead
  title={editing ? "Edit page" : "New page"}
  sub="Markdown is saved as you write it. Use Preview to check the result."
  />
  {content}
  <ConfirmDialog
  open={discardOpen}
  onClose={() => setDiscardOpen(false)}
  title="Discard your changes?"
  text="Edits you have not saved are lost."
  confirmLabel="Discard"
  tone="danger"
  onConfirm={() => {
  leave();
  return true;
  }}
  />
  </>
  );
}
