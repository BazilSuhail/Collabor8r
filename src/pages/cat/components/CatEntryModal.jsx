// feat(pages/cat/components/CatEntryModal): create or edit a translation memory segment or a glossary term.
import FormModal from "../../../components/ui/FormModal.jsx";
import { Icon } from "../../../components/ui/Icon.jsx";
import Input from "../../../components/ui/Input.jsx";
import Select from "../../../components/ui/Select.jsx";
import Switch from "../../../components/ui/Switch.jsx";
import { useToast } from "../../../context/ToastContext.jsx";
import { createCatEntry, createTerm, updateCatEntry, updateTerm } from "../../../libs/api/planning.js";

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "reviewed", label: "Reviewed" },
  { value: "approved", label: "Approved" },
];

const SEGMENT_DEFAULTS = { sourceText: "", targetText: "", sourceLang: "en", targetLang: "", status: "draft" };
const TERM_DEFAULTS = { term: "", definition: "", language: "en", forbidden: false };

export default function CatEntryModal({ open, onClose, projectId, mode = "segment", entry, onSaved }) {
  const toast = useToast();
  const isSegment = mode === "segment";
  const base = isSegment ? SEGMENT_DEFAULTS : TERM_DEFAULTS;
  const initialValues = entry
    ? isSegment
      ? {
          sourceText: entry.sourceText ?? "",
          targetText: entry.targetText ?? "",
          sourceLang: entry.sourceLang ?? "",
          targetLang: entry.targetLang ?? "",
          status: entry.status ?? "draft",
        }
      : {
          term: entry.term ?? "",
          definition: entry.definition ?? "",
          language: entry.language ?? "",
          forbidden: !!entry.forbidden,
        }
    : base;

  const onSubmit = async (values) => {
    let saved;
    if (isSegment) {
      const body = {
        sourceText: values.sourceText.trim(),
        targetText: values.targetText.trim(),
        sourceLang: values.sourceLang.trim().toLowerCase(),
        targetLang: values.targetLang.trim().toLowerCase(),
        status: values.status,
      };
      saved = entry ? await updateCatEntry(projectId, entry.id, body) : await createCatEntry(projectId, body);
    } else {
      const body = {
        term: values.term.trim(),
        definition: values.definition.trim(),
        language: values.language.trim().toLowerCase(),
        forbidden: !!values.forbidden,
      };
      saved = entry ? await updateTerm(projectId, entry.id, body) : await createTerm(projectId, body);
    }
    toast.success("Saved");
    onSaved?.(saved.data);
  };

  const title = isSegment
    ? entry
      ? "Edit segment"
      : "New segment"
    : entry
      ? "Edit term"
      : "New term";

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={title}
      description={
        isSegment
          ? "A source sentence and its approved translation. Language codes such as en or de."
          : "A glossary term. Mark it forbidden to flag wrong wording in review."
      }
      size="md"
      submitLabel="Save"
      initialValues={initialValues}
      onSubmit={onSubmit}
      fields={({ values, set, errors }) =>
        isSegment ? (
          <div className="col-span-full grid grid-cols-2 gap-[var(--gap)] w1000:grid-cols-1">
            <p className="col-span-full flex items-center gap-[8px] text-text font-semibold text-[14px]">
              <Icon name="translate" />
              Segment
            </p>
            <div className="col-span-full">
              <Input
                as="textarea"
                label="Source text"
                hint="The sentence as written in the source language."
                value={values.sourceText}
                maxLength={5000}
                onChange={(e) => set("sourceText", e.target.value)}
                error={errors.sourceText}
              />
            </div>
            <div className="col-span-full">
              <Input
                as="textarea"
                label="Target text"
                hint="The approved translation. Leave blank if not translated yet."
                value={values.targetText}
                maxLength={5000}
                onChange={(e) => set("targetText", e.target.value)}
                error={errors.targetText}
              />
            </div>
            <Input
              label="Source language"
              hint="A language code, for example en."
              value={values.sourceLang}
              maxLength={12}
              onChange={(e) => set("sourceLang", e.target.value)}
              error={errors.sourceLang}
            />
            <Input
              label="Target language"
              hint="A language code, for example de."
              value={values.targetLang}
              maxLength={12}
              onChange={(e) => set("targetLang", e.target.value)}
              error={errors.targetLang}
            />
            <div className="col-span-full">
              <Select
                label="Status"
                hint="Only approved segments are reused as suggestions."
                value={values.status}
                options={STATUS_OPTIONS}
                onChange={(v) => set("status", v)}
                error={errors.status}
              />
            </div>
          </div>
        ) : (
          <div className="col-span-full grid grid-cols-2 gap-[var(--gap)] w1000:grid-cols-1">
            <p className="col-span-full flex items-center gap-[8px] text-text font-semibold text-[14px]">
              <Icon name="book" />
              Term
            </p>
            <Input
              label="Term"
              hint="The word or phrase as it appears in the glossary."
              value={values.term}
              maxLength={120}
              onChange={(e) => set("term", e.target.value)}
              error={errors.term}
            />
            <Input
              label="Language"
              hint="A language code, for example en."
              value={values.language}
              maxLength={12}
              onChange={(e) => set("language", e.target.value)}
              error={errors.language}
            />
            <div className="col-span-full">
              <Input
                as="textarea"
                label="Definition"
                hint="What the term means in this project. Up to 1000 characters."
                value={values.definition}
                maxLength={1000}
                onChange={(e) => set("definition", e.target.value)}
                error={errors.definition}
              />
            </div>
            <div className="col-span-full flex items-center justify-between gap-[12px] rounded-[14px] border border-line bg-surface-2 p-[12px]">
              <span className="grid gap-[2px]">
                <span className="font-semibold text-text">Forbidden</span>
                <span className="text-muted text-[13px]">Translators should not use this wording.</span>
              </span>
              <Switch checked={!!values.forbidden} onChange={(v) => set("forbidden", v)} label="Forbidden" hideLabel />
            </div>
          </div>
        )
      }
    />
  );
}
