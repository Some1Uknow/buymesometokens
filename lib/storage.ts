import "server-only";
import { ethers } from "ethers";
import { chain, relayerKey } from "@/lib/config";

async function withMutedStorageLogs<T>(work: () => Promise<T>): Promise<T> {
  if (process.env.OG_STORAGE_VERBOSE === "true") return work();
  const originalLog = console.log;
  console.log = (...args: unknown[]) => {
    const first = String(args[0] ?? "");
    if (
      first.includes("Starting upload") ||
      first.includes("Upload options") ||
      first.includes("First selected node status") ||
      first.includes("Selected nodes") ||
      first.includes("Using splitable upload") ||
      first.includes("File details") ||
      first.includes("Data prepared") ||
      first.includes("Attempting to find existing") ||
      first.includes("Submitting transaction") ||
      first.includes("Transaction submitted") ||
      first.includes("Wait for log entry") ||
      first.includes("Waiting for storage node") ||
      first.includes("Tasks created") ||
      first.includes("Processing tasks") ||
      first.includes("All tasks processed") ||
      first.includes("Single file upload completed")
    ) return;
    originalLog(...args);
  };
  try {
    return await work();
  } finally {
    console.log = originalLog;
  }
}

export async function uploadBytes(bytes: Uint8Array): Promise<{ rootHash: `0x${string}`; txHash: string }> {
  const { Indexer, MemData } = await import("@0gfoundation/0g-storage-ts-sdk");
  const data = new MemData(bytes);
  const [tree, treeError] = await data.merkleTree();
  if (treeError || !tree) throw treeError ?? new Error("Could not create 0G Merkle tree");

  const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
  const signer = new ethers.Wallet(relayerKey(), provider);
  const indexer = new Indexer(process.env.OG_STORAGE_INDEXER_RPC ?? "https://indexer-storage-testnet-turbo.0g.ai");
  const [tx, uploadError] = await withMutedStorageLogs(() => indexer.upload(data, chain.rpcUrl, signer));
  if (uploadError || !tx) throw uploadError ?? new Error("0G upload returned no transaction");
  return { rootHash: tree.rootHash() as `0x${string}`, txHash: String(tx) };
}

export async function uploadJson(value: unknown) {
  return uploadBytes(new TextEncoder().encode(JSON.stringify(value)));
}

export async function downloadBytes(rootHash: string): Promise<Uint8Array> {
  const indexer = process.env.OG_STORAGE_INDEXER_RPC ?? "https://indexer-storage-testnet-turbo.0g.ai";
  const response = await fetch(`${indexer}/file?root=${encodeURIComponent(rootHash)}`, { next: { revalidate: 3600 } });
  if (!response.ok) throw new Error(`0G download failed: ${response.status}`);
  return new Uint8Array(await response.arrayBuffer());
}
