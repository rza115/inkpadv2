/**
 * Button Component
 * Replaces vanilla button elements with consistent styling
 */
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', isLoading, children, disabled, className = '', ...props }, ref) => {
    const baseClass = variant;
    const combinedClassName = `${baseClass} ${className}`.trim();

    return (
      <button
        ref={ref}
        className={combinedClassName}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? 'Memproses…' : children}
      </button>
    );
  }
);

Button.displayName = 'Button';
