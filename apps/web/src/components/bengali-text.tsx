import type { ElementType, ReactNode } from "react";

const BENGALI_RE = /[\u0980-\u09FF]/;

function hasBengali(node: ReactNode): boolean {
  if (node == null) return false;
  if (typeof node === "string" || typeof node === "number") {
    return BENGALI_RE.test(String(node));
  }
  if (Array.isArray(node)) return node.some(hasBengali);
  if (typeof node === "object" && "props" in (node as object)) {
    const children = (node as { props?: { children?: ReactNode } }).props?.children;
    return hasBengali(children);
  }
  return false;
}

export function BengaliText({
  children,
  as: Tag = "span",
  ...rest
}: {
  children: ReactNode;
  as?: ElementType;
}) {
  return (
    <Tag className={hasBengali(children) ? "font-bengali" : undefined} {...rest}>
      {children}
    </Tag>
  );
}
