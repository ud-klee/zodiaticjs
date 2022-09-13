import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";

import { ZodiaticClient } from "../lib";

// Example: ts-node find_lunar.ts {宜|忌} 開市 嫁娶 ...

async function main() {
  const rpc = await CosmWasmClient.connect("http://127.0.0.1:26657");
  const client = new ZodiaticClient(rpc);

  const [, , good_bad, ...conditions] = process.argv;

  if (!["宜", "忌"].includes(good_bad)) {
    console.log(`ERROR: First argument must be {宜|忌}`);
    return;
  }

  const field = good_bad === "宜" ? "good_for" : "bad_for";
  const predicate = toPredicate(conditions.map((value) => ({ field, value })));
  const res = await client.findLunar(2022, [predicate]);
  console.log(res.result);
}

function toPredicate(conditions: { field: string; value: string }[]) {
  return {
    and: conditions.map(({ field, value }) => [field, value] as [string, string]),
  };
}

main();
