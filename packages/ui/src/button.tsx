import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-white font-medium shadow-lg shadow-brand/30 hover:-translate-y-0.5 hover:bg-brand-2",
  secondary:
    "bg-brand-2 text-white font-medium shadow-lg shadow-brand-2/25 hover:-translate-y-0.5",
  ghost:
    "bg-transparent text-body hover:text-ink font-medium",
  outline:
    "border border-line bg-transparent text-ink hover:border-brand-2 hover:bg-brand-soft font-medium",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-body-sm",
  md: "px-5 py-2.5 text-body",
  lg: "px-7 py-3.5 text-body-lg",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`
          inline-flex items-center justify-center gap-2 rounded-full
          transition-all duration-250 ease-out
          focus:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-ink focus-visible:rounded-lg
          disabled:opacity-50 disabled:pointer-events-none
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button };
export type { ButtonProps, ButtonVariant, ButtonSize };
