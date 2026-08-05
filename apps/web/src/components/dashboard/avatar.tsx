"use client";

import { useState } from "react";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Avatar({
  name,
  src,
  size,
}: {
  name: string;
  src?: string | null;
  size: number;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className="rounded-full flex items-center justify-center text-white font-semibold shrink-0"
        style={{
          width: size,
          height: size,
          fontSize: Math.max(10, size * 0.34),
          background: "linear-gradient(135deg,#6E4CFF,#8B5CF6)",
        }}
      >
        {initials(name || "?")}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      onError={() => setFailed(true)}
      className="rounded-full object-cover shrink-0"
      style={{ width: size, height: size }}
    />
  );
}