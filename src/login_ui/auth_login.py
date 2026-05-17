import os
import sys
from contextlib import closing
from typing import Dict, Sequence

import psycopg2
from psycopg2 import sql
from werkzeug.security import generate_password_hash, check_password_hash

ADMIN_TABLE = "admin"
USER_TABLE = "users"
LOG_TABLE = "logs"
VALID_TABLES = {ADMIN_TABLE, USER_TABLE}


def db_config() -> Dict[str, object]:
    return {
        "host": os.getenv("KIOSK_DB_HOST", "astraval.com"),
        "port": int(os.getenv("KIOSK_DB_PORT", "5432")),
        "user": os.getenv("KIOSK_DB_USER", "postgres"),
        "password": os.getenv("KIOSK_DB_PASSWORD", "root@IET25"),
        "dbname": os.getenv("KIOSK_DB_NAME", "EmpMan"),
    }


def hash_password(password: str) -> str:
    return generate_password_hash(password)


def get_connection():
    return psycopg2.connect(**db_config())


def initialize_db() -> None:
    with closing(get_connection()) as conn:
        with conn.cursor() as cur:
            cur.execute(
                f"""
                CREATE TABLE IF NOT EXISTS {ADMIN_TABLE} (
                    admin_id SERIAL PRIMARY KEY,
                    username VARCHAR(100) NOT NULL UNIQUE,
                    password_hash VARCHAR(255) NOT NULL,
                    company_name VARCHAR(150) NOT NULL DEFAULT '',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
            cur.execute(
                f"""
                CREATE TABLE IF NOT EXISTS {USER_TABLE} (
                    user_id SERIAL PRIMARY KEY,
                    username VARCHAR(100) NOT NULL UNIQUE,
                    password_hash VARCHAR(255) NOT NULL,
                    create_admin_id INT NOT NULL REFERENCES {ADMIN_TABLE}(admin_id) ON DELETE CASCADE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
            cur.execute(
                f"""
                CREATE TABLE IF NOT EXISTS {LOG_TABLE} (
                    log_id SERIAL PRIMARY KEY,
                    template VARCHAR(255) NOT NULL,
                    log TEXT NOT NULL,
                    log_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    user_id INT NOT NULL REFERENCES {USER_TABLE}(user_id) ON DELETE CASCADE
                )
                """
            )
        conn.commit()


def validate_login(table_name: str, username: str, password: str) -> bool:
    if table_name not in VALID_TABLES:
        return False
    if not username or not password:
        return False

    query = sql.SQL(
        """
        SELECT password_hash
        FROM {table}
        WHERE username = %s
        LIMIT 1
        """
    ).format(table=sql.Identifier(table_name))

    with closing(get_connection()) as conn:
        with conn.cursor() as cur:
            cur.execute(query, (username.strip(),))
            row = cur.fetchone()
            return row is not None and check_password_hash(row[0], password)


def create_user(admin_username: str, admin_password: str, username: str, password: str) -> bool:
    if not validate_login(ADMIN_TABLE, admin_username.strip(), admin_password):
        return False

    username = username.strip()
    if not username or not password:
        return False

    with closing(get_connection()) as conn:
        with conn.cursor() as cur:
            cur.execute(
                f"SELECT admin_id FROM {ADMIN_TABLE} WHERE username = %s LIMIT 1",
                (admin_username.strip(),),
            )
            row = cur.fetchone()
            if not row:
                return False

            cur.execute(
                f"""
                INSERT INTO {USER_TABLE} (username, password_hash, create_admin_id)
                VALUES (%s, %s, %s)
                ON CONFLICT (username) DO UPDATE
                    SET password_hash = EXCLUDED.password_hash,
                        create_admin_id = EXCLUDED.create_admin_id
                """,
                (username, hash_password(password), int(row[0])),
            )
        conn.commit()
    return True


def create_admin(username: str, password: str) -> bool:
    username = username.strip()
    if not username or not password:
        return False

    with closing(get_connection()) as conn:
        with conn.cursor() as cur:
            cur.execute(
                f"""
                INSERT INTO {ADMIN_TABLE} (username, password_hash)
                VALUES (%s, %s)
                ON CONFLICT (username) DO UPDATE
                    SET password_hash = EXCLUDED.password_hash
                """,
                (username, hash_password(password)),
            )
        conn.commit()
    return True


def usage() -> int:
    print("Usage:")
    print("  python auth_login.py <username> <password>  # user only (legacy mode)")
    print("  python auth_login.py user-auth <username> <password>")
    print("  python auth_login.py admin-auth <username> <password>")
    print("  python auth_login.py create-admin <username> <password>")
    print("  python auth_login.py create-user <admin_user> <admin_pass> <new_user> <new_pass>")
    return 2


def handle_args(args: Sequence[str]) -> int:
    if not args:
        return usage()

    if len(args) == 2:
        username, password = args
        ok = validate_login(USER_TABLE, username, password)
        print("AUTH_OK" if ok else "AUTH_FAIL: invalid user credentials")
        return 0 if ok else 1

    command = args[0].strip().lower()
    if command == "user-auth" and len(args) == 3:
        ok = validate_login(USER_TABLE, args[1], args[2])
        print("AUTH_OK" if ok else "AUTH_FAIL: invalid user credentials")
        return 0 if ok else 1

    if command == "admin-auth" and len(args) == 3:
        ok = validate_login(ADMIN_TABLE, args[1], args[2])
        print("AUTH_OK" if ok else "AUTH_FAIL: invalid admin credentials")
        return 0 if ok else 1

    if command == "create-admin" and len(args) == 3:
        ok = create_admin(args[1], args[2])
        print("ADMIN_CREATE_OK" if ok else "AUTH_FAIL: could not create admin")
        return 0 if ok else 1

    if command == "create-user" and len(args) == 5:
        ok = create_user(args[1], args[2], args[3], args[4])
        print("USER_CREATE_OK" if ok else "AUTH_FAIL: admin validation failed")
        return 0 if ok else 1

    return usage()


def main() -> int:
    try:
        initialize_db()
        return handle_args(sys.argv[1:])
    except ValueError as exc:
        print(f"AUTH_FAIL: invalid configuration ({exc})")
        return 1
    except psycopg2.Error as exc:
        detail = exc.pgerror or str(exc).splitlines()[0]
        print(f"AUTH_FAIL: database error ({detail})")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
