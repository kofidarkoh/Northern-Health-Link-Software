import os
import sys
import logging
import logging.handlers
import json
from datetime import datetime, timezone


class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_entry = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
        }
        if record.exc_info and record.exc_info[0]:
            log_entry['exception'] = self.formatException(record.exc_info)
        if hasattr(record, 'request_id'):
            log_entry['request_id'] = record.request_id
        return json.dumps(log_entry)


class ConsoleFormatter(logging.Formatter):
    """Human-readable single-line format for terminal output."""

    COLORS = {
        'DEBUG': '\x1b[36m',    # cyan
        'INFO': '\x1b[32m',     # green
        'WARNING': '\x1b[33m',  # yellow
        'ERROR': '\x1b[31m',    # red
        'CRITICAL': '\x1b[41m',  # red background
    }
    RESET = '\x1b[0m'

    def __init__(self):
        super().__init__(
            fmt='%(asctime)s | %(levelname)-5s | %(name)s | %(message)s',
            datefmt='%H:%M:%S',
        )
        self._use_color = sys.stdout.isatty() and os.environ.get('NO_COLOR') is None

    def format(self, record):
        formatted = super().format(record)
        if self._use_color and record.levelname in self.COLORS:
            color = self.COLORS[record.levelname]
            formatted = formatted.replace(
                record.levelname, f'{color}{record.levelname}{self.RESET}', 1
            )
        return formatted


def setup_logging(app_name='nhls'):
    log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'logs')
    os.makedirs(log_dir, exist_ok=True)

    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)

    if root_logger.handlers:
        root_logger.handlers.clear()

    json_formatter = JSONFormatter()

    file_handler = logging.handlers.TimedRotatingFileHandler(
        os.path.join(log_dir, f'{app_name}.log'),
        when='midnight',
        interval=1,
        backupCount=30,
        encoding='utf-8'
    )
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(json_formatter)
    root_logger.addHandler(file_handler)

    error_handler = logging.handlers.TimedRotatingFileHandler(
        os.path.join(log_dir, f'{app_name}-error.log'),
        when='midnight',
        interval=1,
        backupCount=90,
        encoding='utf-8'
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(json_formatter)
    root_logger.addHandler(error_handler)

    console_handler = logging.StreamHandler(sys.stdout)
    console_level = os.environ.get('LOG_LEVEL', 'INFO').upper()
    console_handler.setLevel(getattr(logging, console_level, logging.INFO))
    console_handler.setFormatter(ConsoleFormatter())
    root_logger.addHandler(console_handler)

    for noisy in ('peewee', 'werkzeug', 'flask_cors', 'socketio', 'engineio', 'gevent'):
        logging.getLogger(noisy).setLevel(logging.WARNING)
