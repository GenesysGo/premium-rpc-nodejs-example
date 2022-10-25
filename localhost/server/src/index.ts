import dotenv from "dotenv";
dotenv.config();
import * as solana from "@solana/web3.js";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { createClient } from "redis";
import fetch from "node-fetch";

async function main() {
  console.log("Starting...");
  const client = createClient({
    url: "redis://redis",
    password: process.env.REDIS_PASSWORD,
  });
  await client.connect();
  console.log("Connected to redis...");
  // Get wallet from local keypair file a keypair variable passed in
  // const key = JSON.parse(
  //   fs.readFileSync("/path/to/your/wallet/keypair/file/id.json").toString()
  // );
  const key = JSON.parse(process.env.WALLET_KEY as string);
  const wallet = solana.Keypair.fromSecretKey(new Uint8Array(key));
  console.log("Read wallet ", wallet.publicKey.toString());
  // Build and sign message
  const msg = new TextEncoder().encode(`Sign in to GenesysGo Shadow Platform.`);
  const message = bs58.encode(nacl.sign.detached(msg, wallet.secretKey));
  // Send auth request with wallet pubkey and signed message payload
  console.log("Sending auth request", process.env.API_URL_BASE);
  let body = {
    message,
    signer: wallet.publicKey.toString(),
  };
  console.log({ body });
  const authRequest = await fetch(`${process.env.API_URL_BASE}/signin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  console.log("Validating auth request");
  // Validate that the request is ok
  if (!authRequest.ok || authRequest.status !== 200) {
    console.error("Error occurred:", authRequest.status);
    return;
  }
  // Convert response into json
  const authResponse = await authRequest.json();
  // Validate that a token is in the response body
  if (typeof authResponse?.token !== "string") {
    console.log("No valid auth token returned.");
    return;
  }
  console.log(authResponse);
  // Get JWT Auth Token
  // const token = authResponse.token;
  const tokenRequest = await fetch(
    `${process.env.API_URL_BASE}/premium/token/${process.env.RPC_ID}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authResponse.token}`,
        "Content-Type": "application/json",
      },
    }
  );
  if (!tokenRequest.ok || tokenRequest.status !== 200) {
    console.error("Error occurred:", tokenRequest.status);
    return;
  }
  // Convert response to json
  const tokenResponse = await tokenRequest.json();
  if (typeof tokenResponse?.token !== "string") {
    console.log("No valid jwt token returned");
    return;
  }
  // Send token to Redis
  client.set("RPC_TOKEN", tokenResponse.token);
  console.log("Set RPC_TOKEN to", tokenResponse.token);
}

main();
// Update token every 5 minutes
// In production, you should only have to refresh this token every 24 hours.
const INTERVAL = 300_000;
setInterval(() => main(), INTERVAL);
