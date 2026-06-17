import { getAddress, type Address } from "viem";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export const chain = {
  id: Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 16602),
  name: process.env.NEXT_PUBLIC_CHAIN_NAME ?? "0G Galileo Testnet",
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL ?? "https://evmrpc-testnet.0g.ai",
  explorerUrl: process.env.NEXT_PUBLIC_EXPLORER_URL ?? "https://chainscan-galileo.0g.ai",
  nativeCurrency: { name: "0G", symbol: "OG", decimals: 18 },
} as const;

export function registryAddress(): Address {
  const value = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS;
  if (!value) throw new Error("NEXT_PUBLIC_REGISTRY_ADDRESS is required");
  return getAddress(value);
}

export function tipJarAddress(): Address {
  const value = process.env.NEXT_PUBLIC_TIP_JAR_ADDRESS;
  if (!value) throw new Error("NEXT_PUBLIC_TIP_JAR_ADDRESS is required");
  return getAddress(value);
}

export function relayerKey(): `0x${string}` {
  const value = required("RELAYER_PRIVATE_KEY");
  if (!/^0x[0-9a-fA-F]{64}$/.test(value)) throw new Error("RELAYER_PRIVATE_KEY must be a 32-byte hex key");
  return value as `0x${string}`;
}
