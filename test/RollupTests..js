const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

let vals, users, rollup;
async function generateMockTxns(){
  sigs = []
  txns = []
  let sig;
  for(i=0;i<4;i++){
    txns.push("0x1234")
    sig = await h.layerSign(txns[i], vals[i].privateKey)
    sigs.push(sig)
  }
  return {txns, sigs}
}

describe("Lock", function () {
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
    const ScrodingerRollup = await ethers.getContractFactory("SchrodingerRollup");
    rollup = await ScrodingerRollup.deploy(sequencer.address);
  });

  describe("Deployment", function () {
    it("Should set the right number of forks", async function () {
      expect(await rollup.forks()).to.equal(0);
      expect(await rollup.deviationThreshold()).to.equal(5);
    });
  });

  describe("PostBlobs", function () {
    it("Should store txns", async function () {
      let (txns,sigs) = generateMockTxns()
      await rollup.connect(sequencer).postBlob(txns,sigs,users,100,100);

      expect(1).to.equal(5);
    });
    it("Should store proper price", async function () {
      expect(1).to.equal(5);
    });
  });
  describe("Handle Price Deviations -- Full Test", function () {
    it("Does 1 fork", async function () {
      expect(1).to.equal(5);
    });
    it("Does 3 forks and settles", async function () {
      expect(1).to.equal(5);
    });
  });
});
