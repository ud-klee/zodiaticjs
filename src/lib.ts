import {
  SigningCosmWasmClient,
  CosmWasmClient,
  ExecuteInstruction,
} from "@cosmjs/cosmwasm-stargate";
import { StdFee } from "@cosmjs/stargate";

import {
  Lunar,
  QueryMsg,
  ExecuteMsg,
  GetLunarResponse,
  FindLunarResponse,
  Predicate,
} from "./types";

export * from "./types";

export class ZodiaticClient {
  private readonly rpc: SigningCosmWasmClient | CosmWasmClient;
  private contractAddress: string;
  private fee: number | StdFee | "auto";

  constructor(rpc: SigningCosmWasmClient | CosmWasmClient) {
    this.rpc = rpc;
    this.contractAddress = "zodiatic1mf6ptkssddfmxvhdx0ech0k03ktp6kf9yk59renau2gvht3nq2gqpck9r7";
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

  async findLunar(year: number, predicates: Predicate[]) {
    const msg: Pick<QueryMsg, "find_lunar"> = {
      find_lunar: {
        year,
        predicates,
      },
    };
    return this.rpc.queryContractSmart(this.contractAddress, msg) as Promise<FindLunarResponse>;
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
    return this.signer.executeMultiple(creator, msgs, this.fee);
  }

  get signer(): SigningCosmWasmClient {
    if (this.rpc instanceof SigningCosmWasmClient) {
      return this.rpc;
    }
    throw new Error("no signer");
  }
}
