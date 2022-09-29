#!/bin/bash
curl --request POST \
  --url http://localhost/rpc \
  --header 'Content-Type: application/json' \
  --data '{
	"jsonrpc": "2.0",
	"id": 1,
	"method": "getBlockHeight"
}'