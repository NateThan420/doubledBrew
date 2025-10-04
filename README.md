# My-Webiste — Next.js inventory

This repository contains a minimal Next.js migration of the dashboard and an API backed by SQLite for local development. It also includes guidance and SQL for migrating to Cloudflare D1.

Local dev

- Install deps: npm install
- Seed (optional): place `inventory.csv` in the repo root and run `npm run migrate`
- Run dev server: `npm run dev`

Cloudflare D1 notes

Use the following SQL to create the tables in D1:

```sql
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  sku TEXT,
  name TEXT,
  description TEXT,
  price REAL,
  stock INTEGER,
  reorder_threshold INTEGER,
  created_at TEXT
);

CREATE TABLE history (
  id TEXT PRIMARY KEY,
  event_type TEXT,
  product_id TEXT,
  payload TEXT,
  created_at TEXT
);
```

When migrating you will need to implement the API routes using D1 bindings (example skeleton):

```js
// Example worker route
export default {
  async fetch(request, env){
    const res = await env.DB.prepare('SELECT * FROM products').all()
    return new Response(JSON.stringify({ products: res.results }))
  }
}
```

History and CSV exports

- The local API stores history events in the `history` table.
- The CSV migration script stores products into SQLite; for D1 you'll need to import CSV rows via a worker or run migration locally and then sync.
# My-Webiste