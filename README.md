# Shelf · Product catalog

A small full-stack collection manager: browse, search, create, edit and delete products, with changes saved by a local API.

![Shelf on desktop](docs/preview.png)

This is a refreshed portfolio edition of an earlier technical exercise. The current implementation, demo data and interface were revised in 2026. It is a local learning/demo application; deployment, accounts and production operations are outside its scope.

## Run

Requires Node.js 22.13+ (tested with 22.23.4) and npm. No external account or database service is needed.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:4422. This starts the Vite UI and Express API together; Vite proxies `/api` to port 4421.

To serve a production web build locally:

```sh
npm run build
npm start
```

Open http://127.0.0.1:4421. Both servers bind to `127.0.0.1`.

## A useful walkthrough

1. Filter by **Home**, then search for `cup`.
2. Add a product with a name, description, category and price such as `24.50`.
3. Reload the page, edit the price, and confirm the change remains.
4. Open Delete, choose **Keep product**, then delete it deliberately.
5. Search for a missing item to see the empty state.

The first start seeds 6 fictional products. Subsequent starts read the existing file without reseeding it. All prices are USD; there is no checkout or inventory reservation.

## Design and architecture

React + TypeScript on Vite, with an intentionally small Express backend. The old hosted API dependency was replaced with an included service so the complete workflow is reproducible.

- `src/App.tsx`: collection state, search/category filters and mutation results.
- `src/components/`: keyboard-accessible native modal dialogs for editing and deletion.
- `src/api.ts`, `src/models.ts`: typed transport and product contract.
- `server/app.js`: HTTP validation and CRUD routes.
- `server/store.js`: serialized file mutations and atomic replacement before acknowledging a write.

Search is local because the demo collection is small. Initial loads are cancellable, transport failures have a retry path, and the client reports failed saves inside the active form. Delete needs explicit confirmation. The interface uses an editorial objects-catalog direction: a serif identity, open image/type layouts, underlined categories and focused red-orange actions. Six bundled illustrative product photographs were generated for the fictional seed collection and encoded as WebP. New or renamed records without a matching demo photograph show an explicit no-image state. These images are illustrative assets, not photographs of real inventory. Fonts are bundled locally; the app does not request third-party font or image services.

## API

| Method | Route                      | Result                                   |
| ------ | -------------------------- | ---------------------------------------- |
| GET    | `/api/products`            | `{items, currency: "USD"}`               |
| GET    | `/api/products?q=notebook` | Case-insensitive name/description search |
| GET    | `/api/products/:id`        | One product or 404                       |
| POST   | `/api/products`            | Create; 201 and Location header          |
| PUT    | `/api/products/:id`        | Replace editable fields; 200 or 404      |
| DELETE | `/api/products/:id`        | Delete; 204 or 404                       |

Example request body:

```json
{ "name": "Notebook", "description": "A place for ideas.", "price": 1800, "category": "Stationery" }
```

Money crosses the API as **integer cents**, including zero. Names contain 1–120 characters, descriptions 1–1000, and price is 0–100000000 cents. Categories are `Stationery`, `Home`, `Accessories` or `Other`. Unknown fields, fractional cents, malformed JSON and invalid values are rejected. Responses add UUID `id` plus server-generated `createdAt`/`updatedAt` timestamps. Search is capped at 100 characters.

## Persistence and boundaries

`DATA_FILE` defaults to ignored `data/products.json`; `PORT` defaults to 4421. Start commands should run from the repository root. Stop the server before moving or deleting the data file. A missing file starts a new seeded catalog; a malformed existing file fails startup rather than silently discarding data.

Writes in one process are serialized to prevent dropped concurrent creates. This is a local, unauthenticated single-user demo with last-write-wins edits. Multiple server processes must not share a data file. A shared deployment would need authentication, a database and a deliberate concurrency policy.

## Verify

```sh
npm test
npm run build
npm run format:check
npm audit
```

The HTTP integration test covers validation, free products, create/update/delete, search, persistence after reopening the store, malformed JSON and concurrent writes. Browser validation covers real forms, confirmation/cancellation, reload, service failure/retry and a narrow viewport.

Demo content is fictional. The six product images are AI-generated illustrative assets prepared for this edition. DM Sans and DM Serif Display are distributed under the SIL Open Font License; their notices are retained. Third-party packages retain their licenses. A distribution license for this project has not been selected.
