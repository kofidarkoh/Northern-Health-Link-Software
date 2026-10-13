from gevent import monkey
monkey.patch_all()

import errno
import os
import signal
import socket
import sys
import time
import logging
from app import create_app, socketio
from app.database import close_database

logger = logging.getLogger(__name__)

config_name = os.environ.get('FLASK_ENV', 'development')
app = create_app(config_name)


def shutdown_handler(signum, frame):
    logger.info("Received signal %s, shutting down gracefully...", signum)
    try:
        close_database()
    finally:
        try:
            socketio.stop()
        except Exception:
            pass
        logger.info("Shutdown complete")
        # sys.exit is required: without it gevent's serve_forever() simply
        # resumes after the handler returns and Ctrl+C appears to do nothing.
        sys.exit(0)


signal.signal(signal.SIGTERM, shutdown_handler)
signal.signal(signal.SIGINT, shutdown_handler)

def _probe_port_free(port):
    """True if nothing on this machine is bound to `port` (any interface)."""
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        s.bind(('0.0.0.0', port))
        return True
    except OSError as exc:
        if exc.errno in (errno.EADDRINUSE, errno.EACCES):
            return False
        raise
    finally:
        s.close()


def _stale_run_py_pids():
    """PIDs of *other* processes executing this backend's run.py (stragglers).

    Matches on parsed argv, not substrings: argv[0] must be a python binary
    and one of the script args must be exactly run.py. A substring check
    would also match the parent `bash -c '... python run.py ...'`
    wrapper and the backend would SIGKILL its own launcher (suicide).
    """
    me = os.getpid()
    found = []
    try:
        entries = os.listdir('/proc')
    except OSError:
        return found
    for entry in entries:
        if not entry.isdigit():
            continue
        pid = int(entry)
        if pid == me:
            continue
        try:
            with open('/proc/%d/cmdline' % pid, 'rb') as fh:
                raw = fh.read()
        except OSError:
            continue  # exited, or not ours to inspect
        parts = [p.decode('utf-8', 'replace') for p in raw.split(b'\0') if p]
        if not parts:
            continue  # kernel thread
        exe = os.path.basename(parts[0])
        if not (exe == 'python' or exe.startswith('python3') or exe.startswith('python2')):
            continue
        if not any(os.path.basename(a) == 'run.py' for a in parts[1:]):
            continue
        found.append(pid)
    return found


def reclaim_port(port, timeout=5.0):
    """SIGKILL stale instances of this backend holding `port`.

    Returns True once the port is bindable. Only ever kills processes
    whose cmdline shows them running run.py under python — never foreign
    processes (a foreign holder makes this return False).
    """
    if _probe_port_free(port):
        return True
    for pid in _stale_run_py_pids():
        logger.warning("Port %d busy — killing stale backend process (pid %d)", port, pid)
        try:
            os.kill(pid, signal.SIGKILL)
        except ProcessLookupError:
            continue
        except PermissionError:
            logger.error("Cannot kill pid %d: permission denied", pid)
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if _probe_port_free(port):
            return True
        time.sleep(0.2)
    return _probe_port_free(port)


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    # Self-healing start: a previous instance (Ctrl+C swallowed, terminal
    # closed, crash) often keeps holding the port and the next start dies
    # with EADDRINUSE deep inside gevent. Reclaim it automatically instead.
    if not reclaim_port(port):
        sys.exit(
            "Port %d is busy and held by a process that is NOT this backend "
            "(refusing to kill it). Find it with `ss -ltnp | grep ':%d'` "
            "then `kill -9 <PID>`, or start on another port with PORT=xxxx."
            % (port, port)
        )
    # NOTE: use_reloader must stay False with gevent + SocketIO. The reloader
    # forks a second process that inherits the Redis pub/sub socket, which
    # permanently breaks the SocketIO listen thread and spams
    # "Cannot receive from redis... retrying". Restart manually after edits.
    socketio.run(
        app,
        # Bind all interfaces in every env: Expo Go on a physical phone
        # reaches the backend via the PC's LAN IP, never via localhost.
        host='0.0.0.0',
        port=port,
        debug=config_name == 'development',
        use_reloader=False
    )
