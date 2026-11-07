export const money = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n / 100);
export async function api<T>(path = '', options: RequestInit = {}): Promise<T> {
  const res = await fetch('/api/products' + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'The catalog is unavailable. Please retry.');
  }
  return res.status === 204 ? (undefined as T) : res.json();
}
