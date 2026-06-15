interface EmptyStateProps {
  message: string;
  submessage?: string;
}

export function EmptyState({ message, submessage }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-sm text-muted">{message}</p>
      {submessage && (
        <p className="text-xs text-muted/60 mt-1">{submessage}</p>
      )}
    </div>
  );
}
