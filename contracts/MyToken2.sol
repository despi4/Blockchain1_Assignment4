// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyTokenOptimized is ERC20, Ownable {
    constructor()
        ERC20("MyToken", "MTK")
        Ownable(msg.sender)
    {}

    /// @notice Mint tokens (owner only)
    function mint(address to, uint256 amount) external onlyOwner {
        unchecked {
            _mint(to, amount);
        }
    }
}