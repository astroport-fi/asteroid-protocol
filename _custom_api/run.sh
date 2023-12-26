#!/bin/sh
LOG_LEVEL=debug \
LOG_FORMAT=text \
SERVICE_NAME=api \
CHAIN_ID="gaialocal-1" \
DATABASE_DSN="insc:ThisIsMeteorInscriptionsNetwork@tcp(127.0.0.1)/inscriptions?charset=utf8mb4&parseTime=True" \
LCD_ENDPOINT="http://127.0.0.1:8665/chain/gaia/lcd" \
BLOCK_POLL_INTERVAL_SECONDS=200 \
./api