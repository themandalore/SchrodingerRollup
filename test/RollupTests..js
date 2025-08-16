const { expect } = require("chai");
const {bytecode} = require("../artifacts/contracts/TestToken.sol/TestToken.json");
const h = require("./helpers/evmHelpers");

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

      // encode the data from smart contract method
      // const data = await myContract.methods
      // .demoNow(randomNumber, handleId)
      // .encodeABI();
      console.log(vals[1].address)
      // call the signTransaction
        let signedTx = await vals[1].signTransaction({
          from: vals[1].address,
          to: null,
          nonce: 0,
          gasPrice: 10,
          gasLimit: 5000000,
          value: 0,
          data: bytecode
        });
      console.log(signedTx)
      await oracle.connect(sequencer).updatePrices(100,100)
      await rollup.connect(accounts[1]).postBlob(signedTx);

      expect(await rollup.forks()).to.equal(0);
      expect(await rollup.rollupBlockNumber()).to.equal(1);
      expect(await rollup.lastFinalBlockNumber()).to.equal(1);
      let hashes = await rollup.getTxnByBlock(0)
      expect(await hashes  == signedTx)
      await h.postOnRollup(hashes);
      expect(await rollup.prices(0)).to.equal(100);
    });
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
