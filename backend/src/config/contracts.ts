import { Address } from 'viem';

// Contract addresses from latest deployment
export const CONTRACT_ADDRESSES = {
  MODRED_IP: '0xe3Cf8C99E10C1a7138520391bef6dddC61Aa0b91' as Address,
  ERC6551_REGISTRY: '0x067fda4FcaaDAa37552e5B146d8bC441ae4B1351' as Address,
  ERC6551_ACCOUNT: '0x62F2DbCb28639e6172aDbbFa93f02f77F7696825' as Address,
} as const;

// Export default ModredIP address
export const MODRED_IP_CONTRACT_ADDRESS = CONTRACT_ADDRESSES.MODRED_IP;

// ModredIP Contract ABI for backend use - Updated to match actual contract
export const MODRED_IP_ABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "ipHash",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "metadata",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "tokenUriString",
        "type": "string"
      }
    ],
    "name": "registerIP",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "ipTokenId",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "commercialUse",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "derivativeWorks",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "exclusive",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "revenueShare",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "duration",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "terms",
        "type": "string"
      }
    ],
    "name": "mintLicense",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "ipTokenId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      }
    ],
    "name": "payRevenue",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "ipTokenId",
        "type": "uint256"
      }
    ],
    "name": "claimRoyalties",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "getIPAsset",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "ipHash",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "metadata",
            "type": "string"
          },
          {
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "isDisputed",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "registrationDate",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalRevenue",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "royaltyTokens",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "tokenBoundAccount",
            "type": "address"
          }
        ],
        "internalType": "struct ModredIP.IPAssetStruct",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "licenseId",
        "type": "uint256"
      }
    ],
    "name": "getLicense",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "licenseId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "ipTokenId",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "licensee",
            "type": "address"
          },
          {
            "internalType": "bool",
            "name": "commercialUse",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "derivativeWorks",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "exclusive",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "revenueShare",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "duration",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "issueDate",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          },
          {
            "internalType": "string",
            "name": "terms",
            "type": "string"
          }
        ],
        "internalType": "struct ModredIP.LicenseStruct",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalIPs",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalLicenses",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "getOwnerIPs",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "ipTokenId",
        "type": "uint256"
      }
    ],
    "name": "getIPLicenses",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;