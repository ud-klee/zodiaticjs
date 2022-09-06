import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { GasPrice } from "@cosmjs/stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import fs from "fs";

import { ZodiaticClient, Lunar } from "../lib";

type DataRow = Record<string, unknown>;

// Example: ts-node create_lunar.ts 202201.json 2022-01-01 2022-01-31 ...

// Note: Set wallet mnemonic in MNEMONIC env var before running.

async function main() {
  const signer = await DirectSecp256k1HdWallet.fromMnemonic(process.env.MNEMONIC || "", {
    prefix: "zodiatic",
  });
  const rpc = await SigningCosmWasmClient.connectWithSigner("http://127.0.0.1:26657", signer, {
    gasPrice: GasPrice.fromString("0.001uzodx"),
  });
  const client = new ZodiaticClient(rpc);

  const [, , filename, ...dates] = process.argv;
  const table: DataRow[] = JSON.parse(fs.readFileSync(filename, { encoding: "utf-8" }));
  const lunars = table
    .filter((row) => dates.includes(`${row["日期"]}`))
    .map(mapper)
    .reduce((result, row) => {
      let match = row.date.match(/^(\d+)-(\d+)-(\d+)$/);
      if (match) {
        const [, y, m, d] = match;
        return [...result, [Number(`${y}${m}${d}`), row] as [number, Lunar]];
      }
      return result;
    }, [] as [number, Lunar][]);

  const creator = await signer.getAccounts();

  if (lunars.length === 1) {
    try {
      const [yyyymmdd, lunar] = lunars[0];
      console.log(`|  lunar ${yyyymmdd}`);
      const res = await client.createLunar(creator[0].address, yyyymmdd, lunar);
      console.log(`| txHash ${res.transactionHash}`);
      console.log(`|    gas ${res.gasWanted}/${res.gasUsed} (wanted/used)`);
    } catch (err) {
      console.log(`ERROR createLunar: ${(err as Error).message}`);
    }
  } else if (lunars.length > 1) {
    try {
      console.log(`|  lunar ${lunars.map(([ymd]) => ymd)}`);
      const res = await client.createLunars(creator[0].address, lunars);
      console.log(`| txHash ${res.transactionHash}`);
      console.log(`|    gas ${res.gasWanted}/${res.gasUsed} (wanted/used)`);
    } catch (err) {
      console.log(`ERROR createLunars: ${(err as Error).message}`);
    }
  } else {
    console.log("nothing to do");
  }
}

function mapper(row: DataRow): Lunar {
  return {
    date: `${row["日期"]}`,
    lunar_number: (row["農曆數字"] as number[]).slice(0, 3),
    lunar: `${row["農曆"]}`,
    eight_words: `${row["八字"]}`,
    god_direction: (row["吉神方位"] as string[]).join(" "),
    good_for: (row["宜"] as string[]).join(" "),
    bad_for: (row["忌"] as string[]).join(" "),
  };
}

main();
