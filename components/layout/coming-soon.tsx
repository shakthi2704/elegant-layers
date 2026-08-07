export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-2 text-center">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        This module hasn&apos;t been built yet — it&apos;s next up on the roadmap.
      </p>
    </div>
  );
}
