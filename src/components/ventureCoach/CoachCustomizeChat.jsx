import { CoachMessage, CoachUserReplyInput } from './CoachMessage.jsx';

/** @param {'ambition' | 'impact' | 'purpose' | 'tagline'} statementType @param {{ id: string, label: string, placeholder: string, suggestion?: string }} field @param {number} index */
function coachPromptForField(statementType, field, index) {
  if (statementType === 'ambition') {
    if (field.id === 'role') return 'What role do you want to become? Reply like you are texting a mentor.';
    if (field.id === 'contribution') return 'Got it. What will you do in that role?';
    if (field.id === 'mark') return 'And what will you build or leave behind?';
  }

  if (statementType === 'impact' || statementType === 'purpose') {
    if (field.id === 'audience') return 'Who do you want to help? Say it in your own words.';
    if (field.id === 'outcome') return 'What difference do you want to make for them?';
  }

  if (statementType === 'tagline') {
    if (index === 0) {
      return 'Give me 2–3 short beats for your tagline — one per reply, like a quick chat.';
    }
    if (field.id === 'word2') return 'Second beat?';
    if (field.id === 'word3') return 'Optional third beat — or leave blank.';
  }

  return field.label;
}

/**
 * @param {{
 *   statementType: 'ambition' | 'impact' | 'purpose' | 'tagline',
 *   fields: Array<{ id: string, label: string, placeholder: string, suggestion?: string, value: string }>,
 *   values: Record<string, string>,
 *   onChange: (id: string, value: string) => void,
 *   onRegenerate: () => void,
 *   regenerating?: boolean,
 * }} props
 */
export function CoachCustomizeChat({ statementType, fields, values, onChange, onRegenerate, regenerating = false }) {
  const intro =
    statementType === 'ambition'
      ? 'Let us personalize this draft. Answer in short chat replies — I will rebuild your ambition statement from your words.'
      : statementType === 'tagline'
        ? 'Let us tune your tagline. Reply with short beats — I will stitch them together.'
        : 'Let us sharpen your impact. Tell me who you help and the difference you make — like a quick chat.';

  const lastFieldId = fields[fields.length - 1]?.id;

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
      <CoachMessage>{intro}</CoachMessage>

      {fields.map((field, index) => (
        <div key={field.id} className="space-y-3">
          <CoachMessage>{coachPromptForField(statementType, field, index)}</CoachMessage>
          <CoachUserReplyInput
            label="You"
            value={values[field.id] ?? ''}
            placeholder={field.suggestion ? `e.g. ${field.suggestion}` : field.placeholder}
            rows={field.id === 'word3' ? 1 : 2}
            onChange={(next) => onChange(field.id, next)}
            onSubmit={field.id === lastFieldId ? onRegenerate : undefined}
          />
        </div>
      ))}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3">
        <p className="text-xs text-slate-500">Press Enter on your last reply, or tap send, to regenerate your draft.</p>
        <button
          type="button"
          onClick={onRegenerate}
          disabled={regenerating}
          className="inline-flex items-center gap-2 rounded-xl bg-spike px-4 py-2 text-sm font-semibold text-white transition hover:bg-spike-light disabled:cursor-not-allowed disabled:opacity-60"
        >
          {regenerating ? 'Regenerating…' : 'Regenerate statement'}
        </button>
      </div>
    </div>
  );
}
