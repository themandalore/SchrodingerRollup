// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/*
TODO
Add pretty comments
Make video presentation
  - draw out diagram of multiple forks to explain
write working test
Add validation
Have way to transfer to and from rollup with assets
*/

contract SchrodingerRollup {
  uint256 public constant settlementTime = 1 minutes;
  uint256 public constant deviationThreshold = 5;//percent threshold to kick off a fork
  uint256 public rollupBlockNumber;
  uint256 public lastFinalBlock;
  bytes[][] public allHashes;
  uint256[] public prices;
  uint256 public forks;
  mapping(uint256 => uint256[3]) savedOraclePrices;//fork to prices,timestamp for comparison
  mapping(uint256 => mapping(bool => bytes[][])) hashesByFork;//you save all the hashes in each side of the fork.
  //if the final level agrees on a price or it's been past X blocks, you can merge them. 


  function postBlob(bytes[] memory _txns,uint256 _fastOracle, uint256 _slowOracle) external{
    if(_isWithinRange(_fastOracle,_slowOracle)){
      prices.push(_fastOracle);
      if(forks >0){
        uint256[3] memory _forkData;
        bytes[][] memory _forkTxns;
        for(uint _f = forks;_f>0;_f--){
          _forkData = savedOraclePrices[_f];
          if(block.timestamp - _forkData[2] >= settlementTime){//must wait settlement time
            if(_isCloserA(_fastOracle,_forkData[1],_forkData[2])){//if it's closer to a
              _forkTxns = hashesByFork[_f][true];
            }
            else{
              _forkTxns = hashesByFork[_f][false];
            }
            for(uint256 _l = 0;_l < _forkTxns.length;_l++){
                if(_f == 1){
                  allHashes.push(_forkTxns[_l]);
                }
                else{
                  hashesByFork[_f -1][true].push(_forkTxns[_l]);
                  hashesByFork[_f -1][false].push(_forkTxns[_l]);
                }
              }
          }
          else{
            break;//stop the close out if not settled
          }
        }
      }
    }
    else{
      forks++;
      savedOraclePrices[forks] = [_fastOracle,_slowOracle,block.timestamp];
    }
    _storeTxns(_txns);
  }

  function _isCloserA(uint256 _comp,uint256 _a,uint _b) internal pure returns(bool){
    uint _c1;
    uint _c2;
    if(_comp >= _a){
      _c1 = _comp - _a;
    }
    else{
      _c1 = _a - _comp;
    }
    if(_comp >= _b){
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

  function _storeTxns(bytes[] memory _txns) internal{
    if(forks > 0){
        hashesByFork[forks][true].push(_txns);
        hashesByFork[forks][false].push(_txns);
    }
    else{
      allHashes.push(_txns);
      rollupBlockNumber++;
      lastFinalBlock = block.timestamp;
    }
  }

  function _isWithinRange(uint256 _fast, uint256 _slow) internal view returns(bool){
    if(_fast > _slow){
      return ((_fast*1000000 - _slow*1000000)/ _slow * 1000000)> deviationThreshold;
    }
    else{
      return ((_slow*1000000 - _fast*1000000)/ _slow * 1000000)> deviationThreshold;
    }
  }

  //do we need this?
  // function _verifyTransactions(){
  // }

}
