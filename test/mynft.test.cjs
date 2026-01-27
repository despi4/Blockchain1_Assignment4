const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyNFT (ERC721)", function () {
  let nft;
  let owner, alice;

  beforeEach(async () => {
    [owner, alice] = await ethers.getSigners();

    const MyNFT = await ethers.getContractFactory("MyNFT");
    nft = await MyNFT.deploy();
    await nft.waitForDeployment();
  });

  it("Successful mint & ownership check", async () => {
    const uri = "ipfs://example/1.json";
    const tx = await nft.mint(alice.address, uri);
    const receipt = await tx.wait();

    const event = receipt.logs.find((l) => l.fragment?.name === "Transfer");
    const tokenId = event.args.tokenId;

    expect(await nft.ownerOf(tokenId)).to.equal(alice.address);
  });

  it("Ownership check fails for non-existent token", async () => {
    await expect(nft.ownerOf(999)).to.be.reverted;
  });

  it("tokenURI works for existing token", async () => {
    const uri = "ipfs://example/2.json";
    const tx = await nft.mint(owner.address, uri);
    const receipt = await tx.wait();

    const event = receipt.logs.find((l) => l.fragment?.name === "Transfer");
    const tokenId = event.args.tokenId;

    expect(await nft.tokenURI(tokenId)).to.equal(uri);
  });

  it("tokenURI reverts for non-existent token", async () => {
    await expect(nft.tokenURI(1234)).to.be.reverted;
  });
});
