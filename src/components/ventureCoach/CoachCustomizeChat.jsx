import { useEffect, useState } from 'react';
import { CoachMessage, CoachUserReplyInput } from './CoachMessage.jsx';

/** @param {'ambition' | 'impact' | 'purpose' | 'tagline'} statementType @param {{ id: string }} field @param {number} index */
function coachPromptForField(statementType, field, index) {
  if (statementType === 'ambition') {
    if (field.id === 'role') return 'What role do you want to become? Reply in your own words.';
    if (field.id === 'contribution') return 'Got it. What will you do in that role?';
    if (field.id === 'mark') return 'And what will you build or leave behind?';
  }

  if (statementType === 'impact' || statementType === 'purpose') {
    if (field.id === 'audience') return 'Who do you want to help? Say it in your own words.';
    if (field.id === 'outcome') return 'What difference do you want to make for them?';
  }

  if (statementType === 'tagline') {
    if (index === 0) return 'Give me your first tagline beat — short and punchy.';
    if (field.id === 'word2') return 'Second beat?';
    if (field.id === 'word3') return 'Optional third beat — or leave blank and send.';
  }

  return field.label;
}

/** @param {Record<string, string>} values @param {Array<{ id: string }>} fields */
function computeActiveIndex(values, fields) {
  const firstEmpty = fields.findIndex((field) => !values[field.id]?.trim());
  if (firstEmpty === -1) return fields.length;
  return firstEmpty;
}

/**
 * @param {{
 *   statementType: 'ambition' | 'impact' | 'purpose' | 'tagline',
 *   fields: Array<{ id: string, label: string, placeholder: string, hint?: string }>,
 *   values: Record<string, string>,
 *   onChange: (id: string, value: string) => void,
 *   onRegenerate: () => void,
 *   regenerating?: boolean,
 *   contextChips?: string[],
 *   chatResetKey?: string,
 * }} props
 */
export function CoachCustomizeChat({
  statementType,
  fields,
  values,
  onChange,
  onRegenerate,
  regenerating = false,
  contextChips = [],
  chatResetKey = '',
}) {
  const [activeIndex, setActiveIndex] = useState(() => computeActiveIndex(values, fields));

  useEffect(() => {
    setActiveIndex(computeActiveIndex(values, fields));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only rewind chat when variant/session resets
  }, [chatResetKey]);

  const intro =
    statementType === 'ambition'
      ? 'I will ask you three quick questions — one at a time. Your motivator picks stay in play even if you skip a reply.'
      : statementType === 'tagline'
        ? 'Three short beats, one question at a time. Leave a beat blank to keep your current draft wording.'
        : 'Two quick questions, one at a time. Your audience picks stay in play even if you skip a reply.';

  const activeField = activeIndex < fields.length ? fields[activeIndex] : null;
  const onLastQuestion = activeIndex === fields.length - 1;
  const chatComplete = activeIndex >= fields.length;

  function handleSend() {
    if (!activeField || regenerating) return;
    if (onLastQuestion) {
      onRegenerate();
      setActiveIndex(fields.length);
      return;
    }
    setActiveIndex((index) => Math.min(index + 1, fields.length));
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
      <CoachMessage>
        <p>{intro}</p>
        {contextChips.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {contextChips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-spike/20 bg-spike-muted/60 px-3 py-1 text-xs font-semibold text-spike"
              >
                {chip}
              </span>
            ))}
          </div>
        ) : null}
      </CoachMessage>

      {fields.slice(0, activeIndex).map((field, index) => {
        const reply = values[field.id]?.trim();
        return (
          <div key={field.id} className="space-y-3">
            <CoachMessage>{coachPromptForField(statementType, field, index)}</CoachMessage>
            <CoachMessage role="user">{reply || '(skipped — using your card picks)'}</CoachMessage>
          </div>
        );
      })}

      {activeField ? (
        <div className="space-y-3">
          <CoachMessage>{coachPromptForField(statementType, activeField, activeIndex)}</CoachMessage>
          {activeField.hint ? <p className="text-2xs text-slate-500">{activeField.hint}</p> : null}
          <CoachUserReplyInput
            label="You"
            value={values[activeField.id] ?? ''}
            placeholder={activeField.placeholder}
            rows={activeField.id === 'word3' ? 1 : 2}
            onChange={(next) => onChange(activeField.id, next)}
            onSubmit={handleSend}
          />
          <p className="text-2xs text-slate-400">
            {onLastQuestion
              ? 'Press Enter or send to regenerate your statement.'
              : 'Press Enter or send to continue to the next question.'}
          </p>
        </div>
      ) : null}

      {chatComplete ? (
        <div className="space-y-3 border-t border-slate-200 pt-3">
          <p className="text-xs text-slate-500">
            All set. Regenerate again anytime, or edit a reply above by clearing your saved answers and starting over.
          </p>
          <div className="flex justify-end">
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
      ) : null}
    </div>
  );
}
