// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract SchrodingerRollup {
  
  uint256 settlementTime = 1 minutes;
  uint256 deviationThreshold = 5;//percent threshold to kick off a fork
  bytes32 currentHash;
  uint256 lastFinalBlock;
  bytes32[] allHashes;
  uint256[] prices;

  uint256 forks;
  mapping(uint256 => uint256[3]) savedOraclePrices;//fork to prices,timestamp for comparison
  mapping(uint256 => mapping(bool => bytes32[])) hashesByFork;//you save all the hashes in each side of the fork.
  //if the final level agrees on a price or it's been past X blocks, you can merge them. 
  constructor{
    forks = 0;
  }
  function postBlob(bytes[] memory _txns,uint256 _fastOracle, uint256 _slowOracle) external{
    if(_isWithinRange(_fastOracle,_slowOracle)){
      prices.push(_fastOracle);
      if(forks >0){
        uint256[3] _forkData;
        bytes32[] _forkTxns;
        for(uint _f = forks;_f>0;_f--){
          _forkData = savedOraclePrices[_f];
          if(block.timestamp - _forkData[2] >= settlementTime){//must wait settlement time
            if(_isCloserA(_fastData,_forkData[1],_forkData[2])){//if it's closer to a
              _forkTxns = hashesByFork[f,true];
            }
            else{
              _forkTxns = hashesByFork[f,false];
            }
              for(uint256 _l = 0,l < _forkTxns.length,_l++){
                if(_f = 1){
                  currentHash.push(_forkTxns[_l])
                }
                else{
                  hashesByFork[f -1,true].push(_forkTxns[_l])
                  hashesByFork[f -1,false].push(_forkTxns[_l])
                }
              }
          }
          else{
            break;//just keep adding if not settled
          }
        }
      }
    }
    else if{
      forks++;
      savedOraclePrices[_forks] = [_fastOracle,_slowOracle,block.timestamp];
    }
    _storeTxns(_txns, _fastOracle, _slowOracle);
  }

  function _isCloserA(uint256 _comp,uint256 _a,uint _b) returns(bool){
    uint _c1;
    uint _c2;
    if(_comp >= a){
      _c1 = _comp - _a;
    }
    else{
      _c1 = _a - _comp;
    }
    if(_comp >= b){
      _c2 = _comp - _b;
    }
    else{
      _c2 = _b - _comp;
    }
    if(_c1 <= _c2){
      return true;
    }
    return false;
  }

  function _storeTxns(bytes[] memory _txns, _fast, _slow){
    if(forks > 0){
        hashesByFork[forks,true].push(_txns)
        hashesByFork[forks,false].push(_txns);
    }
    else{
      allHashes.push(_txns);
      currentHash = keccak256(_txns);
      lastFinalBlock = block.timestamp;
    }
  }

  function _isWithinRange(uint256 _fast, uint256 _slow) returns(bool){
    if(_fast > _slow){
      return ((_fast*1000000 - _slow*1000000)/ _slow * 1000000)> deviationThreshold;
    }
    else{
      return ((_slow*1000000 - _fast*1000000)/ _slow * 1000000)> deviationThreshold;
    }
  }

  //do we need this?
  function _verifyTransactions(){
  }

}
