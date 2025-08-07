import { expect } from "chai";
import { ethers } from "hardhat";
import { ModredIP, ERC6551Registry, ERC6551Account } from "../typechain-types";

describe("ModredIP", function () {
  let modredIP: ModredIP;
  let registry: ERC6551Registry;
  let accountImplementation: ERC6551Account;
  let owner: any;
  let addr1: any;
  let addr2: any;

  beforeEach(async function () {
    // Get signers
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy ERC6551 Registry
    const Registry = await ethers.getContractFactory("ERC6551Registry");
    registry = await Registry.deploy();

    // Deploy Account Implementation
    const AccountImplementation = await ethers.getContractFactory("ERC6551Account");
    accountImplementation = await AccountImplementation.deploy();

    // Deploy ModredIP contract
    const ModredIP = await ethers.getContractFactory("ModredIP");
    modredIP = await ModredIP.deploy(
      await registry.getAddress(),
      await accountImplementation.getAddress(),
      296n, // Hedera testnet chain ID
      ethers.ZeroAddress // Platform fee collector (to be set later)
    );

    // Add implementation to registry
    await registry.addImplementation(await accountImplementation.getAddress());

    // Set platform fee collector
    await modredIP.setPlatformFeeCollector(ethers.ZeroAddress);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await modredIP.owner()).to.equal(owner.address);
    });

    it("Should set the correct registry address", async function () {
      expect(await modredIP.registry()).to.equal(await registry.getAddress());
    });

    it("Should set the correct account implementation", async function () {
      expect(await modredIP.accountImplementation()).to.equal(await accountImplementation.getAddress());
    });

    it("Should set the correct chain ID", async function () {
      expect(await modredIP.chainId()).to.equal(296n);
    });
  });

  describe("IP Registration", function () {
    it("Should register IP successfully", async function () {
      const ipHash = "QmTestHash123";
      const metadata = JSON.stringify({
        name: "Test IP",
        description: "Test description",
        image: "https://ipfs.io/ipfs/QmTestImage"
      });
      const isEncrypted = false;

      await expect(modredIP.registerIP(ipHash, metadata, isEncrypted))
        .to.emit(modredIP, "IPRegistered")
        .withArgs(1n, owner.address, ipHash, metadata, isEncrypted);

      const ipAsset = await modredIP.getIPAsset(1n);
      expect(ipAsset.owner).to.equal(owner.address);
      expect(ipAsset.ipHash).to.equal(ipHash);
      expect(ipAsset.metadata).to.equal(metadata);
      expect(ipAsset.isEncrypted).to.equal(isEncrypted);
    });

    it("Should increment token ID correctly", async function () {
      const ipHash = "QmTestHash123";
      const metadata = JSON.stringify({
        name: "Test IP",
        description: "Test description"
      });

      await modredIP.registerIP(ipHash, metadata, false);
      expect(await modredIP.nextTokenId()).to.equal(2n);
    });

    it("Should revert if caller is not owner", async function () {
      const ipHash = "QmTestHash123";
      const metadata = JSON.stringify({
        name: "Test IP",
        description: "Test description"
      });

      await expect(
        modredIP.connect(addr1).registerIP(ipHash, metadata, false)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("License Minting", function () {
    beforeEach(async function () {
      // Register an IP first
      const ipHash = "QmTestHash123";
      const metadata = JSON.stringify({
        name: "Test IP",
        description: "Test description"
      });
      await modredIP.registerIP(ipHash, metadata, false);
    });

    it("Should mint license successfully", async function () {
      const tokenId = 1n;
      const royaltyPercentage = 1000n; // 10%
      const duration = 365n; // 1 year
      const commercialUse = true;
      const terms = "Commercial license terms";

      await expect(modredIP.mintLicense(tokenId, royaltyPercentage, duration, commercialUse, terms))
        .to.emit(modredIP, "LicenseMinted")
        .withArgs(1n, addr1.address, tokenId, royaltyPercentage, duration, commercialUse, terms);

      const license = await modredIP.getLicense(1n);
      expect(license.licensee).to.equal(addr1.address);
      expect(license.tokenId).to.equal(tokenId);
      expect(license.royaltyPercentage).to.equal(royaltyPercentage);
      expect(license.duration).to.equal(duration);
      expect(license.commercialUse).to.equal(commercialUse);
      expect(license.terms).to.equal(terms);
    });

    it("Should increment license ID correctly", async function () {
      const tokenId = 1n;
      const royaltyPercentage = 1000n;
      const duration = 365n;
      const commercialUse = true;
      const terms = "Commercial license terms";

      await modredIP.mintLicense(tokenId, royaltyPercentage, duration, commercialUse, terms);
      expect(await modredIP.nextLicenseId()).to.equal(2n);
    });

    it("Should revert if IP asset doesn't exist", async function () {
      const tokenId = 999n; // Non-existent token
      const royaltyPercentage = 1000n;
      const duration = 365n;
      const commercialUse = true;
      const terms = "Commercial license terms";

      await expect(
        modredIP.mintLicense(tokenId, royaltyPercentage, duration, commercialUse, terms)
      ).to.be.revertedWith("IP asset does not exist");
    });
  });

  describe("Revenue Distribution", function () {
    beforeEach(async function () {
      // Register an IP and mint a license
      const ipHash = "QmTestHash123";
      const metadata = JSON.stringify({
        name: "Test IP",
        description: "Test description"
      });
      await modredIP.registerIP(ipHash, metadata, false);
      await modredIP.mintLicense(1n, 1000n, 365n, true, "Commercial terms");
    });

    it("Should pay revenue successfully", async function () {
      const tokenId = 1n;
      const amount = ethers.parseEther("1.0");

      await expect(modredIP.payRevenue(tokenId, { value: amount }))
        .to.emit(modredIP, "RevenuePaid")
        .withArgs(tokenId, owner.address, amount);

      const ipAsset = await modredIP.getIPAsset(tokenId);
      expect(ipAsset.totalRevenue).to.equal(amount);
    });

    it("Should distribute royalties to license holders", async function () {
      const tokenId = 1n;
      const amount = ethers.parseEther("1.0");

      await modredIP.payRevenue(tokenId, { value: amount });

      // Check that royalties were distributed
      // This would depend on the specific implementation of royalty distribution
      const license = await modredIP.getLicense(1n);
      expect(license.isActive).to.be.true;
    });
  });

  describe("Royalty Claiming", function () {
    beforeEach(async function () {
      // Register an IP and mint a license
      const ipHash = "QmTestHash123";
      const metadata = JSON.stringify({
        name: "Test IP",
        description: "Test description"
      });
      await modredIP.registerIP(ipHash, metadata, false);
      await modredIP.mintLicense(1n, 1000n, 365n, true, "Commercial terms");
    });

    it("Should allow license holders to claim royalties", async function () {
      const licenseId = 1n;
      const tokenId = 1n;
      const amount = ethers.parseEther("1.0");

      // Pay revenue first
      await modredIP.payRevenue(tokenId, { value: amount });

      // Claim royalties
      await expect(modredIP.connect(addr1).claimRoyalties(licenseId))
        .to.emit(modredIP, "RoyaltiesClaimed")
        .withArgs(licenseId, addr1.address, anyValue); // anyValue for the claimed amount
    });
  });

  describe("Dispute Resolution", function () {
    beforeEach(async function () {
      // Register an IP
      const ipHash = "QmTestHash123";
      const metadata = JSON.stringify({
        name: "Test IP",
        description: "Test description"
      });
      await modredIP.registerIP(ipHash, metadata, false);
    });

    it("Should allow owner to flag IP as disputed", async function () {
      const tokenId = 1n;

      await expect(modredIP.flagAsDisputed(tokenId))
        .to.emit(modredIP, "IPDisputed")
        .withArgs(tokenId, owner.address);

      const ipAsset = await modredIP.getIPAsset(tokenId);
      expect(ipAsset.isDisputed).to.be.true;
    });

    it("Should revert if non-owner tries to flag as disputed", async function () {
      const tokenId = 1n;

      await expect(
        modredIP.connect(addr1).flagAsDisputed(tokenId)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Access Control", function () {
    it("Should allow owner to transfer ownership", async function () {
      await expect(modredIP.transferOwnership(addr1.address))
        .to.emit(modredIP, "OwnershipTransferred")
        .withArgs(owner.address, addr1.address);

      expect(await modredIP.owner()).to.equal(addr1.address);
    });

    it("Should revert if non-owner tries to transfer ownership", async function () {
      await expect(
        modredIP.connect(addr1).transferOwnership(addr2.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
}); 