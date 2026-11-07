import express from 'express';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { validate } from './store.js';
export function createApp(store) {
  const app = express();
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set(
      'Content-Security-Policy',
      "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'",
    );
    next();
  });
  app.use(express.json({ limit: '16kb' }));
  app.get('/api/products', (req, res) => {
    if (
      typeof req.query.q !== 'undefined' &&
      (typeof req.query.q !== 'string' || req.query.q.length > 100)
    )
      return res.status(400).json({ error: 'Search must be at most 100 characters.' });
    const q = (req.query.q ?? '').trim().toLowerCase();
    res.json({
      items: store.items.filter((p) => (p.name + ' ' + p.description).toLowerCase().includes(q)),
      currency: 'USD',
    });
  });
  app.get('/api/products/:id', (req, res) => {
    const p = store.items.find((p) => p.id === req.params.id);
    res.status(p ? 200 : 404).json(p ?? { error: 'Product not found.' });
  });
  app.post('/api/products', async (req, res) => {
    const error = validate(req.body);
    if (error) return res.status(400).json({ error });
    const now = new Date().toISOString();
    const p = {
      ...req.body,
      name: req.body.name.trim(),
      description: req.body.description.trim(),
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    await store.mutate((items) => items.unshift(p));
    res
      .status(201)
      .location('/api/products/' + p.id)
      .json(p);
  });
  app.put('/api/products/:id', async (req, res) => {
    const error = validate(req.body);
    if (error) return res.status(400).json({ error });
    const result = await store.mutate((items) => {
      const i = items.findIndex((p) => p.id === req.params.id);
      if (i < 0) return null;
      items[i] = {
        ...items[i],
        ...req.body,
        name: req.body.name.trim(),
        description: req.body.description.trim(),
        updatedAt: new Date().toISOString(),
      };
      return items[i];
    });
    res.status(result ? 200 : 404).json(result ?? { error: 'Product not found.' });
  });
  app.delete('/api/products/:id', async (req, res) => {
    const removed = await store.mutate((items) => {
      const i = items.findIndex((p) => p.id === req.params.id);
      if (i < 0) return false;
      items.splice(i, 1);
      return true;
    });
    if (removed) res.status(204).end();
    else res.status(404).json({ error: 'Product not found.' });
  });
  app.use('/api', (_, res) => res.status(404).json({ error: 'Route not found.' }));
  app.use(express.static(fileURLToPath(new URL('../dist', import.meta.url))));
  app.use((error, req, res, next) => {
    const status =
      error.type === 'entity.too.large' ? 413 : error.type === 'entity.parse.failed' ? 400 : 500;
    res.status(status).json({
      error: status === 500 ? 'Unable to save changes. Please retry.' : 'Invalid request body.',
    });
  });
  return app;
}
