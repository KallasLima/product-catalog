import { money } from '../api';
import type { Product } from '../models';
import { ArrowIcon } from './Icons';

// Illustrative photography belongs to the fictional demo objects, not arbitrary
// user records. New or renamed records retain their real text and no borrowed image.
const photographs: Record<string, { file: string; category: string }> = {
  'Everyday notebook': { file: 'notebook', category: 'Stationery' },
  'Stoneware cup': { file: 'cup', category: 'Home' },
  'Canvas tote': { file: 'tote', category: 'Accessories' },
  'Desk light': { file: 'lamp', category: 'Home' },
  'Fountain pen': { file: 'pen', category: 'Stationery' },
  'Travel pouch': { file: 'pouch', category: 'Accessories' },
};

export function ProductCard({
  product,
  onEdit,
  onDelete,
}: {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const photo = photographs[product.name];
  const hasPhoto = photo?.category === product.category;
  return (
    <article className="product">
      <div className={`product-image ${hasPhoto ? '' : 'product-image-unset'}`}>
        {hasPhoto ? (
          <img
            src={`/images/${photo.file}.webp`}
            alt={`Illustrative image of ${product.name.toLowerCase()}`}
            width="1448"
            height="1086"
            decoding="async"
          />
        ) : (
          <div className="image-unset">
            <span aria-hidden="true">{product.name.slice(0, 1).toUpperCase()}</span>
            <small>No image assigned</small>
          </div>
        )}
      </div>
      <div className="product-body">
        <p className="product-category">{product.category}</p>
        <div className="product-heading">
          <h2>{product.name}</h2>
          <strong>{money(product.price)}</strong>
        </div>
        <p className="product-description">{product.description}</p>
        <div className="product-actions">
          <button className="text-button" onClick={onEdit} aria-label={`Edit ${product.name}`}>
            Edit details <ArrowIcon />
          </button>
          <button
            className="text-button delete"
            onClick={onDelete}
            aria-label={`Delete ${product.name}`}
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}
