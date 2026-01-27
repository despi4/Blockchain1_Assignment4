# PART 2 — Smart Contract Testing & Validation

This project contains automated tests for ERC-20 and ERC-721 smart contracts using **Hardhat**, **Ethers.js**, and **Chai**.

## 📌 Goal

The goal of this part is to validate the correctness of previously developed smart contracts by writing unit tests that cover core functionality and revert conditions.

---

## 🧩 Contracts

The following contracts are tested:

### ERC-20
- **MyToken.sol**
- Minting (only owner)
- Transfers
- Approvals and allowances
- `transferFrom` logic
- Revert cases (zero balance, no allowance)

### ERC-721
- **MyNFT.sol**
- Successful minting
- Ownership checks
- Token URI retrieval
- Revert cases for non-existent tokens

---

## 🧪 Tests

Test files are located in the `test/` directory:

- `mytoken.test.cjs` — ERC-20 tests
- `mynft.test.cjs` — ERC-721 tests

Each test validates one specific behavior of the contract.

---

## ⚙️ Tools Used

- **Hardhat**
- **Ethers.js**
- **Chai**
- **OpenZeppelin Contracts**

---

## ▶️ How to Run Tests

Install dependencies:

```bash
npm install
npx hardhat test
```

## Project Structure

contracts/
 ├─ MyToken.sol
 └─ MyNFT.sol

test/
 ├─ mytoken.test.cjs
 └─ mynft.test.cjs

hardhat.config.cjs
