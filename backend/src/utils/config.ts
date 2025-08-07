import { Chain, Address, createPublicClient, http, createWalletClient } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

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
        console.warn('WALLET_PRIVATE_KEY not found in .env file. Some features may not work.')
        console.log('Please create a .env file in the backend directory with:')
        console.log('WALLET_PRIVATE_KEY=0x<your_64_character_private_key>')
        return false
    }
    return true
}

const hasValidConfig = validateEnvironmentVars()

export const networkInfo = {
    ...networkConfig,
    rpcProviderUrl: process.env.RPC_PROVIDER_URL || networkConfig.rpcProviderUrl,
}

const baseConfig = {
    chain: networkInfo.chain,
    transport: http(networkInfo.rpcProviderUrl),
} as const

export const publicClient = createPublicClient(baseConfig)

// Create account from private key (only if private key is provided and valid)
export const account = (hasValidConfig && process.env.WALLET_PRIVATE_KEY && process.env.WALLET_PRIVATE_KEY.length === 66)
    ? privateKeyToAccount(process.env.WALLET_PRIVATE_KEY as `0x${string}`)
    : null

// Create wallet client
export const walletClient = createWalletClient({
    ...baseConfig,
    account: account || undefined,
})

// Export constants
export const NATIVE_TOKEN_ADDRESS = networkInfo.nativeTokenAddress
export const BLOCK_EXPLORER_URL = networkInfo.blockExplorer
