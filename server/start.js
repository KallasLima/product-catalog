import { Store } from './store.js';
import { createApp } from './app.js';
const store = new Store(process.env.DATA_FILE ?? 'data/products.json');
await store.init();
const port = Number(process.env.PORT ?? 4421);
const server = createApp(store).listen(port, '127.0.0.1', () =>
  console.log(`Product catalog API: http://127.0.0.1:${port}`),
);
for (const signal of ['SIGTERM', 'SIGINT'])
  process.on(signal, () => server.close(() => process.exit(0)));
