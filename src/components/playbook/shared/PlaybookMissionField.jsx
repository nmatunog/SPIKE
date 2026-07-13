import { useMemo, useState } from 'react';
import { PlaybookAiAssistPanel } from './PlaybookAiAssistPanel.jsx';
import { suggestPlaybookFieldAssist } from '../../../lib/week5/playbookAiAssist.js';

const INPUT =
  'mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-spike focus:bg-white focus:ring-2 focus:ring-spike/15';
const TEXTAREA = `${INPUT} min-h-[96px] resize-y leading-relaxed`;

/**
 * @param {{
 *   fieldId: string,
 *   label: string,
 *   value: string,
 *   onChange: (value: string) => void,
 *   type?: 'text' | 'textarea' | 'number',
 *   placeholder?: string,
 *   softHint?: string,
 *   readOnly?: boolean,
 *   context?: Record<string, string>,
 * }} props
 */
export function PlaybookMissionField({
  fieldId,
  label,
  value,
  onChange,
  type = 'textarea',
  placeholder = '',
  softHint = '',
  readOnly = false,
  context = {},
}) {
  const [dismissed, setDismissed] = useState(false);
  const suggestion = useMemo(
    () => (dismissed ? '' : suggestPlaybookFieldAssist(fieldId, value, context)),
    [dismissed, fieldId, value, context],
  );

  const Tag = type === 'textarea' ? 'textarea' : 'input';

  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-900">{label}</span>
      {softHint ? (
        <p className="mt-1 text-xs text-amber-800" role="note">
          {softHint}
        </p>
      ) : null}
      <Tag
        id={fieldId}
        name={fieldId}
        className={type === 'textarea' ? TEXTAREA : INPUT}
        value={value}
        placeholder={placeholder}
        readOnly={readOnly}
        disabled={readOnly}
        type={type === 'number' ? 'number' : 'text'}
        onChange={(e) => onChange(e.target.value)}
      />
      {!readOnly ? (
        <PlaybookAiAssistPanel
          suggestion={suggestion}
          onApply={(text) => {
            onChange(text);
            setDismissed(true);
          }}
          onInsertBelow={(text) => {
            onChange(value.trim() ? `${value.trim()}\n\n${text}` : text);
            setDismissed(true);
          }}
          onDismiss={() => setDismissed(true)}
        />
      ) : null}
    </label>
  );
}
