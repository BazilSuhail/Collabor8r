// feat(pages/notFound/NotFoundPage): show a friendly not-found state with a way back to the dashboard.
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useViewEntry, fadeUp } from "../../utils/motion.js";
import Button from "../../components/ui/Button.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";

export default function NotFoundPage() {
  const { status } = useAuth();
  const signedIn = status === "authenticated";

  useViewEntry(
    "not-found",
    ({ q }) => {
      fadeUp(q("[data-enter]"), { y: 14, stagger: 0.05 });
    },
    [],
  );

  const body = (
    <div data-enter>
      <EmptyState
        icon="search"
        title="Page not found"
        text="The page you are looking for does not exist or was moved."
        action={
          <Button as={Link} to="/dashboard" variant="ember" icon="home">
            Back to dashboard
          </Button>
        }
      />
    </div>
  );

  if (!signedIn) {
    return <div className="grid gap-[18px] text-center">{body}</div>;
  }
  return <section className="card p-[24px]">{body}</section>;
}
