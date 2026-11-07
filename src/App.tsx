import { useEffect, useState } from 'react';
import { api, money } from './api';
import type { Product, Draft } from './models';
import { ProductForm } from './components/ProductForm';
import { DeleteDialog } from './components/DeleteDialog';
export default function App() {
  const [items, setItems] = useState<Product[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [search, setSearch] = useState(''),
    [category, setCategory] = useState('All'),
    [editing, setEditing] = useState<Product | null | undefined>(),
    [deleting, setDeleting] = useState<Product | null>(null),
    [notice, setNotice] = useState(''),
    [version, setVersion] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    api<{ items: Product[] }>('', { signal: controller.signal })
      .then((x) => setItems(x.items))
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [version]);
  const q = search.trim().toLowerCase(),
    visible = items.filter(
      (p) =>
        (category === 'All' || p.category === category) &&
        (p.name + ' ' + p.description).toLowerCase().includes(q),
    );
  async function save(draft: Draft) {
    const saved = await api<Product>(editing ? '/' + editing.id : '', {
      method: editing ? 'PUT' : 'POST',
      body: JSON.stringify(draft),
    });
    setItems((old) =>
      editing ? old.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...old],
    );
    setNotice(editing ? 'Product updated.' : 'Product added.');
  }
  return (
    <main>
      <header>
        <a href="/" className="brand">
          <span className="brand-mark">▦</span> Shelf{' '}
          <span className="brand-sub">PRODUCT CATALOG</span>
        </a>
        <span className="local-label">Local workspace</span>
      </header>
      <section className="intro">
        <div>
          <p className="eyebrow">A PLACE FOR THE DETAILS</p>
          <h1>Good things, organized.</h1>
          <p className="muted">
            Keep a small collection of products clear, current and easy to find.
          </p>
        </div>
        <button onClick={() => setEditing(null)}>＋ Add product</button>
      </section>
      <section className="catalog">
        <div className="catalog-toolbar">
          <div className="tabs" aria-label="Categories">
            {['All', 'Stationery', 'Home', 'Accessories', 'Other'].map((x) => (
              <button
                key={x}
                className={x === category ? 'active' : ''}
                aria-pressed={x === category}
                onClick={() => setCategory(x)}
              >
                {x}
              </button>
            ))}
          </div>
          <label className="search">
            <span className="sr-only">Search products</span>
            <input
              type="search"
              placeholder="Search your collection"
              maxLength={100}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>
        <div role="status" className="status">
          {notice ||
            (!loading && !error
              ? `${visible.length} ${visible.length === 1 ? 'product' : 'products'} · Prices in USD`
              : '')}
        </div>
        {loading ? (
          <div className="empty">Loading the collection…</div>
        ) : error ? (
          <div className="empty">
            <h2>We couldn’t load the catalog.</h2>
            <p role="alert">{error}</p>
            <button onClick={() => setVersion((v) => v + 1)}>Try again</button>
          </div>
        ) : visible.length ? (
          <div className="products">
            {visible.map((p) => (
              <article className="product" key={p.id}>
                <div className={'illustration ' + p.category.toLowerCase()} aria-hidden="true">
                  <svg viewBox="0 0 240 160">
                    <ellipse cx="120" cy="134" rx="66" ry="8" fill="currentColor" opacity=".08" />
                    {p.category === 'Stationery' ? (
                      <>
                        <path d="M78 26h85v104H78z" fill="currentColor" opacity=".75" />
                        <path
                          d="M88 26v104M105 52h38M105 63h29"
                          stroke="#fff"
                          strokeWidth="3"
                          opacity=".7"
                        />
                      </>
                    ) : p.category === 'Home' ? (
                      <>
                        <path d="M75 58h78v44c0 42-78 42-78 0z" fill="currentColor" opacity=".75" />
                        <path
                          d="M153 67c46-10 44 49 0 40"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="9"
                          opacity=".75"
                        />
                      </>
                    ) : (
                      <>
                        <path d="M73 55h94l-8 77H81z" fill="currentColor" opacity=".75" />
                        <path
                          d="M98 60V43c0-31 44-31 44 0v17"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="6"
                        />
                      </>
                    )}
                  </svg>
                  <span>{p.category}</span>
                </div>
                <div className="product-body">
                  <div className="product-heading">
                    <h2>{p.name}</h2>
                    <strong>{money(p.price)}</strong>
                  </div>
                  <p>{p.description}</p>
                  <div className="product-actions">
                    <button
                      className="text-button"
                      onClick={() => setEditing(p)}
                      aria-label={'Edit ' + p.name}
                    >
                      Edit details ↗
                    </button>
                    <button
                      className="text-button delete"
                      onClick={() => setDeleting(p)}
                      aria-label={'Delete ' + p.name}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty">
            <h2>{items.length ? 'Nothing matches yet.' : 'Your collection starts here.'}</h2>
            <p>
              {items.length
                ? 'Try another search or category.'
                : 'Add a product to give it a home.'}
            </p>
            <button
              className="secondary"
              onClick={() => {
                setSearch('');
                setCategory('All');
                if (!items.length) setEditing(null);
              }}
            >
              {items.length ? 'Clear filters' : 'Add product'}
            </button>
          </div>
        )}
      </section>
      <footer>
        <span>SHELF / A SMALL PRODUCT WORKSPACE</span>
        <span>Changes are saved to this local server.</span>
      </footer>
      {editing !== undefined && (
        <ProductForm product={editing} onSave={save} onClose={() => setEditing(undefined)} />
      )}{' '}
      {deleting && (
        <DeleteDialog
          product={deleting}
          onClose={() => setDeleting(null)}
          onDelete={async () => {
            await api('/' + deleting.id, { method: 'DELETE' });
            setItems((old) => old.filter((p) => p.id !== deleting.id));
            setNotice('Product deleted.');
          }}
        />
      )}
    </main>
  );
}
