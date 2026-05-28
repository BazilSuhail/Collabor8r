import { Outlet, useParams } from "react-router-dom";
import { ProjectProvider } from "../context/ProjectContext.jsx";

export default function RequireProject() {
  const { projectId } = useParams();
  return (
    <ProjectProvider key={projectId} projectId={projectId}>
      <Outlet />
    </ProjectProvider>
  );
}
