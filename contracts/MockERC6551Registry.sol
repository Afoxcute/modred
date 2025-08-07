// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./interfaces/IERC6551Registry.sol";

/**
 * @title MockERC6551Registry
 * @notice Mock implementation of ERC-6551 Registry for testing purposes
 * @dev In production, use the official registry at: 0x000000006551c19487814612e58FE06813775758
 */
contract MockERC6551Registry is IERC6551Registry {
    mapping(bytes32 => address) public accounts;

    function createAccount(
        address implementation,
        bytes32 salt,
        uint256 chainId,
        address tokenContract,
        uint256 tokenId
    ) external returns (address) {
        bytes32 accountKey = keccak256(
            abi.encodePacked(
                implementation,
                salt,
                chainId,
                tokenContract,
                tokenId
            )
        );
        
        address accountAddress = accounts[accountKey];
        
        if (accountAddress == address(0)) {
            // For mock purposes, just create a simple proxy contract
            // In production, this would deploy the actual ERC6551Account implementation
            bytes memory bytecode = abi.encodePacked(
                hex"3d602d80600a3d3981f3363d3d373d3d3d363d73",
                implementation,
                hex"5af43d82803e903d91602b57fd5bf3"
            );
            
            assembly {
                accountAddress := create2(0, add(bytecode, 0x20), mload(bytecode), accountKey)
            }
            
            accounts[accountKey] = accountAddress;
            
            emit ERC6551AccountCreated(
                accountAddress,
                implementation,
                salt,
                chainId,
                tokenContract,
                tokenId
            );
        }
        
        return accountAddress;
    }

    function account(
        address implementation,
        bytes32 salt,
        uint256 chainId,
        address tokenContract,
        uint256 tokenId
    ) external view returns (address) {
        bytes32 accountKey = keccak256(
            abi.encodePacked(
                implementation,
                salt,
                chainId,
                tokenContract,
                tokenId
            )
        );
        
        return accounts[accountKey];
    }
}