// feat(pages/projectSettings/components/ProjectSettingsNav): switch between project settings sections, hiding the ones the role cannot open.
import { useNavigate } from "react-router-dom";
import SegmentedControl from "../../../components/ui/SegmentedControl.jsx";
import { useProject } from "../../../context/ProjectContext.jsx";
import { paths } from "../../../routes/paths.js";

const SECTIONS = [
  { value: "general", label: "General", to: paths.projectSettings },
  { value: "people", label: "People", to: paths.projectPeople },
  { value: "roles", label: "Roles", to: paths.projectRoles },
  { value: "workflows", label: "Workflows", to: paths.workflows },
  { value: "fields", label: "Fields", to: paths.fields },
  { value: "labels", label: "Labels", to: paths.labels },
  { value: "audit", label: "Audit", to: paths.projectAudit, adminOnly: true },
];

export default function ProjectSettingsNav({ active }) {
  const { projectId, can } = useProject();
  const navigate = useNavigate();
  const options = SECTIONS.filter((s) => !s.adminOnly || can("audit.view")).map(({ value, label }) => ({
  value,
  label,
  }));

  const go = (value) => {
  const section = SECTIONS.find((s) => s.value === value);
  if (section) navigate(section.to(projectId));
  };

  return (
  <div className="mb-[16px]  overflow-x-auto">
  <SegmentedControl
  as="tabs"
  label="Project settings sections"
  value={active}
  options={options}
  onChange={go}
  />
  </div>
  );
}
