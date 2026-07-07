import { useId, useState } from 'react';
import type { InputHTMLAttributes } from 'react';

interface PasswordInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

export function PasswordInput({ label, id, ...rest }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="field">
      <label htmlFor={inputId}>{label}</label>
      <div className="field-input-wrap">
        <input id={inputId} type={visible ? 'text' : 'password'} {...rest} />
        <button
          type="button"
          className="field-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? '🙈' : '👁️'}
        </button>
      </div>
    </div>
  );
}
