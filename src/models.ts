export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  createdAt: string;
  updatedAt: string;
};
export type Draft = Pick<Product, 'name' | 'description' | 'price' | 'category'>;
