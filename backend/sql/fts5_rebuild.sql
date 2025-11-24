BEGIN;

DELETE FROM products_fts;

INSERT INTO products_fts(rowid, name, brand, category)
SELECT id, name, brand, category
FROM products;

COMMIT;
