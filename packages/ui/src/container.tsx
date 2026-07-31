import { HTMLAttributes, forwardRef } from "react";

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  as?: "div" | "section" | "article" | "main";
  narrow?: boolean;
}

const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ as: Component = "div", narrow = false, className = "", children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={`
          mx-auto w-full px-5 sm:px-8 lg:px-16
          ${narrow ? "max-w-3xl" : "max-w-[1320px]"}
          ${className}
        `}
        {...props}
      >
        {children}
      </Component>
    );
  },
);

Container.displayName = "Container";

export { Container };
export type { ContainerProps };
