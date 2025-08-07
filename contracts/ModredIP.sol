// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./interfaces/IERC6551Account.sol";
import "./interfaces/IERC6551Registry.sol";
import "hardhat/console.sol";

/**
 * @title ModredIP
 * @notice Decentralized IP management platform with ERC-6551 integration
 * @dev Implements IP asset registration, licensing, revenue sharing, and dispute resolution
 */
contract ModredIP is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    using Math for uint256;

    // ============ STATE VARIABLES ============

    uint256 private _tokenIdCounter;
    uint256 private _licenseIdCounter;
    
    // ERC-6551 Registry for creating token-bound accounts
    IERC6551Registry public immutable erc6551Registry;
    address public immutable accountImplementation;

    // Revenue sharing constants
    uint256 public constant ROYALTY_DENOMINATOR = 10000; // 100.00%
    uint256 public constant PLATFORM_FEE = 250; // 2.5%

    // ============ STRUCTS ============

    struct IPAsset {
        uint256 tokenId;
        address owner;
        string ipHash; // IPFS hash of the IP content
        string metadata; // Additional metadata
        bool isActive;
        bool isDisputed;
        uint256 registrationDate;
        uint256 totalRevenue;
        uint256 royaltyTokens; // Amount of royalty tokens held
        address tokenBoundAccount; // ERC-6551 account address
    }

    struct License {
        uint256 licenseId;
        uint256 ipTokenId;
        address licensee;
        bool commercialUse;
        bool derivativeWorks;
        bool exclusive;
        uint256 revenueShare; // Basis points (10000 = 100%)
        uint256 duration; // Duration in seconds
        uint256 issueDate;
        bool isActive;
        string terms; // Encrypted license terms
    }

    struct Dispute {
        uint256 disputeId;
        uint256 ipTokenId;
        address disputer;
        string reason;
        string evidence;
        uint256 timestamp;
        DisputeStatus status;
        address arbitrator;
    }

    enum DisputeStatus {
        PENDING,
        UNDER_REVIEW,
        RESOLVED_VALID,
        RESOLVED_INVALID,
        CANCELLED
    }

    // ============ MAPPINGS ============

    mapping(uint256 => IPAsset) public ipAssets;
    mapping(uint256 => License) public licenses;
    mapping(uint256 => Dispute) public disputes;
    mapping(uint256 => uint256[]) public ipToLicenses; // IP token ID to license IDs
    mapping(uint256 => uint256[]) public ipToDisputes; // IP token ID to dispute IDs
    mapping(address => uint256[]) public ownerToIPs; // Owner to IP token IDs
    mapping(address => uint256[]) public licenseeToLicenses; // Licensee to license IDs
    mapping(uint256 => mapping(address => uint256)) public royaltyShares; // IP token ID => address => share amount

    // ============ EVENTS ============

    event IPRegistered(uint256 indexed tokenId, address indexed owner, string ipHash, address tokenBoundAccount);
    event LicenseMinted(uint256 indexed licenseId, uint256 indexed ipTokenId, address indexed licensee);
    event RevenuePaid(uint256 indexed ipTokenId, address indexed payer, uint256 amount, string description);
    event RoyaltyClaimed(uint256 indexed ipTokenId, address indexed claimant, uint256 amount);
    event DisputeRaised(uint256 indexed disputeId, uint256 indexed ipTokenId, address indexed disputer);
    event DisputeResolved(uint256 indexed disputeId, DisputeStatus status);
    event IPStatusChanged(uint256 indexed tokenId, bool isActive, bool isDisputed);

    // ============ CONSTRUCTOR ============

    constructor(
        address _erc6551Registry,
        address _accountImplementation
    ) ERC721("ModredIP", "MIP") Ownable(msg.sender) {
        erc6551Registry = IERC6551Registry(_erc6551Registry);
        accountImplementation = _accountImplementation;
    }

    // ============ MODIFIERS ============

    modifier onlyIPOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == msg.sender, "Not IP owner");
        _;
    }

    modifier ipExists(uint256 tokenId) {
        require(_ownerOf(tokenId) != address(0), "IP does not exist");
        _;
    }

    modifier licenseExists(uint256 licenseId) {
        require(licenses[licenseId].licenseId != 0, "License does not exist");
        _;
    }

    modifier disputeExists(uint256 disputeId) {
        require(disputes[disputeId].disputeId != 0, "Dispute does not exist");
        _;
    }

    // ============ CORE IP FUNCTIONS ============

    /**
     * @notice Register a new IP asset with ERC-6551 token-bound account
     * @param ipHash IPFS hash of the IP content
     * @param metadata Additional metadata about the IP
     * @param tokenUriString URI for the NFT metadata
     * @return tokenId The ID of the newly minted IP NFT
     */
    function registerIP(
        string memory ipHash,
        string memory metadata,
        string memory tokenUriString
    ) external returns (uint256) {
        require(bytes(ipHash).length > 0, "IP hash cannot be empty");
        
        uint256 tokenId = _tokenIdCounter++;
        
        // Mint the NFT to the caller
        _mint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenUriString);
        
        // Create ERC-6551 token-bound account
        address tokenBoundAccount = erc6551Registry.createAccount(
            accountImplementation,
            bytes32(0), // salt
            block.chainid,
            address(this),
            tokenId
        );
        
        // Initialize IP Asset
        IPAsset storage newIP = ipAssets[tokenId];
        newIP.tokenId = tokenId;
        newIP.owner = msg.sender;
        newIP.ipHash = ipHash;
        newIP.metadata = metadata;
        newIP.isActive = true;
        newIP.isDisputed = false;
        newIP.registrationDate = block.timestamp;
        newIP.totalRevenue = 0;
        newIP.royaltyTokens = ROYALTY_DENOMINATOR; // Owner starts with 100% royalty tokens
        newIP.tokenBoundAccount = tokenBoundAccount;
        
        // Set initial royalty share to the owner
        royaltyShares[tokenId][msg.sender] = ROYALTY_DENOMINATOR;
        
        // Add to owner's IP list
        ownerToIPs[msg.sender].push(tokenId);
        
        emit IPRegistered(tokenId, msg.sender, ipHash, tokenBoundAccount);
        
        return tokenId;
    }

    /**
     * @notice Get IP asset information
     * @param tokenId The IP token ID
     * @return IP asset details
     */
    function getIPAsset(uint256 tokenId) external view ipExists(tokenId) returns (IPAsset memory) {
        return ipAssets[tokenId];
    }

    /**
     * @notice Get all IP assets owned by an address
     * @param owner The owner address
     * @return Array of IP token IDs
     */
    function getOwnerIPs(address owner) external view returns (uint256[] memory) {
        return ownerToIPs[owner];
    }

    // ============ LICENSE FUNCTIONS ============

    /**
     * @notice Mint a license token for an IP asset
     * @param ipTokenId The IP asset token ID
     * @param commercialUse Whether commercial use is allowed
     * @param derivativeWorks Whether derivative works are allowed
     * @param exclusive Whether the license is exclusive
     * @param revenueShare Revenue share percentage in basis points
     * @param duration License duration in seconds
     * @param terms Encrypted license terms
     * @return licenseId The ID of the newly created license
     */
    function mintLicense(
        uint256 ipTokenId,
        bool commercialUse,
        bool derivativeWorks,
        bool exclusive,
        uint256 revenueShare,
        uint256 duration,
        string memory terms
    ) external ipExists(ipTokenId) returns (uint256) {
        require(!ipAssets[ipTokenId].isDisputed, "IP is under dispute");
        require(ipAssets[ipTokenId].isActive, "IP is not active");
        require(revenueShare <= ROYALTY_DENOMINATOR, "Invalid revenue share");
        require(duration > 0, "Duration must be positive");
        require(bytes(terms).length > 0, "License terms required");
        
        uint256 licenseId = _licenseIdCounter++;
        
        License storage newLicense = licenses[licenseId];
        newLicense.licenseId = licenseId;
        newLicense.ipTokenId = ipTokenId;
        newLicense.licensee = msg.sender;
        newLicense.commercialUse = commercialUse;
        newLicense.derivativeWorks = derivativeWorks;
        newLicense.exclusive = exclusive;
        newLicense.revenueShare = revenueShare;
        newLicense.duration = duration;
        newLicense.issueDate = block.timestamp;
        newLicense.isActive = true;
        newLicense.terms = terms;
        
        // Add to mappings
        ipToLicenses[ipTokenId].push(licenseId);
        licenseeToLicenses[msg.sender].push(licenseId);
        
        emit LicenseMinted(licenseId, ipTokenId, msg.sender);
        
        return licenseId;
    }

    /**
     * @notice Get license information
     * @param licenseId The license ID
     * @return License details
     */
    function getLicense(uint256 licenseId) external view licenseExists(licenseId) returns (License memory) {
        return licenses[licenseId];
    }

    /**
     * @notice Get all licenses for an IP asset
     * @param ipTokenId The IP token ID
     * @return Array of license IDs
     */
    function getIPLicenses(uint256 ipTokenId) external view ipExists(ipTokenId) returns (uint256[] memory) {
        return ipToLicenses[ipTokenId];
    }

    /**
     * @notice Get all licenses for a licensee
     * @param licensee The licensee address
     * @return Array of license IDs
     */
    function getLicenseeLicenses(address licensee) external view returns (uint256[] memory) {
        return licenseeToLicenses[licensee];
    }

    // ============ REVENUE SHARING FUNCTIONS ============

    /**
     * @notice Pay revenue to an IP asset
     * @param ipTokenId The IP token ID
     * @param description Description of the payment
     */
    function payRevenue(uint256 ipTokenId, string memory description) 
        external 
        payable 
        nonReentrant 
        ipExists(ipTokenId) 
    {
        require(msg.value > 0, "Payment amount must be positive");
        require(!ipAssets[ipTokenId].isDisputed, "IP is under dispute");
        
        uint256 platformFee = Math.mulDiv(msg.value, PLATFORM_FEE, ROYALTY_DENOMINATOR);
        uint256 royaltyAmount = msg.value - platformFee;
        
        // Update total revenue
        ipAssets[ipTokenId].totalRevenue += royaltyAmount;
        
        // Send platform fee to owner
        payable(owner()).transfer(platformFee);
        
        // Send revenue to the IP's token-bound account
        payable(ipAssets[ipTokenId].tokenBoundAccount).transfer(royaltyAmount);
        
        emit RevenuePaid(ipTokenId, msg.sender, msg.value, description);
    }

    /**
     * @notice Claim royalties from an IP asset's token-bound account
     * @param ipTokenId The IP token ID
     */
    function claimRoyalties(uint256 ipTokenId) 
        external 
        nonReentrant 
        ipExists(ipTokenId) 
    {
        uint256 claimantShare = royaltyShares[ipTokenId][msg.sender];
        require(claimantShare > 0, "No royalty share");
        
        address tokenBoundAccount = ipAssets[ipTokenId].tokenBoundAccount;
        uint256 availableBalance = tokenBoundAccount.balance;
        require(availableBalance > 0, "No funds to claim");
        
        uint256 claimAmount = Math.mulDiv(availableBalance, claimantShare, ROYALTY_DENOMINATOR);
        require(claimAmount > 0, "No funds to claim");
        
        // Execute transfer from token-bound account
        IERC6551Account(payable(tokenBoundAccount)).execute(
            payable(msg.sender),
            claimAmount,
            "",
            0
        );
        
        emit RoyaltyClaimed(ipTokenId, msg.sender, claimAmount);
    }

    /**
     * @notice Transfer royalty shares to another address
     * @param ipTokenId The IP token ID
     * @param to The recipient address
     * @param amount The amount of royalty shares to transfer
     */
    function transferRoyaltyShares(
        uint256 ipTokenId,
        address to,
        uint256 amount
    ) external ipExists(ipTokenId) {
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be positive");
        require(royaltyShares[ipTokenId][msg.sender] >= amount, "Insufficient shares");
        
        royaltyShares[ipTokenId][msg.sender] -= amount;
        royaltyShares[ipTokenId][to] += amount;
    }

    /**
     * @notice Get royalty share for an address
     * @param ipTokenId The IP token ID
     * @param holder The address to check
     * @return The royalty share amount
     */
    function getRoyaltyShare(uint256 ipTokenId, address holder) 
        external 
        view 
        ipExists(ipTokenId) 
        returns (uint256) 
    {
        return royaltyShares[ipTokenId][holder];
    }

    // ============ DISPUTE FUNCTIONS ============

    uint256 private _disputeIdCounter;

    /**
     * @notice Raise a dispute against an IP asset
     * @param ipTokenId The IP token ID
     * @param reason The reason for the dispute
     * @param evidence Evidence supporting the dispute
     * @return disputeId The ID of the newly created dispute
     */
    function raiseDispute(
        uint256 ipTokenId,
        string memory reason,
        string memory evidence
    ) external ipExists(ipTokenId) returns (uint256) {
        require(bytes(reason).length > 0, "Reason cannot be empty");
        require(bytes(evidence).length > 0, "Evidence cannot be empty");
        
        uint256 disputeId = _disputeIdCounter++;
        
        Dispute storage newDispute = disputes[disputeId];
        newDispute.disputeId = disputeId;
        newDispute.ipTokenId = ipTokenId;
        newDispute.disputer = msg.sender;
        newDispute.reason = reason;
        newDispute.evidence = evidence;
        newDispute.timestamp = block.timestamp;
        newDispute.status = DisputeStatus.PENDING;
        newDispute.arbitrator = address(0);
        
        // Mark IP as disputed
        ipAssets[ipTokenId].isDisputed = true;
        
        // Add to mappings
        ipToDisputes[ipTokenId].push(disputeId);
        
        emit DisputeRaised(disputeId, ipTokenId, msg.sender);
        emit IPStatusChanged(ipTokenId, ipAssets[ipTokenId].isActive, true);
        
        return disputeId;
    }

    /**
     * @notice Resolve a dispute (only owner can resolve)
     * @param disputeId The dispute ID
     * @param status The resolution status
     * @param arbitrator The arbitrator address (optional)
     */
    function resolveDispute(
        uint256 disputeId,
        DisputeStatus status,
        address arbitrator
    ) external onlyOwner disputeExists(disputeId) {
        require(
            status == DisputeStatus.RESOLVED_VALID || 
            status == DisputeStatus.RESOLVED_INVALID,
            "Invalid resolution status"
        );
        require(disputes[disputeId].status == DisputeStatus.PENDING, "Dispute already resolved");
        
        disputes[disputeId].status = status;
        disputes[disputeId].arbitrator = arbitrator;
        
        uint256 ipTokenId = disputes[disputeId].ipTokenId;
        
        // If dispute is resolved as invalid, remove disputed status
        if (status == DisputeStatus.RESOLVED_INVALID) {
            ipAssets[ipTokenId].isDisputed = false;
            emit IPStatusChanged(ipTokenId, ipAssets[ipTokenId].isActive, false);
        }
        // If dispute is valid, deactivate the IP
        else if (status == DisputeStatus.RESOLVED_VALID) {
            ipAssets[ipTokenId].isActive = false;
            emit IPStatusChanged(ipTokenId, false, true);
        }
        
        emit DisputeResolved(disputeId, status);
    }

    /**
     * @notice Get dispute information
     * @param disputeId The dispute ID
     * @return Dispute details
     */
    function getDispute(uint256 disputeId) external view disputeExists(disputeId) returns (Dispute memory) {
        return disputes[disputeId];
    }

    /**
     * @notice Get all disputes for an IP asset
     * @param ipTokenId The IP token ID
     * @return Array of dispute IDs
     */
    function getIPDisputes(uint256 ipTokenId) external view ipExists(ipTokenId) returns (uint256[] memory) {
        return ipToDisputes[ipTokenId];
    }

    // ============ ADMIN FUNCTIONS ============

    /**
     * @notice Set IP status (only owner)
     * @param ipTokenId The IP token ID
     * @param isActive Whether the IP is active
     */
    function setIPStatus(uint256 ipTokenId, bool isActive) 
        external 
        onlyOwner 
        ipExists(ipTokenId) 
    {
        ipAssets[ipTokenId].isActive = isActive;
        emit IPStatusChanged(ipTokenId, isActive, ipAssets[ipTokenId].isDisputed);
    }

    // ============ ERC721 OVERRIDES ============

    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address previousOwner = super._update(to, tokenId, auth);
        
        // Update IP asset owner
        if (tokenId < _tokenIdCounter) {
            ipAssets[tokenId].owner = to;
        }
        
        return previousOwner;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // ============ UTILITY FUNCTIONS ============

    /**
     * @notice Simple ping function for testing
     */
    function ping() external pure returns (string memory) {
        return "pong";
    }

    /**
     * @notice Get contract version
     */
    function version() external pure returns (string memory) {
        return "1.0.0";
    }

    /**
     * @notice Get total number of registered IP assets
     */
    function totalIPs() external view returns (uint256) {
        return _tokenIdCounter;
    }

    /**
     * @notice Get total number of licenses
     */
    function totalLicenses() external view returns (uint256) {
        return _licenseIdCounter;
    }

    /**
     * @notice Get total number of disputes
     */
    function totalDisputes() external view returns (uint256) {
        return _disputeIdCounter;
    }
}
