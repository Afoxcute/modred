import { publicClient, walletClient, account, networkInfo, BLOCK_EXPLORER_URL } from '../utils/config';
import { uploadJSONToIPFS } from '../utils/functions/uploadToIpfs';
import { createHash } from 'crypto';
import { Address } from 'viem';
import { MODRED_IP_ABI, CONTRACT_ADDRESSES } from '../config/contracts';

// IP Metadata interface for Hedera
export interface IpMetadata {
    name: string;
    description: string;
    image: string;
    external_url?: string;
    attributes?: Array<{
        trait_type: string;
        value: string | number;
    }>;
    license?: string;
    creator?: string;
    created_at?: string;
}

export const registerIpWithHedera = async (
    ipHash: string,
    metadata: string,
    tokenUriString: string = "",
    modredIpContractAddress: Address = CONTRACT_ADDRESSES.MODRED_IP
) => {
    try {
        console.log('ipHash:', ipHash);
        console.log('metadata:', metadata);
        console.log('tokenUriString:', tokenUriString);

        // Register IP on ModredIP contract
        const { request } = await publicClient.simulateContract({
            address: modredIpContractAddress,
            abi: MODRED_IP_ABI,
            functionName: 'registerIP',
            args: [
                ipHash,
                metadata,
                tokenUriString
            ],
            account: account.address,
        });

        const hash = await walletClient.writeContract({
            ...request,
            account: account,
  });

        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        // Extract IP Asset ID from transaction logs
        let ipAssetId: number | undefined;
        if (receipt.logs && receipt.logs.length > 0) {
            // Look for the Transfer event which contains the token ID
            for (const log of receipt.logs) {
                if (log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef') {
                    // Transfer event signature
                    if (log.topics[3]) {
                        ipAssetId = parseInt(log.topics[3], 16);
                        break;
                    }
                }
            }
        }

  return {
            txHash: hash,
            ipAssetId: ipAssetId,
            blockNumber: receipt.blockNumber,
            explorerUrl: `${BLOCK_EXPLORER_URL}/tx/${hash}`,
        };
    } catch (error) {
        console.error('Error registering IP with Hedera:', error);
        throw error;
    }
};

export const mintLicenseOnHedera = async (
    ipTokenId: number,
    commercialUse: boolean,
    derivativeWorks: boolean,
    exclusive: boolean,
    revenueShare: number,
    duration: number,
    terms: string,
    modredIpContractAddress: Address = CONTRACT_ADDRESSES.MODRED_IP
) => {
    try {
        const { request } = await publicClient.simulateContract({
            address: modredIpContractAddress,
            abi: MODRED_IP_ABI,
            functionName: 'mintLicense',
            args: [
                BigInt(ipTokenId),
                commercialUse,
                derivativeWorks,
                exclusive,
                BigInt(revenueShare),
                BigInt(duration),
                terms
            ],
            account: account.address,
        });

        const hash = await walletClient.writeContract({
            ...request,
            account: account,
        });

        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        return {
            txHash: hash,
    blockNumber: receipt.blockNumber,
            explorerUrl: `${BLOCK_EXPLORER_URL}/tx/${hash}`,
  };
    } catch (error) {
        console.error('Error minting license on Hedera:', error);
        throw error;
    }
};

