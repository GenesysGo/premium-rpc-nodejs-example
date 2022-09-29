import dotenv from "dotenv";
dotenv.config();
import * as solana from "@solana/web3.js";
import nacl from "tweetnacl";
import bs58 from "bs58";
import fs from "fs";
async function main() {
  // Get wallet from local keypair file a keypair variable passed in
  const key = JSON.parse(
    fs.readFileSync("/path/to/your/wallet/keypair/file/id.json").toString()
  );
  const wallet = solana.Keypair.fromSecretKey(new Uint8Array(key));
  // Build and sign message
  const msg = new TextEncoder().encode(`Sign in to GenesysGo Shadow Platform.`);
  const message = bs58.encode(nacl.sign.detached(msg, wallet.secretKey));
  // Send auth request with wallet pubkey and signed message payload
  const authRequest = await fetch(`${process.env.API_URL_BASE}/signin`, {
    method: "POST",
    body: JSON.stringify({ message, signer: wallet.publicKey }),
  });
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
  // Get auth token from redis
  const token = authResponse.token;
  // Build solana connection object
  const connection = new solana.Connection(process.env.RPC_ENDPOINT as string, {
    commitment: "processed",
    httpHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
  const { blockhash } = await connection.getLatestBlockhash();
  console.log("Latest blockhash:", blockhash);
}

main();
