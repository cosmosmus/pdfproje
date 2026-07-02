export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="bg-surface rounded-[28px] h-24 animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-[24px] h-36 animate-pulse" />
        ))}
      </div>
      <div className="bg-surface rounded-[28px] h-80 animate-pulse" />
    </div>
  );
}
