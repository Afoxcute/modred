import { Chain, Address, createPublicClient, http } from 'viem'

// Hedera testnet configuration
const hederaTestnet: Chain = {
  id: 296,
  name: 'Hedera Testnet',
  nativeCurrency: {
    name: 'HBAR',
    symbol: 'HBAR',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://testnet.hashio.io/api'],
    },
    public: {
      http: ['https://testnet.hashio.io/api'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Hedera Testnet Explorer',
      url: 'https://testnet.hashscan.io',
    },
  },
}

interface NetworkConfig {
    rpcProviderUrl: string
    blockExplorer: string
    chain: Chain
    nativeTokenAddress: Address
}

// Network configuration
const networkConfig: NetworkConfig = {
    rpcProviderUrl: 'https://testnet.hashio.io/api',
    blockExplorer: 'https://testnet.hashscan.io',
    chain: hederaTestnet,
    nativeTokenAddress: '0x0000000000000000000000000000000000000000' as Address, // Native HBAR token
}

// Helper functions
const validateEnvironmentVars = () => {
    if (!process.env.WALLET_PRIVATE_KEY) {
        throw new Error('WALLET_PRIVATE_KEY is required in .env file')
    }
}

validateEnvironmentVars()

export const networkInfo = {
    ...networkConfig,
    rpcProviderUrl: process.env.RPC_PROVIDER_URL || networkConfig.rpcProviderUrl,
}

const baseConfig = {
    chain: networkInfo.chain,
    transport: http(networkInfo.rpcProviderUrl),
} as const

export const publicClient = createPublicClient(baseConfig)
export const walletClient = publicClient

// Export constants
export const NATIVE_TOKEN_ADDRESS = networkInfo.nativeTokenAddress
export const BLOCK_EXPLORER_URL = networkInfo.blockExplorer
