const { ethers } = require("hardhat");

const TOKEN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const NFT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

async function main() {
  const [owner, alice, bob] = await ethers.getSigners();

  const token = await ethers.getContractAt("MyToken", TOKEN_ADDRESS);
  const nft = await ethers.getContractAt("MyNFT", NFT_ADDRESS);

  console.log("Owner:", owner.address);
  console.log("Alice:", alice.address);
  console.log("Bob:", bob.address);

  // ERC-20 tx #1: mint to owner
  let tx = await token.mint(owner.address, ethers.parseUnits("1000", 18));
  console.log("ERC20 mint tx:", tx.hash);
  await tx.wait();

  // ERC-20 tx #2: transfer to Alice
  tx = await token.transfer(alice.address, ethers.parseUnits("100", 18));
  console.log("ERC20 transfer tx:", tx.hash);
  await tx.wait();

  // ERC-20 tx #3: approve Alice
  tx = await token.approve(alice.address, ethers.parseUnits("50", 18));
  console.log("ERC20 approve tx:", tx.hash);
  await tx.wait();

  // ERC-20 tx #4: transferFrom by Alice to Bob
  tx = await token.connect(alice).transferFrom(owner.address, bob.address, ethers.parseUnits("20", 18));
  console.log("ERC20 transferFrom tx:", tx.hash);
  await tx.wait();

  // ERC-721: mint 3 NFTs with metadata
  const uris = [
    "ipfs://example/1.json",
    "ipfs://example/2.json",
    "ipfs://example/3.json",
  ];

  // NFT tx #1
  tx = await nft.mint(owner.address, uris[0]);
  console.log("NFT mint #1 tx:", tx.hash);
  await tx.wait();

  // NFT tx #2
  tx = await nft.mint(alice.address, uris[1]);
  console.log("NFT mint #2 tx:", tx.hash);
  await tx.wait();

  // NFT tx #3
  tx = await nft.mint(bob.address, uris[2]);
  console.log("NFT mint #3 tx:", tx.hash);
  await tx.wait();

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
