# GenesysGo Premium RPC Authentication Node.js Example

This is an example setup that puts your authenticated Premium GenesysGo RPC endpoint behind a reverse proxy. This allows you to control where requests to your RPC come from without exposing your RPC's authentication tokens to your frontend users, thus protecting your premium resources.

The token is automatically fetched every 5 minutes and stored in a redis server that the NGINX proxy has access to read from.

# Reverse Proxy

There's an example NGINX `default.conf` in [nginx/default.conf](nginx/default.conf). This uses the [openresty nginx release](https://github.com/openresty/openresty) that has a Redis LUA module built in.

## Setup

You will want to update the line `set $endpoint "https://us-west-1.genesysgo.net/abc-123-def";` to be your premium RPC's url.

# Cron Server

There's a Node.js server in [server/](server/) running on a 5 minute interval to update the token that's stored in Redis.

The proxy & redis logic is located within the `/rpc` location block.

Note that in production, you should only need to update this token once every 24 hours unless you're exposing this token to the public and need to rotate it faster than that.

## Setup

1. Copy `server/.env.example` to `server/.env`
2. Update `WALLET_KEY` to the keypair file's value of the wallet that has access to generate authentication tokens for your Premium RPC. If you don't have this keypair file, you can convert your wallet's private key (exported from your wallet UI) into this format by following what's done in this script: [https://gist.github.com/tracy-codes/f17e7ed8acfdd1be442f632f5b80763c](https://gist.github.com/tracy-codes/f17e7ed8acfdd1be442f632f5b80763c)
3. Update `RPC_ID` to be the uuid at the end of your RPC's URL. For example, if your RPC's url ends in `/abc-123-456` then you'd set the value to `RPC_ID=abc-123-456`

# Running

1. Run `docker compose up` to build the containers and run the infrastructure.
2. You can now send any of your regular RPC requests to `http://localhost/rpc`. There's an example curl request in [example-proxy-authenticated-rpc-request.sh](example-proxy-authenticated-rpc-request.sh)

# Where to go from here

Since this is an example implementation, it's absolutely not 100% intended to use in a production environment yet.

You should:

1. Lock down your NGINX proxy to only allow requests from verified resources
2. Look into using other proxy solutions that may work for your specific infrastructure
3. Add a secondary wallet that's able to generate JWT tokens for your RPCs. This will allow you to use a wallet that has 0 assets and increase your operational security.
