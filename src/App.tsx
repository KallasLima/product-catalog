import { useEffect, useState } from 'react';
import { api } from './api';
import { ProductCard } from './components/ProductCard';
import { PlusIcon, SearchIcon } from './components/Icons';
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
  const categories = ['All', 'Stationery', 'Home', 'Accessories', 'Other'];
  return (
    <main>
      <header className="app-header">
        <a href="/" className="brand" aria-label="Shelf home">
          Shelf.
        </a>
        <div className="workspace-label">
          <span>Product workspace</span>
          <small>Saved locally</small>
        </div>
      </header>
      <section className="intro" aria-labelledby="collection-title">
        <div>
          <h1 id="collection-title">Your collection.</h1>
          <p>Browse, organize and keep the details current.</p>
        </div>
        <button className="add-product" onClick={() => setEditing(null)}>
          <PlusIcon />
          Add product
        </button>
      </section>
      <section className="catalog" aria-label="Product catalog">
        <div className="catalog-toolbar">
          <div className="tabs" role="group" aria-label="Categories">
            {categories.map((x) => (
              <button
                key={x}
                className={x === category ? 'active' : ''}
                aria-label={x}
                aria-pressed={x === category}
                onClick={() => {
                  setCategory(x);
                  setNotice('');
                }}
              >
                {x}{' '}
                <span className="category-count">
                  {items.filter((p) => x === 'All' || p.category === x).length}
                </span>
              </button>
            ))}
          </div>
          <label className="search">
            <SearchIcon />
            <span className="sr-only">Search products</span>
            <input
              type="search"
              placeholder="Search products"
              maxLength={100}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setNotice('');
              }}
            />
          </label>
        </div>
        <div className="catalog-meta">
          <p aria-live="polite">
            {!loading && !error
              ? `${visible.length} ${visible.length === 1 ? 'product' : 'products'} · Prices in USD`
              : loading
                ? 'Loading the collection…'
                : 'Catalog unavailable'}
          </p>
          <p role="status" className="notice">
            {notice}
          </p>
        </div>
        {loading ? (
          <div className="loading-grid" aria-label="Loading products" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i}>
                <span />
                <span />
                <span />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="empty">
            <h2>We couldn’t load the catalog.</h2>
            <p role="alert">{error}</p>
            <button onClick={() => setVersion((v) => v + 1)}>Try again</button>
          </div>
        ) : visible.length ? (
          <div className="products">
            {visible.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onEdit={() => setEditing(p)}
                onDelete={() => setDeleting(p)}
              />
            ))}
          </div>
        ) : (
          <div className="empty">
            <h2>{items.length ? 'Nothing matches yet.' : 'Your collection starts here.'}</h2>
            <p>
              {items.length
                ? 'Try another search or category.'
                : 'Add your first product to start the collection.'}
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
      <footer>Changes are saved to this local server.</footer>
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
