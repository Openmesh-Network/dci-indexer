import { DCIReserveContract } from "../contracts/DCIReserve.js";
import { Reserved } from "../types/reserve.js";
import { Storage } from "../types/storage.js";
import { ContractWatcher } from "../utils/contract-watcher.js";

export function watchReserved(contractWatcher: ContractWatcher, storage: Storage) {
  contractWatcher.startWatching("Reserved", {
    abi: DCIReserveContract.abi,
    address: DCIReserveContract.address,
    eventName: "Reserved",
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
          } as Reserved;

          await processReserved(event, storage);
        })
      );
    },
  });
}

export async function processReserved(event: Reserved, storage: Storage): Promise<void> {
  await storage.reserved.update((reserved) => {
    if (reserved.some((e) => e.transactionHash === event.transactionHash && e.transactionIndex === event.transactionIndex)) {
      return;
    }

    reserved.push(event);
  });
}
