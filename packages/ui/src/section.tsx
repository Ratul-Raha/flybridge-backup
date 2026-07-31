import { HTMLAttributes, forwardRef } from "react";

interface SectionProps extends HTMLAttributes<HTMLElement> {
  variant?: "default" | "muted" | "primary";
}

const Section = forwardRef<HTMLElement, SectionProps>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <section
        ref={ref}
        className={`py-18 md:py-26 lg:py-30 ${className}`}
        {...props}
      >
        {children}
      </section>
    );
  },
);

Section.displayName = "Section";

export { Section };
export type { SectionProps };
