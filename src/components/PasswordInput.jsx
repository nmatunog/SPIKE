import React, { memo, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const PasswordInput = memo(function PasswordInput({
  className = '',
  showLabel = 'Show password',
  hideLabel = 'Hide password',
  ...inputProps
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...inputProps}
        type={visible ? 'text' : 'password'}
        className={`${className} pr-10`.trim()}
      />
      <button
        type="button"
        aria-label={visible ? hideLabel : showLabel}
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
      >
        {visible ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
      </button>
    </div>
  );
});
