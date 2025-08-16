const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("Lock", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployRollup() {
    const ScrodingerRollup = await ethers.getContractFactory("SchrodingerRollup");
    const rollup = await ScrodingerRollup.deploy();
    return { rollup };
  }

  async function generateMockTxns(){

  }


  describe("Deployment", function () {
    it("Should set the right number of forks", async function () {
      const { rollup } = await loadFixture(deployRollup);
      expect(await rollup.forks()).to.equal(0);
    });
    it("Should set right deviation threshold", async function () {
      const { rollup } = await loadFixture(deployRollup);
      expect(await rollup.deviationThreshold()).to.equal(5);
    });
  });

  describe("PostBlobs", function () {
    it("Should store txns", async function () {
      const { rollup } = await loadFixture(deployRollup);
      expect(1).to.equal(5);
    });
    it("Should store proper price", async function () {
      const { rollup } = await loadFixture(deployRollup);
      expect(1).to.equal(5);
    });
  });
  describe("Handle Price Deviations -- Full Test", function () {
    it("Does 1 fork", async function () {
      const { rollup } = await loadFixture(deployRollup);
      expect(1).to.equal(5);
    });
    it("Does 3 forks and settles", async function () {
      const { rollup } = await loadFixture(deployRollup);
      expect(1).to.equal(5);
    });
  });
});
