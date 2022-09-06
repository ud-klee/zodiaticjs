import {
  SigningCosmWasmClient,
  CosmWasmClient,
  ExecuteResult,
  MsgExecuteContractEncodeObject,
} from "@cosmjs/cosmwasm-stargate";
import { StdFee, isDeliverTxFailure, logs } from "@cosmjs/stargate";
import { MsgExecuteContract } from "cosmjs-types/cosmwasm/wasm/v1/tx";
import { toUtf8 } from "@cosmjs/encoding";

import { Lunar, QueryMsg, ExecuteMsg, GetLunarResponse } from "./types";

export * from "./types";

export class ZodiaticClient {
  private readonly rpc: SigningCosmWasmClient | CosmWasmClient;
  private contractAddress: string;
  private fee: number | StdFee | "auto";

  constructor(rpc: SigningCosmWasmClient | CosmWasmClient) {
    this.rpc = rpc;
    this.contractAddress = "zodiatic1wug8sewp6cedgkmrmvhl3lf3tulagm9hnvy8p0rppz9yjw0g4wtqqerl82";
    this.fee = 1.3;
  }

  setContractAddress(contractAddress: string): ZodiaticClient {
    this.contractAddress = contractAddress;
    return this;
  }

  setFee(fee: number | StdFee | "auto"): ZodiaticClient {
    this.fee = fee;
    return this;
  }

  async getLunar(yyyymmdd: number) {
    const msg: Pick<QueryMsg, "get_lunar"> = {
      get_lunar: {
        yyyymmdd,
      },
    };
    return this.rpc.queryContractSmart(this.contractAddress, msg) as Promise<GetLunarResponse>;
  }

  async createLunar(creator: string, yyyymmdd: number, lunar: Lunar) {
    const msg: Pick<ExecuteMsg, "create_lunar"> = {
      create_lunar: {
        yyyymmdd,
        lunar,
      },
    };
    return this.signer.execute(creator, this.contractAddress, msg, this.fee);
  }

  async createLunars(creator: string, lunars: [number, Lunar][]) {
    const msgs: ExecuteInstruction[] = lunars.map(([yyyymmdd, lunar]) => ({
      contractAddress: this.contractAddress,
      msg: {
        create_lunar: {
          yyyymmdd,
          lunar,
        },
      } as Pick<ExecuteMsg, "create_lunar">,
    }));
    return executeMultiple(this.signer, creator, msgs, this.fee);
  }

  get signer(): SigningCosmWasmClient {
    if (this.rpc instanceof SigningCosmWasmClient) {
      return this.rpc;
    }
    throw new Error("no signer");
  }
}

// TODO Below is borrowed from CosmJS 0.29-alpha branch and should be removed
// when it is released.

type ExecuteInstruction = {
  contractAddress: string;
  msg: Record<string, unknown>;
};

async function executeMultiple(
  signer: SigningCosmWasmClient,
  senderAddress: string,
  instructions: readonly ExecuteInstruction[],
  fee: number | StdFee | "auto"
): Promise<ExecuteResult> {
  const msgs: MsgExecuteContractEncodeObject[] = instructions.map((i) => ({
    typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
    value: MsgExecuteContract.fromPartial({
      sender: senderAddress,
      contract: i.contractAddress,
      msg: toUtf8(JSON.stringify(i.msg)),
    }),
  }));
  const result = await signer.signAndBroadcast(senderAddress, msgs, fee);
  if (isDeliverTxFailure(result)) {
    throw new Error(
      `Error when broadcasting tx ${result.transactionHash} at height ${result.height}. Code: ${result.code}; Raw log: ${result.rawLog}`
    );
  }
  return {
    logs: logs.parseRawLog(result.rawLog),
    height: result.height,
    transactionHash: result.transactionHash,
    gasWanted: result.gasWanted,
    gasUsed: result.gasUsed,
  };
}
