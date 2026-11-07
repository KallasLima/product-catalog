import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { Product, Draft } from '../models';
export function ProductForm({
  product,
  onSave,
  onClose,
}: {
  product: Product | null;
  onSave: (p: Draft) => Promise<void>;
  onClose: () => void;
}) {
  const id = useId(),
    dialog = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState(product?.name ?? ''),
    [description, setDescription] = useState(product?.description ?? ''),
    [category, setCategory] = useState(product?.category ?? 'Other'),
    [price, setPrice] = useState(product ? (product.price / 100).toFixed(2) : ''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError('');
    if (!/^\d{1,7}(\.\d{1,2})?$/.test(price)) {
      setError('Use a price such as 24.50, with up to 2 decimal places.');
      return;
    }
    const [whole, fraction = ''] = price.split('.');
    const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
    if (cents > 100000000) {
      setError('Price must be no more than $1,000,000.');
      return;
    }
    setBusy(true);
    try {
      await onSave({ name, description, price: cents, category });
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      aria-labelledby={id}
      onCancel={(e) => {
        if (busy) e.preventDefault();
        else onClose();
      }}
    >
      <form onSubmit={submit}>
        <div className="dialog-heading">
          <h2 id={id}>{product ? 'Edit product' : 'Add a product'}</h2>
          <button
            type="button"
            className="icon"
            aria-label="Close"
            disabled={busy}
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <p className="muted">A few details, one useful record.</p>
        <label>
          Name
          <input
            autoFocus
            required
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={busy}
          />
        </label>
        <label>
          Description
          <textarea
            required
            maxLength={1000}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={busy}
          />
        </label>
        <div className="form-row">
          <label>
            Price (USD)
            <input
              required
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="24.50"
              disabled={busy}
            />
          </label>
          <label>
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value)} disabled={busy}>
              {['Stationery', 'Home', 'Accessories', 'Other'].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
        </div>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <div className="actions">
          <button type="button" className="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button disabled={busy}>{busy ? 'Saving…' : 'Save product'}</button>
        </div>
      </form>
    </dialog>
  );
}
