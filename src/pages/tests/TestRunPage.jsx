// feat(pages/tests/TestRunPage): execute a test run case by case, record pass, fail or blocked, and complete it.
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageHead from "../../components/layout/PageHead.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Input from "../../components/ui/Input.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import { useProject } from "../../context/ProjectContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { completeTestRun, getTestRun, listResults, listTestCases, upsertResult } from "../../libs/api/tests.js";
import { paths } from "../../routes/paths.js";
import { bindLift, fadeUp, press, useViewEntry } from "../../utils/motion.js";
import { useResource } from "../../utils/useResource.js";
import { usePaged } from "../../utils/usePaged.js";

const withIds = (res) => ({ ...res, data: res.data.map((r) => ({ ...r, id: r.id ?? r._id })) });
const fetchCases = ({ pid, ...p }) => listTestCases(pid, p).then(withIds);
const fetchResults = ({ pid, runId, ...p }) => listResults(pid, runId, p).then(withIds);

const BTN =
  "inline-flex items-center gap-[6px] h-[34px] px-[12px] rounded-ctl border border-line-2 bg-surface text-muted font-semibold text-[13px] cursor-pointer transition-colors duration-150 motion-reduce:transition-none hover:text-text disabled:opacity-[0.45] disabled:cursor-not-allowed pointer-coarse:min-h-[44px]";

const OUTCOMES = [
  {
    value: "passed",
    label: "Pass",
    on: "aria-[pressed=true]:bg-[color:var(--spruce-soft)] aria-[pressed=true]:text-[color:var(--spruce-t)] aria-[pressed=true]:border-transparent",
  },
  {
    value: "failed",
    label: "Fail",
    on: "aria-[pressed=true]:bg-[color:var(--ember-soft)] aria-[pressed=true]:text-[color:var(--ember-t)] aria-[pressed=true]:border-transparent",
  },
  {
    value: "blocked",
    label: "Blocked",
    on: "aria-[pressed=true]:bg-[color:var(--saffron-soft)] aria-[pressed=true]:text-[color:var(--saffron-t)] aria-[pressed=true]:border-transparent",
  },
];

const upsertLocal = (list, row) => {
  const i = list.findIndex((r) => r.caseId === row.caseId);
  if (i === -1) return [row, ...list];
  const next = [...list];
  next[i] = row;
  return next;
};

