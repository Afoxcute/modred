import "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-verify";
import type { HardhatUserConfig } from "hardhat/config";
import dotenv from 'dotenv';

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  networks: {
    local: {
      url: "http://127.0.0.1:7546",
      chainId: 298,
      accounts: [process.env.ECDSA_PRIVATE_KEY_LOCAL || ''],
      gas: "auto",
      gasPrice: "auto",
      gasMultiplier: 3
    },
    testnet: {
      url: "https://testnet.hashio.io/api",
      chainId: 296,
      accounts: [process.env.ECDSA_PRIVATE_KEY_TEST || ''],
      gas: "auto",
      gasPrice: "auto",
      gasMultiplier: 3
    },
    mainnet: {
      url: "https://mainnet.hashio.io/api",
      chainId: 295,
      accounts: [process.env.ECDSA_PRIVATE_KEY_MAIN || ''],
      gas: "auto",
      gasPrice: "auto",
      gasMultiplier: 3
    }
  },
  etherscan: {
    apiKey: {
      testnet: "YOU_CAN_COPY_ME",
      mainnet: "YOU_CAN_COPY_ME",
    },
    customChains: [
      {
        network: "testnet",
        chainId: 296,
        urls: {
          apiURL: "https://testnet.hashscan.io/api",
          browserURL: "https://testnet.hashscan.io",
        },
      },
      {
        network: "mainnet",
        chainId: 295,
        urls: {
          apiURL: "https://hashscan.io/api",
          browserURL: "https://hashscan.io",
        },
      },
    ],
  },
  sourcify: {
    // Disabled by default
    // Doesn't need an API key
    enabled: false,
  },
};

export default config;
