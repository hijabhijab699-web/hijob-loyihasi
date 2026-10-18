'use client';

export function PromptBox({ value }: { value: string }) {
  return (
    <textarea
      readOnly
      rows={14}
      className="input font-mono text-xs"
      value={value}
      onFocus={(e) => e.currentTarget.select()}
    />
  );
}