export default function TestRunPage() {
  const { runId } = useParams();
  const { projectId, can } = useProject();
  const toast = useToast();
  const canEdit = can("test.edit");
  const run = useResource(() => getTestRun(projectId, runId), [projectId, runId]);
  const cases = usePaged(fetchCases, { pid: projectId });
  const results = usePaged(fetchResults, { pid: projectId, runId });
  const [notes, setNotes] = useState({});
  const [pendingCase, setPendingCase] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const ready = run.status === "success" && cases.status === "success";
  const locked = !canEdit || run.data?.status === "completed";

  useViewEntry(
    "test-run",
    ({ q, root }) => {
      fadeUp(q(".head__sub"), { y: 8 });
      fadeUp(q("[data-key]").slice(0, 14), { y: 10, stagger: 0.035, delay: 0.14 });
      return bindLift(root);
    },
    [ready],
  );

  const resultByCase = useMemo(() => new Map(results.items.map((r) => [r.caseId, r])), [results.items]);
  const noteFor = (caseId) => notes[caseId] ?? resultByCase.get(caseId)?.notes ?? "";

  const record = async (testCase, outcome) => {
    const previous = resultByCase.get(testCase.id);
    const body = { caseId: testCase.id, status: outcome, notes: noteFor(testCase.id) };
    setPendingCase(testCase.id);
    results.setItems((list) => upsertLocal(list, { ...body, id: previous?.id ?? `pending-${testCase.id}` }));
    try {
      const saved = await upsertResult(projectId, runId, body);
      results.setItems((list) => upsertLocal(list, { ...saved.data, caseId: testCase.id }));
    } catch {
      results.setItems((list) =>
        previous ? upsertLocal(list, previous) : list.filter((r) => r.caseId !== testCase.id),
      );
    } finally {
      setPendingCase(null);
    }
  };

  const saveNote = (testCase) => {
    const existing = resultByCase.get(testCase.id);
    if (!existing || locked) return;
    const typed = notes[testCase.id];
    if (typed === undefined || typed === existing.notes) return;
    record(testCase, existing.status);
  };

  const tally = useMemo(() => {
    const t = { passed: 0, failed: 0, blocked: 0 };
    cases.items.forEach((c) => {
      const s = resultByCase.get(c.id)?.status;
      if (s && t[s] !== undefined) t[s] += 1;
    });
    return t;
  }, [cases.items, resultByCase]);

  const total = cases.items.length;
  const tested = tally.passed + tally.failed + tally.blocked;
  const passPct = total ? Math.round((tally.passed / total) * 100) : 0;

  const complete = async () => {
    try {
      const done = await completeTestRun(projectId, runId);
      const c = done.data?.counts ?? {};
      toast.success(`Run completed: ${c.passed ?? tally.passed} passed, ${c.failed ?? tally.failed} failed`);
      setConfirmOpen(false);
      run.reload();
    } catch {
      // The API layer shows the failure. The dialog stays open so the user can retry.
    }
  };

  if (run.status === "error") {
    return (
      <>
        <PageHead title="Test run" sub="The run did not load." />
        <section className="card p-[22px]">
          <EmptyState tone="error" title="This run did not load" text="Check the link and try again." onRetry={run.reload} />
        </section>
      </>
    );
  }

  const runData = run.data ?? {};

  return (
    <>
      <PageHead
        title={runData.name ?? "Test run"}
        sub={`${runData.environment || "No environment"} · Build ${runData.buildVersion || "not set"}`}
        actions={
          <>
            <Button as={Link} to={paths.tests(projectId)} variant="ghost" icon="chevL">
              Test cases
            </Button>
            {canEdit && runData.status !== "completed" ? (
              <Button variant="ember" icon="check" onClick={() => setConfirmOpen(true)}>
                Complete run
              </Button>
            ) : null}
          </>
        }
      />

      <section className="card p-[18px] grid gap-[12px] mb-[var(--gap)]" aria-label="Run totals">
        <div className="flex items-center gap-[10px] flex-wrap">
          <Badge variant="status" tone={runData.status === "completed" ? "spruce" : runData.status === "inProgress" ? "iris" : "plain"}>
            {runData.status === "completed" ? "Completed" : runData.status === "inProgress" ? "In progress" : "Planned"}
          </Badge>
          <span className="text-muted text-[13px] tnum">
            {tally.passed} passed · {tally.failed} failed · {tally.blocked} blocked · {Math.max(total - tested, 0)} untested
          </span>
        </div>
        <span className="meter" role="img" aria-label={`${passPct} percent of cases passed`}>
          <span
            className="meter__fill meter__fill--spruce transition-[width] duration-[600ms] motion-reduce:transition-none"
            style={{ width: `${passPct}%` }}
          />
        </span>
      </section>

      {cases.status === "loading" || results.status === "loading" ? (
        <Skeleton variant="feed" count={5} />
      ) : cases.status === "error" ? (
        <section className="card p-[22px]">
          <EmptyState tone="error" title="Test cases did not load" text="Try again in a moment." onRetry={cases.reload} />
        </section>
      ) : !cases.items.length ? (
        <section className="card p-[22px]">
          <EmptyState icon="test" title="This run has no cases" text="Add test cases to the project before recording results." />
        </section>
      ) : (
        <section className="card p-[18px] grid gap-[12px]">
          <ol className="grid gap-[10px] list-none p-0 m-0">
            {cases.items.map((c) => {
              const current = resultByCase.get(c.id)?.status;
              const busy = pendingCase === c.id;
              return (
                <li key={c.id} data-key={c.id} className="grid gap-[10px] rounded-[15px] border border-line bg-surface p-[14px]">
                  <div className="flex items-start gap-[10px] flex-wrap">
                    <span className="grid gap-[2px] min-w-0 flex-1">
                      <span className="text-muted text-[12px] font-semibold tnum">{c.key}</span>
                      <span className="font-semibold text-text">{c.title}</span>
                    </span>
                    <span role="group" aria-label={`Result for ${c.title}`} className="flex items-center gap-[6px] flex-wrap">
                      {OUTCOMES.map((o) => (
                        <button
                          key={o.value}
                          type="button"
                          aria-pressed={current === o.value}
                          disabled={locked || busy}
                          onClick={(e) => {
                            press(e.currentTarget);
                            record(c, o.value);
                          }}
                          className={`${BTN} ${o.on}`}
                        >
                          {o.label}
                        </button>
                      ))}
                    </span>
                  </div>
                  {c.steps?.length ? (
                    <ol className="grid gap-[4px] text-[13.5px] text-muted list-decimal pl-[20px] m-0">
                      {c.steps.map((s, i) => (
                        <li key={i}>
                          {s.action}
                          {s.expected ? <span className="text-faint"> → {s.expected}</span> : null}
                        </li>
                      ))}
                    </ol>
                  ) : null}
                  <Input
                    label={`Note for ${c.title}`}
                    hideLabel
                    placeholder="Note (optional)"
                    value={noteFor(c.id)}
                    disabled={locked || busy}
                    onChange={(e) => setNotes((n) => ({ ...n, [c.id]: e.target.value }))}
                    onBlur={() => saveNote(c)}
                  />
                </li>
              );
            })}
          </ol>
          {cases.hasMore ? (
            <Button variant="soft" size="sm" onClick={cases.loadMore} loading={cases.loadingMore} disabled={cases.loadingMore}>
              Show more
            </Button>
          ) : null}
        </section>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Complete this run?"
        text="Cases without a result stay untested. Recorded results are kept."
        confirmLabel="Complete run"
        tone="default"
        onConfirm={complete}
      />
    </>
  );
}
