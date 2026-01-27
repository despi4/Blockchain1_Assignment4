const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyToken (ERC20)", function () {
  let token;
  let owner, alice, bob;

  beforeEach(async () => {
    [owner, alice, bob] = await ethers.getSigners();

    // 👇 ВАЖНО: MyToken
    const MyToken = await ethers.getContractFactory("MyToken");
    token = await MyToken.deploy();
    await token.waitForDeployment();
  });

  it("Minting: owner can mint tokens", async () => {
    const amount = ethers.parseUnits("100", 18);
    await token.mint(alice.address, amount);

    expect(await token.balanceOf(alice.address)).to.equal(amount);
    expect(await token.totalSupply()).to.equal(amount);
  });

  it("Minting: non-owner cannot mint", async () => {
    await expect(
      token.connect(alice).mint(alice.address, 1)
    ).to.be.reverted;
  });

  it("Transfer: works correctly", async () => {
    const mintAmount = ethers.parseUnits("50", 18);
    const sendAmount = ethers.parseUnits("10", 18);

    await token.mint(owner.address, mintAmount);
    await token.transfer(alice.address, sendAmount);

    expect(await token.balanceOf(alice.address)).to.equal(sendAmount);
  });

  it("Revert: transfer fails with zero balance", async () => {
    await expect(
      token.connect(alice).transfer(bob.address, 1)
    ).to.be.reverted;
  });

  it("Approval & allowance", async () => {
    const allowance = ethers.parseUnits("20", 18);

    await token.approve(alice.address, allowance);
    expect(await token.allowance(owner.address, alice.address))
      .to.equal(allowance);
  });

  it("transferFrom works and decreases allowance", async () => {
    const mintAmount = ethers.parseUnits("100", 18);
    const allowance = ethers.parseUnits("30", 18);
    const spend = ethers.parseUnits("10", 18);

    await token.mint(owner.address, mintAmount);
    await token.approve(alice.address, allowance);

    await token.connect(alice)
      .transferFrom(owner.address, bob.address, spend);

    expect(await token.balanceOf(bob.address)).to.equal(spend);
    expect(await token.allowance(owner.address, alice.address))
      .to.equal(allowance - spend);
  });
});
