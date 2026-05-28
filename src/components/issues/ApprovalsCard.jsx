import { useState } from "react";
import { useToast } from "../../context/ToastContext.jsx";
import { decideApproval, listApprovals, requestApproval } from "../../libs/api/servicedesk.js";
import { searchUsers } from "../../libs/api/users.js";
import { useResource } from "../../utils/useResource.js";
import Badge from "../ui/Badge.jsx";
import Button from "../ui/Button.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import FormModal from "../ui/FormModal.jsx";
import { Icon } from "../ui/Icon.jsx";
import Select from "../ui/Select.jsx";
import Skeleton from "../ui/Skeleton.jsx";

const TONE = { pending: "saffron", approved: "spruce", rejected: "ember" };
const LABEL = { pending: "Pending", approved: "Approved", rejected: "Rejected" };

const personOption = (u) => ({ value: u.id ?? u._id, label: u.displayName ?? u.email ?? "User" });

// Approvals on one issue. Lists, requests and decides through libs/api only.
export default function ApprovalsCard({ projectId, issueId, can = false }) {
  const toast = useToast();
  const [requesting, setRequesting] = useState(false);
  const approvals = useResource(() => listApprovals(projectId, issueId), [projectId, issueId]);
  const items = approvals.data ?? [];

  const decide = async (approval, decision) => {
    try {
      await decideApproval(projectId, approval.id ?? approval._id, { decision });
      toast.success(decision === "approved" ? "Approved" : "Rejected");
      approvals.reload();
    } catch {
      toast.error("Could not record the decision");
    }
  };

  return (
    <section className="card p-[18px] grid gap-[12px]" aria-labelledby="iss-appr-t">
      <header className="card__head min-h-[32px]">
        <h2 className="card__title flex items-center gap-[8px] min-w-0" id="iss-appr-t">
          <Icon name="approval" cls="shrink-0" />
          <span className="truncate">Approvals</span>
        </h2>
        {can ? (
          <div className="card__tools">
            <Button size="sm" variant="soft" icon="approval" onClick={() => setRequesting(true)}>
              Request approval
            </Button>
          </div>
        ) : null}
      </header>

      {approvals.status === "loading" ? <Skeleton variant="feed" count={2} /> : null}
      {approvals.status === "error" ? (
        <EmptyState tone="error" title="Could not load approvals" onRetry={approvals.reload} />
      ) : null}
      {approvals.status === "success" && !items.length ? (
        <EmptyState icon="approval" title="No approvals requested" />
      ) : null}

      {approvals.status === "success" && items.length ? (
        <ul className="grid gap-[8px] list-none m-0 p-0">
          {items.map((a) => {
            const id = a.id ?? a._id;
            const status = a.status ?? "pending";
            return (
              <li key={id} className="flex flex-wrap items-center gap-[10px] p-[10px_12px] rounded-[14px] bg-surface-2 border border-line" data-key={id}>
                <div className="min-w-0 flex-1 grid gap-[2px]">
                  <b className="font-bold truncate">{a.approver?.displayName ?? "Approver"}</b>
                  {a.comment ? <small className="text-muted text-[12px] font-semibold truncate">{a.comment}</small> : null}
                </div>
                <Badge variant="status" tone={TONE[status] ?? "plain"}>
                  {LABEL[status] ?? status}
                </Badge>
                {can && status === "pending" ? (
                  <div className="flex gap-[6px]">
                    <Button size="sm" variant="ghost" icon="check" onClick={() => decide(a, "approved")}>
                      Approve
                    </Button>
                    <Button size="sm" variant="ghost" icon="close" onClick={() => decide(a, "rejected")}>
                      Reject
                    </Button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      <FormModal
        open={requesting}
        onClose={() => setRequesting(false)}
        title="Request approval"
        description="Choose who must approve this issue."
        submitLabel="Request"
        initialValues={{ approverIds: [] }}
        onSubmit={async (values) => {
          await requestApproval(projectId, issueId, { approverIds: values.approverIds });
          toast.success("Approval requested");
          approvals.reload();
        }}
        fields={({ values, set }) => (
          <div className="col-span-full">
            <Select
              multiple
              searchable
              label="Approvers"
              hint="Each approver is asked to approve or reject this issue."
              value={values.approverIds}
              onChange={(next) => set("approverIds", next)}
              options={[]}
              loadOptions={(q) => searchUsers(q).then((res) => (res.data ?? []).map(personOption))}
              placeholder="Search people"
            />
          </div>
        )}
      />
    </section>
  );
}
