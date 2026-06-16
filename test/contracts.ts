import { expect } from "chai";
import { ethers } from "hardhat";

describe("BuyMeSomeTokens contracts", function () {
  it("relays an authorized registration and sends a tip", async function () {
    const [relayer, owner, tipper] = await ethers.getSigners();
    const registry = await ethers.deployContract("AgentRegistry");
    const tipJar = await ethers.deployContract("TipJar", [await registry.getAddress()]);
    const agentId = ethers.id("agt_test");
    const root = ethers.keccak256(ethers.toUtf8Bytes("profile"));
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    const network = await ethers.provider.getNetwork();
    const signature = await owner.signTypedData(
      { name: "BuyMeSomeTokens Registry", version: "1", chainId: network.chainId, verifyingContract: await registry.getAddress() },
      { Registration: [
        { name: "agentId", type: "bytes32" }, { name: "wallet", type: "address" },
        { name: "profileRootHash", type: "bytes32" }, { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ] },
      { agentId, wallet: owner.address, profileRootHash: root, nonce: 0, deadline },
    );
    await registry.connect(relayer).registerAgent(agentId, owner.address, root, 0, deadline, signature);
    await expect(registry.connect(relayer).registerAgent(agentId, owner.address, root, 0, deadline, signature))
      .to.be.revertedWithCustomError(registry, "AgentExists");
    const before = await ethers.provider.getBalance(owner.address);
    await expect(tipJar.connect(tipper).tip(owner.address, ethers.ZeroHash, { value: 100n }))
      .to.emit(tipJar, "Tipped").withArgs(tipper.address, owner.address, 100n, ethers.ZeroHash);
    expect(await ethers.provider.getBalance(owner.address)).to.equal(before + 100n);
  });

  it("rejects unregistered recipients", async function () {
    const [, owner, tipper] = await ethers.getSigners();
    const registry = await ethers.deployContract("AgentRegistry");
    const tipJar = await ethers.deployContract("TipJar", [await registry.getAddress()]);
    await expect(tipJar.connect(tipper).tip(owner.address, ethers.ZeroHash, { value: 1n }))
      .to.be.revertedWithCustomError(tipJar, "AgentNotActive");
  });
});
