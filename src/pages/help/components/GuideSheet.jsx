// feat(pages/help/components/GuideSheet): show one product guide as a side sheet with its numbered steps.
import SideModal from "../../../components/ui/SideModal.jsx";

export default function GuideSheet({ guide, open, onClose }) {
  return (
    <SideModal
      open={open}
      onClose={onClose}
      title={guide?.title ?? "Guide"}
      subtitle={guide?.summary}
      size="md"
    >
      {guide ? (
        <ol className="grid gap-[12px] pl-[22px] list-decimal">
          {guide.steps.map((step) => (
            <li key={step} className="text-text text-[14.5px] leading-[1.55] pl-[4px]">
              {step}
            </li>
          ))}
        </ol>
      ) : null}
    </SideModal>
  );
}
