const { expect } = require("chai");
const {abi , bytecode} = require("../artifacts/contracts/TestToken.sol/TestToken.json");
const h = require("./helpers/evmHelpers");

let vals, users, rollup, accounts, testToken, oracle;

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
    deployer = new ethers.Wallet("0x2cd6f75146ff2464832ce81676f00c6e95b27344dda9f7b1f576c4870f2c1b1b",ethers.provider)
    const params = { from: accounts[1].address,to: deployer.address, value: ethers.parseUnits("1", "ether")};
    await accounts[1].sendTransaction(params);
    vals = [val1,val2,val3]
    users = [val1.address, val2.address, val3.address]
    const Oracle = await ethers.getContractFactory("Oracle");
    oracle = await Oracle.deploy(sequencer.address);
    const ScrodingerRollup = await ethers.getContractFactory("SchrodingerRollup");
    rollup = await ScrodingerRollup.deploy(oracle.target);
    const TestToken = await ethers.getContractFactory("TestToken");
    testToken = await TestToken.connect(deployer).deploy("MeowMeowToken","MMT");
    let signedTx = await deployer.signTransaction({
      from: deployer.address,
      to: null,
      gasPrice: 10,
      gasLimit: 5000000,
      value: 0,
      data: bytecode
    });
    await oracle.connect(sequencer).updatePrices(100,100)
    await rollup.connect(accounts[1]).postBlob(signedTx,0);
    let hashes = await rollup.getTxnByBlock(0)
    await h.postOnRollup(hashes);
    expect(await hashes  == signedTx)
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
    it("Post Data - Normal State", async function () {
      expect(await rollup._isWithinRange(100,100))
      expect(await rollup.forks()).to.equal(0);
      expect(await rollup.rollupBlockNumber()).to.equal(1);
      expect(await rollup.lastFinalBlockNumber()).to.equal(1);
      expect(await rollup.prices(0)).to.equal(100);
    });
    it("Post Data - Forked State", async function () {
      //encode the data from smart contract method
      const abi = [
        "function mint(address account, uint amount) returns(bool)",
      ];
      const provider = ethers.getDefaultProvider();
      const contract = new ethers.Contract(testToken.target, abi, provider);
      const action = 'mint'
      const params = [accounts[1].address,100]
      const method = contract.getFunction(action)
      const _data = await method.populateTransaction(...params)
      // call the signTransaction
        let signedTx = await vals[1].signTransaction({
          from: vals[1].address,
          to: testToken.target,
          gasPrice: 10,
          gasLimit: 5000000,
          value: 0,
          data:_data.data
        });
      await oracle.connect(sequencer).updatePrices(50,100)
      expect(await rollup._isWithinRange(50,100) == false)
      await rollup.connect(accounts[1]).postBlob(signedTx,0);
      expect(await rollup.isForked())
      expect(await rollup.forks()).to.equal(1);
      expect(await rollup.rollupBlockNumber()).to.equal(1);
      expect(await rollup.lastFinalBlockNumber()).to.equal(1);
      let hashes = await rollup.getTxnByBlock(0)
      expect(await hashes  == signedTx)
      await h.postOnRollup(hashes);
      expect(await rollup.prices(0)).to.equal(100);
      let savedPrices = await rollup.getSavedOraclePrices(1)
      expect(savedPrices[0]).to.equal(50)
      //now post in forked state, one to each state, one to both
    });
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
