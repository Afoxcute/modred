// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ModredIPModule = buildModule("ModredIPModule", (m) => {
  // Deploy Mock ERC-6551 Registry (no arguments needed)
  const registry = m.contract("MockERC6551Registry");

  // Deploy Mock Account Implementation for ERC-6551
  const accountImplementation = m.contract("MockERC6551Account");

  // Deploy ModredIP contract with correct constructor parameters
  const ModredIPContract = m.contract("ModredIP", [
    registry,
    accountImplementation
  ]);

  return { 
    ModredIPContract,
    registry,
    accountImplementation
  };
});

export default ModredIPModule; 