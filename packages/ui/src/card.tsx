import { HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hover = true, className = "", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          rounded-2xl border border-line bg-bg-soft p-6 md:p-8
          ${hover ? "transition-all duration-300 ease-out hover:border-brand-2/30 hover:bg-brand-soft" : ""}
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";

export { Card };
export type { CardProps };
