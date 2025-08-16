const { expect } = require("chai");

let vals, users, rollup, accounts, oracle;

describe("Schrodinger's Rollup Tests", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  beforeEach(async function () {
    accounts = await ethers.getSigners();
    sequencer = accounts[10]
    val1 = ethers.Wallet.createRandom()
    val2 = ethers.Wallet.createRandom()
    val3 = ethers.Wallet.createRandom()
    vals = [val1,val2,val3]
    users = [val1.address, val2.address, val3.address]
    const Oracle = await ethers.getContractFactory("Oracle");
    oracle = await Oracle.deploy(sequencer.address);
    const ScrodingerRollup = await ethers.getContractFactory("SchrodingerRollup");
    rollup = await ScrodingerRollup.deploy(oracle.target);
  });

  describe("Deployment", function () {
    it("Should deploy correctly", async function () {
      expect(await rollup.forks()).to.equal(0);
      expect(await rollup.oracle()).to.equal(oracle.target);
      expect(await rollup.settlementTime()).to.equal(60);
      expect(await rollup.deviationThreshold()).to.equal(5);
    });
  });

  describe("PostBlobs", function () {
    it("Should store txns", async function () {
      expect(await rollup._isWithinRange(100,100))
      txns = "0x1234"
      await oracle.connect(sequencer).updatePrices(100,100)
      await rollup.connect(accounts[1]).postBlob(txns);
      expect(await rollup.forks()).to.equal(0);
      expect(await rollup.rollupBlockNumber()).to.equal(1);
      expect(await rollup.lastFinalBlockNumber()).to.equal(1);
      let hashes = await rollup.getTxnByBlock(0)
      expect(await hashes  == txns)
      expect(await rollup.prices(0)).to.equal(100);
    });
    // it("Should store proper price", async function () {
    //   expect(1).to.equal(5);
    // });
  });
  // describe("Handle Price Deviations -- Full Test", function () {
  //   it("Does 1 fork", async function () {
  //     expect(1).to.equal(5);
  //   });
  //   it("Does 3 forks and settles", async function () {
  //     expect(1).to.equal(5);
  //   });
  // });
});
