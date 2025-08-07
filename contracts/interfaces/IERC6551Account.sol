// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IERC6551Account
 * @notice Interface for ERC-6551 token-bound accounts
 */
interface IERC6551Account {
    receive() external payable;

    function execute(
        address to,
        uint256 value,
        bytes calldata data,
        uint8 operation
    ) external payable returns (bytes memory);

    function isValidSigner(address signer, bytes calldata context)
        external
        view
        returns (bytes4 magicValue);

    function state() external view returns (uint256);

    function token()
        external
        view
        returns (
            uint256 chainId,
            address tokenContract,
            uint256 tokenId
        );

    function owner() external view returns (address);
}