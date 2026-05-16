import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";
import { parseEther } from "viem";

function norm(address: string) {
  return address.toLowerCase();
}

describe("Hallmark (local)", async function () {
  const { viem } = await network.create();
  const publicClient = await viem.getPublicClient();
  const [owner, verifier, buyer] = await viem.getWalletClients();

  if (owner === undefined || verifier === undefined || buyer === undefined) {
    throw new Error("Expected Hardhat to provide at least 3 test accounts");
  }

  it("register → requestVerification → verify → transferWithValue → dispute", async function () {
    const hallmark = await viem.deployContract("Hallmark");

    // -----------------------------
    // 1) registerAsset()
    // -----------------------------
    const tokenId = await hallmark.read.nextTokenId(); // first token is 1

    await owner.writeContract({
      address: hallmark.address,
      abi: hallmark.abi,
      functionName: "registerAsset",
      args: [
        "Rolex Daytona",
        "Rolex",
        "SN-123456",
        "Watch",
        "ipfs://example-metadata",
        50_000n,
      ],
    });

    assert.equal(await hallmark.read.balanceOf([owner.account.address]), 1n);
    assert.equal(norm(await hallmark.read.ownerOf([tokenId])), norm(owner.account.address));

    const [asset, statusAfterRegister, currentOwnerAfterRegister] = (await hallmark.read.getAsset([
      tokenId,
    ])) as any;

    assert.equal(norm(currentOwnerAfterRegister), norm(owner.account.address));
    assert.equal(statusAfterRegister, 0); // Status.REGISTERED
    assert.equal(asset.assetName, "Rolex Daytona");
    assert.equal(asset.brand, "Rolex");
    assert.equal(asset.serialNumber, "SN-123456");
    assert.equal(asset.assetType, "Watch");
    assert.equal(asset.metadataURI, "ipfs://example-metadata");
    assert.equal(asset.estimatedValue, 50_000n);
    assert.equal(norm(asset.registeredBy), norm(owner.account.address));
    assert.ok(asset.registeredAt > 0n);

    // -----------------------------
    // 2) requestVerification()
    // -----------------------------
    const bounty = parseEther("0.1");

    await owner.writeContract({
      address: hallmark.address,
      abi: hallmark.abi,
      functionName: "requestVerification",
      args: [tokenId, bounty],
      value: bounty,
    });

    const [statusAfterRequest, requestAfterRequest] = (await hallmark.read.getVerification([
      tokenId,
    ])) as any;

    // Still REGISTERED until a verifier submits a verdict
    assert.equal(statusAfterRequest, 0);
    assert.equal(requestAfterRequest.active, true);
    assert.equal(requestAfterRequest.bounty, bounty);

    // -----------------------------
    // 3) verifyAsset()
    // -----------------------------
    const stake = parseEther("0.2");

    await verifier.writeContract({
      address: hallmark.address,
      abi: hallmark.abi,
      functionName: "verifyAsset",
      // Verdict.VERIFIED = 0
      args: [tokenId, 0],
      value: stake,
    });

    const [statusAfterVerify, _requestAfterVerify, recordsAfterVerify] =
      (await hallmark.read.getVerification([tokenId])) as any;

    assert.equal(statusAfterVerify, 1); // Status.VERIFIED
    assert.equal(recordsAfterVerify.length, 1);
    assert.equal(norm(recordsAfterVerify[0].verifier), norm(verifier.account.address));
    assert.equal(recordsAfterVerify[0].stake, stake);

    // -----------------------------
    // 4) transferFromWithValue()
    // -----------------------------
    const saleValue = parseEther("1.5");

    await owner.writeContract({
      address: hallmark.address,
      abi: hallmark.abi,
      functionName: "transferFromWithValue",
      args: [owner.account.address, buyer.account.address, tokenId, saleValue],
    });

    assert.equal(norm(await hallmark.read.ownerOf([tokenId])), norm(buyer.account.address));

    const history = (await hallmark.read.getHistory([tokenId])) as any[];
    assert.ok(history.length >= 2);

    const lastEntry = history[history.length - 1];
    assert.equal(lastEntry.action, "SOLD");
    assert.equal(norm(lastEntry.from), norm(owner.account.address));
    assert.equal(norm(lastEntry.to), norm(buyer.account.address));
    assert.equal(lastEntry.value, saleValue);

    // -----------------------------
    // 5) openDispute()
    // -----------------------------
    const deposit = await hallmark.read.DISPUTE_DEPOSIT();

    await buyer.writeContract({
      address: hallmark.address,
      abi: hallmark.abi,
      functionName: "openDispute",
      args: [tokenId],
      value: deposit,
    });

    const [dispute] = (await hallmark.read.getDispute([tokenId])) as any;
    assert.equal(dispute.active, true);
    assert.equal(norm(dispute.opener), norm(buyer.account.address));

    // (optional sanity) status should now be DISPUTED
    const [_asset2, statusAfterDispute] = (await hallmark.read.getAsset([tokenId])) as any;
    assert.equal(statusAfterDispute, 3); // Status.DISPUTED

    // Just to show we're using the local chain
    const chainId = await publicClient.getChainId();
    assert.ok(chainId > 0);
  });
});
