import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
export const demoProducts = [
  {
    name: 'Everyday notebook',
    description: 'A linen-bound notebook for sketches, notes and the next good idea.',
    price: 1800,
    category: 'Stationery',
  },
  {
    name: 'Stoneware cup',
    description: 'A simple ceramic cup with a comfortable handle and matte glaze.',
    price: 2400,
    category: 'Home',
  },
  {
    name: 'Canvas tote',
    description: 'A durable cotton tote with a wide opening and an inside pocket.',
    price: 3200,
    category: 'Accessories',
  },
  {
    name: 'Desk light',
    description: 'A warm, adjustable reading light for a focused workspace.',
    price: 6800,
    category: 'Home',
  },
  {
    name: 'Fountain pen',
    description: 'A refillable writing companion with a smooth medium nib.',
    price: 4500,
    category: 'Stationery',
  },
  {
    name: 'Travel pouch',
    description: 'Keep small essentials in reach with a compact zipped organizer.',
    price: 2200,
    category: 'Accessories',
  },
];
export class Store {
  constructor(file) {
    this.file = file;
    this.queue = Promise.resolve();
  }
  async init() {
    try {
      this.items = JSON.parse(await readFile(this.file, 'utf8'));
      if (!Array.isArray(this.items)) throw new Error('Expected a product array.');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      const now = new Date().toISOString();
      this.items = demoProducts.map((p) => ({
        ...p,
        id: randomUUID(),
        createdAt: now,
        updatedAt: now,
      }));
      await this.persist(this.items);
    }
  }
  async persist(items) {
    await mkdir(dirname(this.file), { recursive: true });
    await writeFile(this.file + '.tmp', JSON.stringify(items, null, 2));
    await rename(this.file + '.tmp', this.file);
  }
  async mutate(action) {
    const next = this.queue.then(async () => {
      const draft = structuredClone(this.items);
      const result = action(draft);
      await this.persist(draft);
      this.items = draft;
      return result;
    });
    this.queue = next.catch(() => {});
    return next;
  }
}
export function validate(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    return 'A product object is required.';
  if (Object.keys(input).some((k) => !['name', 'description', 'price', 'category'].includes(k)))
    return 'Unknown product field.';
  if (typeof input.name !== 'string' || !input.name.trim() || input.name.trim().length > 120)
    return 'Name must contain 1–120 characters.';
  if (
    typeof input.description !== 'string' ||
    !input.description.trim() ||
    input.description.trim().length > 1000
  )
    return 'Description must contain 1–1000 characters.';
  if (!Number.isSafeInteger(input.price) || input.price < 0 || input.price > 100_000_000)
    return 'Price must be integer cents between 0 and 100000000.';
  if (!['Stationery', 'Home', 'Accessories', 'Other'].includes(input.category))
    return 'Choose a valid category.';
}
