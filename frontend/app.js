import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.16.0/+esm";

// =========================
// 1) CONFIG: paste addresses
// =========================
const MYTOKEN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const MYNFT_ADDRESS   = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

// Minimal ABIs (only what we need)
const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

const ERC721_ABI = [
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
];

// =========================
// 2) UI helpers
// =========================
const $ = (id) => document.getElementById(id);

function ok(msg) {
  $("logOk").textContent = msg;
  $("logErr").textContent = "";
}

function err(e) {
  $("logOk").textContent = "";
  $("logErr").textContent = (e?.stack || e?.message || String(e));
}

// =========================
// 3) Global state
// =========================
let browserProvider;
let signer;
let userAddress;

let tokenRead;   // read-only contract
let tokenWrite;  // signer contract

let nftRead;
let nftWrite;

// =========================
// 4) MetaMask connect
// =========================
async function connect() {
  try {
    if (!window.ethereum) throw new Error("MetaMask not found. Install MetaMask first.");

    browserProvider = new ethers.BrowserProvider(window.ethereum);
    await browserProvider.send("eth_requestAccounts", []);
    signer = await browserProvider.getSigner();
    userAddress = await signer.getAddress();

    const net = await browserProvider.getNetwork();

    $("walletStatus").textContent = "Connected";
    $("walletAddress").textContent = userAddress;
    $("chainId").textContent = String(net.chainId);

    // Validate addresses
    if (!ethers.isAddress(MYTOKEN_ADDRESS) || !ethers.isAddress(MYNFT_ADDRESS)) {
      throw new Error("Set MYTOKEN_ADDRESS and MYNFT_ADDRESS in app.js to real 0x... addresses.");
    }

    $("tokenAddressLabel").textContent = MYTOKEN_ADDRESS;
    $("nftAddressLabel").textContent = MYNFT_ADDRESS;

    tokenRead = new ethers.Contract(MYTOKEN_ADDRESS, ERC20_ABI, browserProvider);
    tokenWrite = new ethers.Contract(MYTOKEN_ADDRESS, ERC20_ABI, signer);

    nftRead = new ethers.Contract(MYNFT_ADDRESS, ERC721_ABI, browserProvider);
    nftWrite = new ethers.Contract(MYNFT_ADDRESS, ERC721_ABI, signer);

    ok("Connected. You can now load token info and interact.");
  } catch (e) {
    err(e);
  }
}

// =========================
// 5) ERC-20: name/symbol/balance + transfer
// =========================
async function loadTokenInfoAndBalance() {
  try {
    if (!tokenRead || !userAddress) throw new Error("Connect wallet first.");

    const [name, symbol, decimals, bal] = await Promise.all([
      tokenRead.name(),
      tokenRead.symbol(),
      tokenRead.decimals(),
      tokenRead.balanceOf(userAddress),
    ]);

    $("tokenName").textContent = name;
    $("tokenSymbol").textContent = symbol;
    $("tokenBalance").textContent = ethers.formatUnits(bal, decimals);

    ok("Token info loaded.");
  } catch (e) {
    err(e);
  }
}

async function doTransfer() {
  try {
    if (!tokenWrite || !userAddress) throw new Error("Connect wallet first.");

    const to = $("toAddress").value.trim();
    const amountStr = $("amount").value.trim();

    if (!ethers.isAddress(to)) throw new Error("Recipient address is invalid.");
    if (!amountStr) throw new Error("Enter amount.");

    const decimals = await tokenRead.decimals();
    const amount = ethers.parseUnits(amountStr, decimals);

    $("txHash").textContent = "-";
    $("txResult").textContent = "Sending transaction...";

    const tx = await tokenWrite.transfer(to, amount);
    $("txHash").textContent = tx.hash;

    const receipt = await tx.wait();
    $("txResult").textContent = `Confirmed in block ${receipt.blockNumber}`;

    // refresh balance
    await loadTokenInfoAndBalance();

    ok("Transfer successful.");
  } catch (e) {
    err(e);
  }
}

// =========================
// 6) ERC-721: ownership, tokenURI, metadata, list minted tokens
// =========================
async function checkToken() {
  try {
    if (!nftRead) throw new Error("Connect wallet first.");

    const tokenIdStr = $("tokenIdInput").value.trim();
    if (!tokenIdStr) throw new Error("Enter tokenId.");

    const tokenId = BigInt(tokenIdStr);

    const [owner, uri] = await Promise.all([
      nftRead.ownerOf(tokenId),
      nftRead.tokenURI(tokenId),
    ]);

    $("nftOwner").textContent = owner;
    $("nftTokenURI").textContent = uri;

    ok("Token data loaded.");
  } catch (e) {
    err(e);
  }
}

function normalizeIpfs(uri) {
  // If tokenURI is like ipfs://CID/metadata.json
  if (uri.startsWith("ipfs://")) {
    return "https://ipfs.io/ipfs/" + uri.slice("ipfs://".length);
  }
  return uri;
}

async function loadMetadata() {
  try {
    const uri = $("nftTokenURI").textContent;
    if (!uri || uri === "-") throw new Error("First load tokenURI (Check token).");

    const url = normalizeIpfs(uri);

    $("metadataBox").textContent = "Loading metadata...";
    $("imageBox").innerHTML = "";

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Metadata fetch failed: ${res.status} ${res.statusText}`);

    const data = await res.json();
    $("metadataBox").textContent = JSON.stringify(data, null, 2);

    // optional image display
    if (data.image) {
      const imgUrl = normalizeIpfs(data.image);
      $("imageBox").innerHTML = `<img src="${imgUrl}" alt="NFT image" />`;
    }

    ok("Metadata loaded.");
  } catch (e) {
    err(e);
  }
}

async function listMintedTokens() {
  try {
    if (!browserProvider) throw new Error("Connect wallet first.");

    // We scan Transfer events where from == 0x0 (mint)
    const iface = new ethers.Interface(ERC721_ABI);
    const transferTopic = iface.getEvent("Transfer").topicHash;

    const zeroAddress = "0x0000000000000000000000000000000000000000";

    // Filter: address = MyNFT, topic0 = Transfer, topic1 = from (0x0)
    const filter = {
      address: MYNFT_ADDRESS,
      fromBlock: 0,
      toBlock: "latest",
      topics: [
        transferTopic,
        ethers.zeroPadValue(zeroAddress, 32), // indexed from
      ],
    };

    $("mintedList").textContent = "Loading logs...";

    const logs = await browserProvider.getLogs(filter);

    const tokenIds = logs.map((log) => {
      const parsed = iface.parseLog(log);
      // Transfer(from,to,tokenId)
      return parsed.args.tokenId.toString();
    });

    // remove duplicates & sort
    const uniq = [...new Set(tokenIds)].sort((a, b) => BigInt(a) > BigInt(b) ? 1 : -1);

    $("mintedList").textContent = uniq.length ? uniq.join(", ") : "(no mints found)";

    ok("Minted token list loaded.");
  } catch (e) {
    err(e);
  }
}

// =========================
// 7) Wire UI
// =========================
$("btnConnect").addEventListener("click", connect);
$("btnRefreshToken").addEventListener("click", loadTokenInfoAndBalance);
$("btnTransfer").addEventListener("click", doTransfer);

$("btnCheckToken").addEventListener("click", checkToken);
$("btnLoadMetadata").addEventListener("click", loadMetadata);
$("btnListMinted").addEventListener("click", listMintedTokens);

// Optional: react to account/network changes
if (window.ethereum) {
  window.ethereum.on?.("accountsChanged", () => location.reload());
  window.ethereum.on?.("chainChanged", () => location.reload());
}
