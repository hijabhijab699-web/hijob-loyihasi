'use client';

import { Trash2 } from 'lucide-react';
import { useTransition } from 'react';

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  confirmText: string;
  label?: string;
};

/**
 * Red delete button that pops a native confirm() before firing the server
 * action. Shared across sellers / products / users admin pages so the UX
 * stays identical and the destructive click always needs a second yes.
 */
export function ConfirmDelete({ action, id, confirmText, label = "O'chirish" }: Props) {
  const [pending, startTransition] = useTransition();
  return (
    <form
      className="inline"
      onSubmit={(e) => {
        e.preventDefault();
        if (!window.confirm(confirmText)) return;
        const data = new FormData(e.currentTarget);
        startTransition(() => {
          void action(data);
        });
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="btn-danger" disabled={pending}>
        <Trash2 size={12} /> {pending ? "O'chirilmoqda…" : label}
      </button>
    </form>
  );
}
