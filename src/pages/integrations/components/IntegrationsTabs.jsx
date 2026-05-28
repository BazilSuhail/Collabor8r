// feat(pages/integrations/components/IntegrationsTabs): switch between the integrations catalog and the webhooks list.
import { useNavigate } from "react-router-dom";
import SegmentedControl from "../../../components/ui/SegmentedControl.jsx";
import { paths } from "../../../routes/paths.js";

export default function IntegrationsTabs({ pid, active }) {
  const navigate = useNavigate();

  const go = (value) => {
    if (value === active) return;
    navigate(value === "webhooks" ? paths.webhooks(pid) : paths.integrations(pid));
  };

  return (
    <SegmentedControl
      as="tabs"
      label="Integration views"
      value={active}
      onChange={go}
      options={[
        { value: "integrations", label: "Integrations" },
        { value: "webhooks", label: "Webhooks" },
      ]}
    />
  );
}
