# GenesysGo Premium RPC Authentication Node.js Example

This is an example setup that puts your authenticated Premium GenesysGo RPC endpoint behind a reverse proxy. This allows you to control where requests to your RPC come from without exposing your RPC's authentication tokens to your frontend users, thus protecting your premium resources.

> **Warning**
> This is not set up for production use. It's specifically configured to work on a local network. This Docker setup will also not deploy to a container engine like DigitalOcean's App Platform. You will need to modify this configuration to work for your desired production usage.

The token is automatically fetched every 5 minutes and stored in a redis server that the NGINX proxy has access to read from.



# Cron Server

There's a Node.js server in [server/](server/) running on a 5 minute interval to update the token that's stored in Redis.

The proxy & redis logic is located within the `/rpc` location block.

Note that in production, you should only need to update this token once every 24 hours unless you're exposing this token to the public and need to rotate it faster than that.

## Setup
-Deploy a virtual machine that has a public IP (or destination NAT) and confirm that ports 80 and 443 are open and reachable.
-Make sure that you have created a DNS A record that will resolve to the public IP address of your node.
-Then make sure you have Docker and docker-compose installed.
-Clone the repository `git clone repo_url`
-change into ssl directory `cd premium-rpc-nodejs-example/ssl`

Now the real work begins

1. Copy `server/.env.example` to `server/.env`
2. Edit the new .env file. Update `WALLET_KEY` to the keypair file's value of the wallet that has access to generate authentication tokens for your Premium RPC. If you don't have this keypair file, you can convert your wallet's private key (exported from your wallet UI) into this format by following what's done in this script: [https://gist.github.com/tracy-codes/f17e7ed8acfdd1be442f632f5b80763c](https://gist.github.com/tracy-codes/f17e7ed8acfdd1be442f632f5b80763c)
3. Update `RPC_ID` to be the uuid at the end of your RPC's URL. For example, if your RPC's url ends in `/abc-123-456` then you'd set the value to `RPC_ID=abc-123-456`. Save and close the file.
4. Copy `./nginx/default-1.conf` to `./nginx/default.conf`
5. Edit `./nginx/default.conf` to have the correct hostnames that you would like to secure wherever you see "knoxyproxy.juicystake.io"
6. Run `docker-compose build`
7. Run `docker-compose up -d`
8. Run `docker-compose run --rm  certbot certonly --webroot --webroot-path /var/www/certbot/ -d knoxyproxy.juicystake.io` and complete the dialog to receive certificates
9. Once that succeeds, run `docker-compose down`
10. Delete `./nginx/default.conf`
11. Run `sudo cp ./nginx/default-2.conf default.conf`
12. Edit the new default.conf file to have all of the correct URLs - do NOT forget to also make sure that your upstream endpoint is correct! (ie - us-west-1.genesysgo.net? or eu-west-1? etc etc)
13. Run docker-compose build
14. Run docker-compose up

# Running

1. Run `docker compose up` to build the containers and run the infrastructure.
2. You can now send any of your regular RPC requests to `https://my_domain.com/rpc`. There's an example curl request in [example-proxy-authenticated-rpc-request.sh](example-proxy-authenticated-rpc-request.sh)

# Where to go from here

Since this is an example implementation, it's absolutely not 100% intended to use in a production environment yet.

You should:

1. Lock down your NGINX proxy to only allow requests from verified resources
2. Look into using other proxy solutions that may work for your specific infrastructure
3. Add a secondary wallet that's able to generate JWT tokens for your RPCs. This will allow you to use a wallet that has 0 assets and increase your operational security.
