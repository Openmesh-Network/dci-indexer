import { DCIReserveContract } from "../contracts/DCIReserve.js";
import { Waitlisted } from "../types/reserve.js";
import { Storage } from "../types/storage.js";
import { ContractWatcher } from "../utils/contract-watcher.js";

export function watchWaitlisted(contractWatcher: ContractWatcher, storage: Storage) {
  contractWatcher.startWatching("Waitlisted", {
    abi: DCIReserveContract.abi,
    address: DCIReserveContract.address,
    eventName: "Waitlisted",
    strict: true,
    onLogs: async (logs) => {
      await Promise.all(
        logs.map(async (log) => {
          const { args, blockNumber, transactionHash, transactionIndex } = log;

          const event = {
            blockNumber,
            transactionHash,
            transactionIndex,
            ...args,
          } as Waitlisted;

          await processWaitlisted(event, storage);
        })
      );
    },
  });
}

export async function processWaitlisted(event: Waitlisted, storage: Storage): Promise<void> {
  await storage.waitlisted.update((waitlisted) => {
    if (waitlisted.some((e) => e.transactionHash === event.transactionHash && e.transactionIndex === event.transactionIndex)) {
      return;
    }

    waitlisted.push(event);
  });
}
