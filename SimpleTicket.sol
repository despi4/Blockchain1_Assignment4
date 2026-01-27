// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SimpleTicket is ERC721, Ownable {
    uint256 private _tokenIdCounter;

    mapping(uint256 => bool) public used;

    event TicketMinted(uint256 tokenId, address buyer);
    event TicketUsed(uint256 tokenId);

    constructor() ERC721("EventTicket", "TKT") Ownable(msg.sender) {}

    function mintTicket(address to) external onlyOwner {
        uint256 tokenId = _tokenIdCounter++;
        _safeMint(to, tokenId);
        emit TicketMinted(tokenId, to);
    }

    function useTicket(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        require(!used[tokenId], "Already used");
        used[tokenId] = true;
        emit TicketUsed(tokenId);
    }
} 