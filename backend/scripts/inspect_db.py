import sqlite3
import json

DB_PATH = "lepax.db"


def get_tables(cursor):
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    return [row[0] for row in cursor.fetchall()]


def get_schema(cursor, table):
    cursor.execute(f"SELECT sql FROM sqlite_master WHERE name='{table}';")
    row = cursor.fetchone()
    return row[0] if row else None


def get_indexes(cursor, table):
    cursor.execute(f"PRAGMA index_list('{table}');")
    indexes = cursor.fetchall()
    results = []
    for idx in indexes:
        idx_name = idx[1]
        cursor.execute(f"PRAGMA index_info('{idx_name}');")
        columns = [r[2] for r in cursor.fetchall()]
        results.append({"name": idx_name, "columns": columns})
    return results


def main():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    tables = get_tables(cursor)
    print("\n=== TABLES ===")
    print(tables)

    print("\n=== SCHEMAS ===")
    for t in tables:
        print(f"\n-- {t} --")
        print(get_schema(cursor, t))

    print("\n=== INDEXES ===")
    for t in tables:
        print(f"\n-- {t} --")
        print(json.dumps(get_indexes(cursor, t), indent=2))

    conn.close()


if __name__ == "__main__":
    main()
