"use client";

/// Server Components can't pass event handlers (onError) to a plain <img>;
/// wrapping it here keeps the graceful hide-on-missing-flag behavior without
/// making every page that shows a flag a Client Component.
export default function CountryFlagImg({ src, className }: { src: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className={className}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none";
      }}
    />
  );
}
