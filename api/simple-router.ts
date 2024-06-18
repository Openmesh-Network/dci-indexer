import { Express, Response, json } from "express";
import { isAddress } from "viem";

import { Storage } from "../types/storage.js";
import { createUserIfNotExists } from "../event-watchers/userHelpers.js";
import { publicClients } from "../utils/chain-cache.js";
import { normalizeAddress } from "../utils/normalize-address.js";

function malformedRequest(res: Response, error: string): void {
  res.statusCode = 400;
  res.end(error);
}

export function registerRoutes(app: Express, storage: Storage) {
  const basePath = "/indexer/";
  app.use(json());

  // Get single user
  app.get(basePath + "reserved", async function (req, res) {
    const reserved = await storage.reserved.get();

    res.end(JSON.stringify(reserved));
  });

  // Get single user
  app.get(basePath + "waitlisted", async function (req, res) {
    const waitlisted = await storage.waitlisted.get();

    res.end(JSON.stringify(waitlisted));
  });

  // Get single user
  app.get(basePath + "user/:address", async function (req, res) {
    const address = req.params.address;
    if (!isAddress(address)) {
      return malformedRequest(res, "address is not a valid address");
    }

    const users = await storage.users.get();
    const user = users[normalizeAddress(address)];

    if (!user) {
      res.statusCode = 404;
      return res.end("User not found");
    }

    res.end(JSON.stringify(user));
  });

  // Update the metadata of a user
  app.post(basePath + "setMetadata", async function (req, res) {
    try {
      const account = req.body.account;
      const metadata = req.body.metadata;
      const signature = req.body.signature;
      const valid = await Promise.all(
        Object.values(publicClients).map((publicClient) =>
          publicClient.verifyMessage({ address: account, message: `DCI metadata: ${metadata}`, signature: signature })
        )
      );
      if (!valid.some((b) => b)) {
        // No single chain that approved this signature
        return malformedRequest(res, "signature is not valid");
      }

      await storage.users.update((users) => {
        const address = normalizeAddress(account);
        createUserIfNotExists(users, address);
        users[address].metadata = JSON.parse(metadata);
      });
      res.end(JSON.stringify({ success: true }));
    } catch (error: any) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: error?.message ?? "Unknown error" }));
    }
  });
}
