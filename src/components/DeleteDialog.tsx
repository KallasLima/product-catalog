import { useEffect, useRef, useState } from 'react';
import type { Product } from '../models';
export function DeleteDialog({
  product,
  onDelete,
  onClose,
}: {
  product: Product;
  onDelete: () => Promise<void>;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const element = dialog.current;
    element?.showModal();
    return () => {
      element?.close();
      if (opener?.isConnected) opener.focus();
      else document.querySelector<HTMLButtonElement>('.add-product')?.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      aria-labelledby="delete-title"
      onCancel={(e) => {
        if (busy) e.preventDefault();
        else onClose();
      }}
    >
      <h2 id="delete-title">Delete {product.name}?</h2>
      <p>This removes the product from your catalog.</p>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div className="actions">
        <button autoFocus className="secondary" onClick={onClose} disabled={busy}>
          Keep product
        </button>
        <button
          className="danger"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onDelete();
              onClose();
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? 'Deleting…' : 'Delete product'}
        </button>
      </div>
    </dialog>
  );
}
