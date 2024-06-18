import { User } from "./user.js";
import { Address } from "viem";
import { PersistentJson } from "../utils/persistent-json.js";
import { Reserved, Waitlisted } from "./reserve.js";

export type ReservedStorage = Reserved[];
export type WaitlistedStorage = Waitlisted[];
export interface UsersStorage {
  [address: Address]: User;
}

export interface Storage {
  reserved: PersistentJson<ReservedStorage>;
  waitlisted: PersistentJson<WaitlistedStorage>;
  users: PersistentJson<UsersStorage>;
}
