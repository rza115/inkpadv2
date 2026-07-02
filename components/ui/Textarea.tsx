/**
 * Textarea Component
 * Reusable textarea field with label and error handling
 */
import { TextareaHTMLAttributes, forwardRef } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="field">
        {label && <label htmlFor={textareaId}>{label}</label>}
        <textarea
          ref={ref}
          id={textareaId}
          className={className}
          {...props}
        />
        {hint && <p className="field-hint">{hint}</p>}
        {error && (
          <p className="field-error" style={{ color: 'var(--danger)', fontSize: '13px', marginTop: '4px' }}>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
