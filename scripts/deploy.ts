import { ethers } from "hardhat";
import { writeFile } from "node:fs/promises";

async function main() {
  const registry = await ethers.deployContract("AgentRegistry");
  await registry.waitForDeployment();
  const tipJar = await ethers.deployContract("TipJar", [await registry.getAddress()]);
  await tipJar.waitForDeployment();

  const deployment = {
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    registry: await registry.getAddress(),
    tipJar: await tipJar.getAddress(),
    deploymentBlock: await ethers.provider.getBlockNumber(),
  };
  await writeFile("deployment.json", `${JSON.stringify(deployment, null, 2)}\n`);
  console.log(deployment);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
