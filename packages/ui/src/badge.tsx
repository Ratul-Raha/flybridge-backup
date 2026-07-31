import { HTMLAttributes, forwardRef } from "react";

type BadgeVariant = "default" | "success" | "outline";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-brand text-white font-semibold",
  success: "bg-brand-2 text-white font-semibold",
  outline: "border border-line text-body bg-transparent",
};

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = "default", className = "", children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={`
          inline-flex items-center rounded-full px-3 py-0.5 text-mono-sm
          ${variantStyles[variant]}
          ${className}
        `}
        {...props}
      >
        {children}
      </span>
    );
  },
);

Badge.displayName = "Badge";

export { Badge };
export type { BadgeProps, BadgeVariant };
