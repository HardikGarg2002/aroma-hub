export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  /** Right-aligned slot, e.g. a primary button. */
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
      <div>
        <h1 className="font-display text-4xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
