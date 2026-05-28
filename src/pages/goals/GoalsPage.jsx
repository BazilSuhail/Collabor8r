// feat(pages/goals/GoalsPage): set project goals, record progress and watch each goal's gauge fill.
import { useState } from "react";
import PageHead from "../../components/layout/PageHead.jsx";
import GoalCard, { GOAL_STATUS } from "../../components/goals/GoalCard.jsx";
import GoalFormModal from "../../components/goals/GoalFormModal.jsx";
import ProgressModal from "../../components/goals/ProgressModal.jsx";
import Button from "../../components/ui/Button.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Illustration from "../../components/ui/Illustration.jsx";
import SegmentedControl from "../../components/ui/SegmentedControl.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import { useConfirm } from "../../components/ui/ConfirmDialog.jsx";
import { useProject } from "../../context/ProjectContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { usePaged } from "../../utils/usePaged.js";
import { bindLift, cardRise, fadeUp, useViewEntry } from "../../utils/motion.js";
import { listGoals, deleteGoal } from "../../libs/api/reports.js";

const keyOf = (row) => row.id ?? row._id;

const FILTERS = [
  { value: "all", label: "All" },
  { value: "on_track", label: "On track" },
  { value: "at_risk", label: "At risk" },
  { value: "off_track", label: "Off track" },
  { value: "done", label: "Done" },
];

export default function GoalsPage() {
  const { projectId, can } = useProject();
  const toast = useToast();
  const confirm = useConfirm();
  const [filter, setFilter] = useState("all");
  const list = usePaged((p) => listGoals(projectId, p), filter === "all" ? {} : { status: filter });
  const [editor, setEditor] = useState(null);
  const [progressGoal, setProgressGoal] = useState(null);
  const canManage = can("goal.manage");
  const canProgress = can("goal.progress");
  const ready = list.status === "success";

  useViewEntry(
    "goals",
    ({ q, root }) => {
      if (!ready) return undefined;
      fadeUp(q(".head__sub"), { y: 8 });
      cardRise(q(".card"), { y: 26, stagger: 0.07, delay: 0.14 });
      return bindLift(root);
    },
    [ready],
  );

  const replaceGoal = (goal) => list.setItems((prev) => prev.map((x) => (keyOf(x) === keyOf(goal) ? goal : x)));

  const onGoalSaved = (goal) => {
    if (editor?.goal) replaceGoal(goal);
    else list.reload();
  };

  const remove = async (goal) => {
    const ok = await confirm({
      title: "Delete this goal?",
      text: `${goal.title} and its progress history are removed.`,
      confirmLabel: "Delete",
    });
    if (!ok) return;
    try {
      await deleteGoal(projectId, keyOf(goal));
      toast.success("Goal deleted");
      list.setItems((prev) => prev.filter((x) => keyOf(x) !== keyOf(goal)));
    } catch (err) {
      if (err?.status !== 422) toast.error("Could not delete the goal");
    }
  };

  const newGoal = canManage ? (
    <Button variant="ember" icon="plus" onClick={() => setEditor({ goal: null })}>
      New goal
    </Button>
  ) : null;

  const count = (status) => list.items.filter((g) => g.status === status).length;
  const stats = ready
    ? [
        { label: "Goals", value: `${list.items.length}${list.hasMore ? "+" : ""}`, icon: "goal" },
        { label: GOAL_STATUS.on_track.label, value: String(count("on_track")), icon: "check" },
        { label: GOAL_STATUS.at_risk.label, value: String(count("at_risk")), icon: "alert" },
        { label: GOAL_STATUS.done.label, value: String(count("done")), icon: "check" },
      ]
    : undefined;

  return (
    <>
      <PageHead
        title="Goals"
        sub="Numbers the project works toward. Linked work moves each gauge."
        stats={stats}
        actions={newGoal}
      />

      <div className="toolbar">
        <SegmentedControl label="Status" value={filter} onChange={setFilter} options={FILTERS} size="sm" />
      </div>

      {list.status === "loading" && (
        <div className="grid grid-cols-[repeat(3,minmax(0,1fr))] w1100:grid-cols-[repeat(2,minmax(0,1fr))] w560:grid-cols-[minmax(0,1fr)] gap-[var(--gap)]">
          <Skeleton variant="cards" count={6} />
        </div>
      )}

      {list.status === "error" && (
        <div className="card">
          <EmptyState tone="error" title="Could not load goals" onRetry={list.reload} />
        </div>
      )}

      {ready && list.items.length === 0 && (
        <div className="card">
          {filter === "all" ? (
            <>
              <Illustration name="empty" alt="" className="mx-auto w-[180px] w1000:hidden" />
              <EmptyState
                icon="goal"
                title="No goals yet"
                text="Goals give the team one number to reach, such as items done or hours logged."
                action={newGoal}
              />
            </>
          ) : (
            <EmptyState icon="goal" title="No goals match this filter" text="Pick another status to see more goals." />
          )}
        </div>
      )}

      {ready && list.items.length > 0 && (
        <>
          <div className="grid grid-cols-[repeat(3,minmax(0,1fr))] w1100:grid-cols-[repeat(2,minmax(0,1fr))] w560:grid-cols-[minmax(0,1fr)] gap-[var(--gap)]">
            {list.items.map((goal) => (
              <GoalCard
                key={keyOf(goal)}
                goal={goal}
                canProgress={canProgress}
                canManage={canManage}
                onProgress={(g) => setProgressGoal(g)}
                onEdit={(g) => setEditor({ goal: g })}
                onDelete={remove}
              />
            ))}
          </div>
          {list.hasMore && (
            <div className="flex justify-center mt-[16px]">
              <Button variant="soft" size="sm" onClick={list.loadMore} disabled={list.loadingMore}>
                Show more
              </Button>
            </div>
          )}
        </>
      )}

      <GoalFormModal
        open={editor !== null}
        onClose={() => setEditor(null)}
        projectId={projectId}
        goal={editor?.goal ?? null}
        onSaved={onGoalSaved}
      />

      <ProgressModal
        open={progressGoal !== null}
        onClose={() => setProgressGoal(null)}
        projectId={projectId}
        goal={progressGoal}
        onSaved={replaceGoal}
      />
    </>
  );
}
