const web3 = require('web3');
const { ethers, network } = require("hardhat");
const hash = ethers.keccak256;
var assert = require('assert');
const abiCoder = new ethers.AbiCoder();



getEthSignedMessageHash = (messageHash) => {
  const prefix = "\x19Ethereum Signed Message:\n32";
  const messageHashBytes = ethers.utils.arrayify(messageHash);
  const prefixBytes = ethers.utils.toUtf8Bytes(prefix);
  const combined = ethers.utils.concat([prefixBytes, messageHashBytes]);
  const digest = ethers.utils.keccak256(combined);
  return digest;
}

getDataDigest = (queryId, value, timestamp, aggregatePower, previousTimestamp, nextTimestamp, valCheckpoint, blockTimestamp) => {
  const DOMAIN_SEPARATOR = "0x74656c6c6f7243757272656e744174746573746174696f6e0000000000000000"
  enc = abiCoder.encode(["bytes32", "bytes32", "bytes", "uint256", "uint256", "uint256", "uint256", "bytes32", "uint256"],
    [DOMAIN_SEPARATOR, queryId, value, timestamp, aggregatePower, previousTimestamp, nextTimestamp, valCheckpoint, blockTimestamp])
  return hash(enc)
}

domainSeparateOracleAttestationData = (attestationData, valCheckpoint) => {
  const DOMAIN_SEPARATOR = "0x74656c6c6f7243757272656e744174746573746174696f6e0000000000000000"
  enc = abiCoder.encode(["bytes32", "bytes32", "bytes", "uint256", "uint256", "uint256", "uint256", "bytes32", "uint256"],
    [DOMAIN_SEPARATOR, attestationData.queryId, attestationData.report.value, attestationData.report.timestamp, attestationData.report.aggregatePower, attestationData.report.previousTimestamp, attestationData.report.nextTimestamp, valCheckpoint, attestationData.attestTimestamp])

  // print everything
  console.log("DOMAIN_SEPARATOR", DOMAIN_SEPARATOR)
  console.log("attestationData.queryId", attestationData.queryId)
  console.log("attestationData.report.value", attestationData.report.value)
  console.log("attestationData.report.timestamp", attestationData.report.timestamp)
  console.log("attestationData.report.aggregatePower", attestationData.report.aggregatePower)
  console.log("attestationData.report.previousTimestamp", attestationData.report.previousTimestamp)
  console.log("attestationData.report.nextTimestamp", attestationData.report.nextTimestamp)
  console.log("valCheckpoint", valCheckpoint)
  console.log("attestationData.attestTimestamp", attestationData.attestTimestamp)
  console.log("dataDigest", hash(enc))
  console.log("enc", enc)
  return hash(enc)
}

getValSetStructArray = (valAddrs, powers) => {
  structArray = []
  for (i = 0; i < valAddrs.length; i++) {
    structArray[i] = {
      addr: valAddrs[i],
      power: powers[i]
    }
  }
  return structArray
}

getSigStructArray = (sigs) => {
  structArray = []
  for (i = 0; i < sigs.length; i++) {
    let { v, r, s } = ethers.utils.splitSignature(sigs[i])
    structArray[i] = {
      v: abiCoder.encode(["uint8"], [v]),
      r: abiCoder.encode(["bytes32"], [r]),
      s: abiCoder.encode(["bytes32"], [s])
    }
  }
  return structArray
}

getOracleDataStruct = (queryId, value, timestamp, aggregatePower, previousTimestamp, nextTimestamp, attestTimestamp) => {
  return {
    queryId: queryId,
    report: {
      value: value,
      timestamp: timestamp,
      aggregatePower: aggregatePower,
      previousTimestamp: previousTimestamp,
      nextTimestamp: nextTimestamp
    },
    attestTimestamp: attestTimestamp
  }
}

layerSign = (message, privateKey) => {
  // assumes message is bytesLike
  messageHash = ethers.utils.sha256(message)
  signingKey = new ethers.utils.SigningKey(privateKey)
  signature = signingKey.signDigest(messageHash)
  return signature
}

advanceTimeAndBlock = async (time) => {
  await advanceTime(time);
  await advanceBlock();
  console.log("Time Travelling...");
  return Promise.resolve(web3.eth.getBlock("latest"));
};

const takeFifteen = async () => {
  await advanceTime(60 * 18);
};

advanceTime = async (time) => {
  await network.provider.send("evm_increaseTime", [time])
  await network.provider.send("evm_mine")
}

advanceBlock = () => {
  return new Promise((resolve, reject) => {
    web3.currentProvider.send(
      {
        jsonrpc: "2.0",
        method: "evm_mine",
        id: new Date().getTime(),
      },
      (err, result) => {
        if (err) {
          return reject(err);
        }
        const newBlockHash = web3.eth.getBlock("latest").hash;

        return resolve(newBlockHash);
      }
    );
  });
};

async function expectThrow(promise) {
  try {
    await promise;
  } catch (error) {
    const invalidOpcode = error.message.search("invalid opcode") >= 0;
    const outOfGas = error.message.search("out of gas") >= 0;
    const revert = error.message.search("revert") >= 0;
    assert(
      invalidOpcode || outOfGas || revert,
      "Expected throw, got '" + error + "' instead"
    );
    return;
  }
  assert.fail("Expected throw not received");
}

function to18(n) {
  return ethers.BigNumber.from(n).mul(ethers.BigNumber.from(10).pow(18))
}

function tob32(n) {
  return ethers.utils.formatBytes32String(n)
}

function uintTob32(n) {
  let vars = web3.utils.toHex(n)
  vars = vars.slice(2)
  while (vars.length < 64) {
    vars = "0" + vars
  }
  vars = "0x" + vars
  return vars
}

function bytes(n) {
  return web3.utils.toHex(n)
}

function getBlock() {
  return ethers.provider.getBlock()
}

function toWei(n) {
  return web3.utils.toWei(n, "ether")
}

function fromWei(n) {
  return web3.utils.fromWei(n)
}

function sleep(s) {
  return new Promise(resolve => setTimeout(resolve, s * 1000));
}

module.exports = {
  timeTarget: 240,
  hash,
  zeroAddress: "0x0000000000000000000000000000000000000000",
  to18,
  uintTob32,
  tob32,
  bytes,
  getBlock,
  advanceTime,
  advanceBlock,
  advanceTimeAndBlock,
  takeFifteen,
  toWei,
  fromWei,
  expectThrow,
  sleep,
  getEthSignedMessageHash,
  getDataDigest,
  domainSeparateOracleAttestationData,
  layerSign
};

