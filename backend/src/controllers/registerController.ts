import { registerIpWithHedera } from '../services/storyService';
import { registerToYakoa } from '../services/yakoascanner';
import { convertBigIntsToStrings } from '../utils/bigIntSerializer';
import { Address } from 'viem';

interface RegisterRequest {
  ipHash: string;
  metadata: string;
  isEncrypted: boolean;
  modredIpContractAddress: Address;
}

export const registerIP = async (req: any, res: any) => {
  try {
    const { ipHash, metadata, isEncrypted, modredIpContractAddress } = req.body;

    console.log('Registering IP with hash:', ipHash);
    console.log('Metadata:', metadata);
    console.log('Is encrypted:', isEncrypted);
    console.log('Contract address:', modredIpContractAddress);

    // 1. Register on Hedera using ModredIP contract
    const {
      txHash,
      ipAssetId,
      blockNumber,
      explorerUrl
    } = await registerIpWithHedera(ipHash, metadata, isEncrypted, modredIpContractAddress as Address);
    console.log("✅ Hedera registration successful:", {
      txHash,
      ipAssetId,
      blockNumber,
      explorerUrl
    });

    // 2. Register with Yakoa for infringement monitoring
    let yakoaResult = null;
    let yakoaError = null;

    try {
      // Extract hash from IPFS URL if needed
      const extractHash = (ipfsUrl: string): string => {
        if (ipfsUrl.startsWith('ipfs://')) {
          return ipfsUrl.replace('ipfs://', '');
        }
        if (ipfsUrl.includes('/ipfs/')) {
          const parts = ipfsUrl.split('/ipfs/');
          return parts[1]?.split('?')[0] || ipfsUrl;
        }
        return ipfsUrl;
      };

      const extractedHash = extractHash(ipHash);
      
      // Parse metadata to get creator address
      let creatorAddress = '0x0000000000000000000000000000000000000000';
      try {
        const metadataObj = JSON.parse(metadata);
        if (metadataObj.creator) {
          creatorAddress = metadataObj.creator;
        }
      } catch (e) {
        console.warn('Could not parse metadata for creator address');
      }

      // Create Yakoa payload
      const yakoaPayload = {
        Id: `${modredIpContractAddress.toLowerCase()}:${ipAssetId}`,
        transactionHash: txHash as `0x${string}`,
        blockNumber,
        creatorId: creatorAddress.toLowerCase(),
        metadata: {
          ip_hash: extractedHash,
          blockchain: 'hedera',
          contract_address: modredIpContractAddress.toLowerCase(),
          token_id: ipAssetId?.toString() || '0'
        },
        media: [
          {
            media_id: `IP Asset ${ipAssetId}`,
            url: `https://ipfs.io/ipfs/${extractedHash}`
          }
        ]
      };

      yakoaResult = await registerToYakoa(yakoaPayload);
      console.log("✅ Yakoa registration successful:", yakoaResult);
    } catch (error) {
      yakoaError = error;
      console.error("❌ Yakoa registration failed:", error);
    }

    // 3. Prepare response
    const successMessage = yakoaResult 
      ? 'IP Asset successfully registered on Hedera and Yakoa'
      : 'IP Asset registered on Hedera, already exists in Yakoa';

    const response = {
      success: true,
      message: successMessage,
      data: {
        hedera: {
          txHash,
          ipAssetId,
          blockNumber,
          explorerUrl,
          network: 'Hedera Testnet'
        },
                 yakoa: yakoaResult ? {
           id: yakoaResult.id,
           status: 'registered'
         } : {
           status: 'already_exists',
           error: yakoaError instanceof Error ? yakoaError.message : 'Unknown error'
         }
      }
    };

    // Convert BigInt values to strings for JSON serialization
    const serializedResponse = convertBigIntsToStrings(response);
    
    res.status(200).json(serializedResponse);
  } catch (error) {
    console.error('Error in registerIP:', error);
    
    const errorResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to register IP asset'
    };
    
    res.status(500).json(errorResponse);
  }
};
