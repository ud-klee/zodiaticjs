import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";

import { ZodiaticClient } from "../lib";

// Example: ts-node get_lunar.ts 20220101 20220131 ...

async function main() {
  const rpc = await CosmWasmClient.connect("http://127.0.0.1:26657");
  const client = new ZodiaticClient(rpc);

  const [, , ...dates] = process.argv;

  for (const yyyymmdd of dates) {
    const { lunar } = await client.getLunar(Number(yyyymmdd));
    console.log(lunar);
  }
}

main();
