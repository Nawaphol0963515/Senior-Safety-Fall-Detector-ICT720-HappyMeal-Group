import time
import logging

from app.config import POLL_INTERVAL_SEC
from app.db import init_indexes
from app.worker import FallWorker

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)

def main():
    init_indexes()
    worker = FallWorker()

    logging.info("Fall model worker started")

    while True:
        count = worker.run_once()
        if count > 0:
            logging.info("Processed %s raw rows", count)
        time.sleep(POLL_INTERVAL_SEC)

if __name__ == "__main__":
    main()