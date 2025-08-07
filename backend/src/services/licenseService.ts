import { mintLicenseOnHedera } from './storyService';
import { Address } from 'viem';

interface LicenseRequest {
  tokenId: number;
  royaltyPercentage: number;
  duration: number;
  commercialUse: boolean;
  terms: string;
  modredIpContractAddress: Address;
}

export const mintLicense = async (licenseRequest: LicenseRequest) => {
  try {
    const { txHash, blockNumber, explorerUrl } = await mintLicenseOnHedera(
      licenseRequest.tokenId,
      licenseRequest.royaltyPercentage,
      licenseRequest.duration,
      licenseRequest.commercialUse,
      licenseRequest.terms,
      licenseRequest.modredIpContractAddress
    );

    return {
      success: true,
      txHash,
      blockNumber,
      explorerUrl,
      message: 'License minted successfully on Hedera'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to mint license on Hedera'
    };
  }
}; 