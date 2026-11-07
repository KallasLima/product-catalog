import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from './store.js';
import { createApp } from './app.js';
test('HTTP CRUD persists across restart; invalid writes are rejected; concurrent writes survive', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'products-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const file = join(dir, 'products.json');
  const store = new Store(file);
  await store.init();
  const server = createApp(store).listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}/api/products`;
  const request = (path = '', method = 'GET', body) =>
    fetch(base + path, {
      method,
      headers: { 'content-type': 'application/json' },
      body: body && JSON.stringify(body),
    });
  const product = {
    name: 'Test item',
    description: 'A real persisted fixture.',
    price: 0,
    category: 'Other',
  };
  for (const invalid of [
    { ...product, price: 1.25 },
    { ...product, name: ' ' },
    { ...product, price: 100_000_001 },
    { ...product, id: 'forged' },
    { ...product, category: 'Unknown' },
  ])
    assert.equal((await request('', 'POST', invalid)).status, 400);
  const response = await request('', 'POST', product);
  assert.equal(response.status, 201);
  const saved = await response.json();
  assert.equal(saved.price, 0);
  const changes = { ...product, name: 'Updated item', price: 1234 };
  assert.equal((await request('/' + saved.id, 'PUT', changes)).status, 200);
  const restored = new Store(file);
  await restored.init();
  assert.equal(restored.items.find((x) => x.id === saved.id).price, 1234);
  assert.equal((await (await request('?q=updated')).json()).items.length, 1);
  await Promise.all(
    Array.from({ length: 10 }, (_, i) =>
      request('', 'POST', { ...product, name: 'Concurrent ' + i }),
    ),
  );
  const disk = new Store(file);
  await disk.init();
  assert.equal(disk.items.length, 17);
  assert.equal((await request('/' + saved.id, 'DELETE')).status, 204);
  assert.equal((await request('/' + saved.id)).status, 404);
  assert.equal((await request('/' + saved.id, 'PUT', product)).status, 404);
  assert.equal(
    (
      await fetch(base, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{bad',
      })
    ).status,
    400,
  );
});
