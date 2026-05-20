import ctypes
from datetime import datetime, timedelta
import os
import signal
import sys
import threading
import time
from contextlib import closing
from queue import Empty, Queue

import psutil
import psycopg2
import pytz
import win32gui
import win32process

USER_TABLE = "users"
LOG_TABLE = "logs"

ES_CONTINUOUS = 0x80000000
ES_SYSTEM_REQUIRED = 0x00000001
ES_DISPLAY_REQUIRED = 0x00000002
TRACK_INTERVAL_SECONDS = 3
INDIA_TZ = pytz.timezone("Asia/Kolkata")
ERROR_ALREADY_EXISTS = 183
READER_MUTEX_NAME = "Global\\AstravalEmpManReaderSingleton"


def get_db_config():
    return {
        "host": os.getenv("KIOSK_DB_HOST", "87.232.72.163"),
        "port": int(os.getenv("KIOSK_DB_PORT", "5432")),
        "user": os.getenv("KIOSK_DB_USER", "astraval"),
        "password": os.getenv("KIOSK_DB_PASSWORD", "root@as"),
        "dbname": os.getenv("KIOSK_DB_NAME", "astraval"),
    }


def get_connection():
    return psycopg2.connect(**get_db_config())


def get_current_indian_time(last_saved_time=None):
    current_time = datetime.now(INDIA_TZ).replace(microsecond=0)
    if last_saved_time is not None and current_time <= last_saved_time:
        current_time = last_saved_time + timedelta(seconds=1)
    return current_time


def _is_reader_process(proc):
    try:
        pid = proc.pid
        if pid == os.getpid():
            return False

        name = (proc.info.get("name") or "").lower()
        cmdline = " ".join(proc.info.get("cmdline") or []).lower()

        if name == "reader.exe":
            return True
        if "reader.py" in cmdline:
            return True
        return False
    except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
        return False


def terminate_duplicate_reader_processes():
    for proc in psutil.process_iter(["pid", "name", "cmdline"]):
        if not _is_reader_process(proc):
            continue
        try:
            proc.terminate()
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            continue


def acquire_single_instance():
    mutex = ctypes.windll.kernel32.CreateMutexW(None, False, READER_MUTEX_NAME)
    if not mutex:
        raise ctypes.WinError()

    if ctypes.windll.kernel32.GetLastError() == ERROR_ALREADY_EXISTS:
        terminate_duplicate_reader_processes()
        ctypes.windll.kernel32.CloseHandle(mutex)
        return None

    return mutex


class KioskMonitor:
    def __init__(self, username):
        self.username = username
        self.last_window = None
        self.last_saved_time = None
        self.stop_event = threading.Event()
        self.log_queue = Queue()
        self.cached_user_id = None

        self.init_db()

    def init_db(self):
        with closing(get_connection()) as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    f"""
                    CREATE TABLE IF NOT EXISTS {LOG_TABLE} (
                        log_id SERIAL PRIMARY KEY,
                        template VARCHAR(255) NOT NULL,
                        log TEXT NOT NULL,
                        log_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        user_id INT NOT NULL,
                        CONSTRAINT fk_user
                            FOREIGN KEY (user_id)
                            REFERENCES {USER_TABLE}(user_id)
                            ON DELETE CASCADE
                    )
                    """
                )
            conn.commit()

    def resolve_user_id(self, conn):
        if self.cached_user_id is not None:
            return self.cached_user_id

        with conn.cursor() as cursor:
            cursor.execute(
                f"SELECT user_id FROM {USER_TABLE} WHERE username = %s LIMIT 1",
                (self.username,),
            )
            row = cursor.fetchone()
            if not row:
                return None
            self.cached_user_id = int(row[0])
            return self.cached_user_id

    def enqueue_log(self, ts, activity, proc_name):
        self.log_queue.put((ts, activity, proc_name))

    def db_worker(self):
        try:
            with closing(get_connection()) as conn:
                while not self.stop_event.is_set() or not self.log_queue.empty():
                    try:
                        ts, activity, proc_name = self.log_queue.get(timeout=0.5)
                    except Empty:
                        continue

                    try:
                        user_id = self.resolve_user_id(conn)
                        if user_id is None:
                            continue

                        with conn.cursor() as cursor:
                            cursor.execute(
                                f"""
                                INSERT INTO {LOG_TABLE}
                                (template, log, log_time, user_id)
                                VALUES (%s, %s, %s, %s)
                                """,
                                (proc_name, activity, ts, user_id),
                            )
                        conn.commit()
                    finally:
                        self.log_queue.task_done()
        except Exception:
            # Keep monitor process alive even if DB worker fails unexpectedly.
            pass

    def prevent_sleep(self):
        while not self.stop_event.is_set():
            ctypes.windll.kernel32.SetThreadExecutionState(
                ES_CONTINUOUS | ES_SYSTEM_REQUIRED | ES_DISPLAY_REQUIRED
            )
            self.stop_event.wait(30)

        ctypes.windll.kernel32.SetThreadExecutionState(ES_CONTINUOUS)

    @staticmethod
    def get_process_name(hwnd):
        try:
            _, pid = win32process.GetWindowThreadProcessId(hwnd)
            proc = psutil.Process(pid)
            return proc.name()
        except Exception:
            return "Unknown"

    def track_window_once(self):
        hwnd = win32gui.GetForegroundWindow()
        title = win32gui.GetWindowText(hwnd)
        if not title or title == self.last_window:
            return

        now_ts = get_current_indian_time(self.last_saved_time)
        self.last_saved_time = now_ts
        proc_name = self.get_process_name(hwnd)
        self.enqueue_log(now_ts, title, proc_name)
        self.last_window = title

    def shutdown(self):
        self.stop_event.set()
        timeout_at = time.time() + 1.5
        while not self.log_queue.empty() and time.time() < timeout_at:
            time.sleep(0.05)

    def run(self):
        db_thread = threading.Thread(target=self.db_worker, daemon=True)
        sleep_thread = threading.Thread(target=self.prevent_sleep, daemon=True)
        db_thread.start()
        sleep_thread.start()

        try:
            while not self.stop_event.is_set():
                try:
                    self.track_window_once()
                except Exception:
                    pass
                self.stop_event.wait(TRACK_INTERVAL_SECONDS)
        finally:
            self.shutdown()


def resolve_username():
    if len(sys.argv) > 1 and str(sys.argv[1]).strip():
        return str(sys.argv[1]).strip()
    try:
        return os.getlogin()
    except Exception:
        return os.environ.get("USERNAME", "UnknownUser")


if __name__ == "__main__":
    instance_mutex = acquire_single_instance()
    if instance_mutex is None:
        sys.exit(0)

    monitor = KioskMonitor(resolve_username())

    def _stop_handler(*_args):
        monitor.stop_event.set()

    try:
        signal.signal(signal.SIGINT, _stop_handler)
        signal.signal(signal.SIGTERM, _stop_handler)
    except Exception:
        pass

    try:
        monitor.run()
    finally:
        ctypes.windll.kernel32.CloseHandle(instance_mutex)
