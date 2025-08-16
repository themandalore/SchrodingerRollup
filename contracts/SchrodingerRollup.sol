// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.19;

import "./Oracle.sol";

// /*
// TODO
// Make video presentation
//   - draw out diagram of multiple forks to explain
// Write validating Bridge 
// Make node 
// */

/// @title SchrodingerRollup
/// @dev This is an minimum-viable POA rollup
// its part based-rollup, part-trusted sequencer, but that's not the cool thing
// the cool piece of the rollup is that it forks the chain if there is a disagreement in the oracle price
// it keeps 2 potential rollup states for a while and then will later settle the chain
contract SchrodingerRollup{
  Oracle public oracle;
  uint256 public constant settlementTime = 1 minutes;
  uint256 public constant deviationThreshold = 5;//percent threshold to kick off a fork
  uint256 public rollupBlockNumber;
  uint256 public lastFinalBlockTime;
  uint256 public lastFinalBlockNumber;
  bytes[] public allTxns;
  uint256[] public prices;
  uint256 public forks;


  mapping(uint256 => uint256[3]) savedOraclePrices;//fork to prices,timestamp for comparison
  mapping(uint256 => mapping(bool => bytes[])) txnsByFork;//you save all the hashes in each side of the fork.
  mapping(uint256 => mapping(bool => uint256[])) pricesByFork;//you save all the hashes in each side of the fork.
  //if the final level agrees on a price or it's been past X blocks, you can merge them. 

    event DataPosted(bytes _calldata,uint256 _fastOracle,uint256 _slowOracle);
    event ForkInitiated(uint256 _rollupBlockNumber,uint256 _forks, uint256 _fastOracle,uint256 _slowOracle);
    event ForkClosed(uint256 _openForks);

  constructor(address _oracle){
    oracle = Oracle(_oracle);
  }

  function postBlob(bytes calldata _calldata) external{
    (uint256 _fastOracle, uint256 _slowOracle) = oracle.getPrices();
    if(_isWithinRange(_fastOracle,_slowOracle)){
      prices.push(_fastOracle);
      if(forks >0){
        uint256[3] memory _forkData;
        bytes[] memory _forkTxns;
        uint256[] memory _forkPrices;
        for(uint _f = forks;_f>0;_f--){
          _forkData = savedOraclePrices[_f];
          if(block.timestamp - _forkData[2] >= settlementTime){//must wait settlement time
            if(_isCloserA(_fastOracle,_forkData[1],_forkData[2])){//if it's closer to a
              _forkTxns = txnsByFork[_f][true];
              _forkPrices = pricesByFork[_f][true];
            }
            else{
              _forkTxns = txnsByFork[_f][false];
              _forkPrices = pricesByFork[_f][false];
            }
            for(uint256 _l = 0;_l < _forkTxns.length;_l++){
                if(_f == 1){
                  allTxns.push(_forkTxns[_l]);
                  prices.push(_forkPrices[_l]);
                }
                else{
                  txnsByFork[_f -1][true].push(_forkTxns[_l]);
                  txnsByFork[_f -1][false].push(_forkTxns[_l]);
                  pricesByFork[_f -1][true].push(_forkPrices[_l]);
                  pricesByFork[_f -1][false].push(_forkPrices[_l]);
                  forks--;
                  emit ForkClosed(forks);
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
      emit ForkInitiated(rollupBlockNumber, forks, _fastOracle, _slowOracle);
      savedOraclePrices[forks] = [_fastOracle,_slowOracle,block.timestamp];
    }
    _storeTxns(_calldata,_fastOracle,_slowOracle);
    emit DataPosted(_calldata, _fastOracle, _slowOracle);
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

  function _storeTxns(bytes memory _calldata, uint256 _fast, uint256 _slow) internal{
    if(forks > 0){
        txnsByFork[forks][true].push(_calldata);
        txnsByFork[forks][false].push(_calldata);
        pricesByFork[forks][true].push(_fast);
        pricesByFork[forks][false].push(_slow);
    }
    else{
      allTxns.push(_calldata);
      rollupBlockNumber++;
      lastFinalBlockTime = block.timestamp;
      lastFinalBlockNumber = rollupBlockNumber;
    }
  }

  function _isWithinRange(uint256 _fast, uint256 _slow) public pure returns(bool){
    if(_fast == _slow){
      return true;
    }
    if(_fast > _slow){
      return ((_fast*1000000 - _slow*1000000)/ _slow * 1000000)> deviationThreshold;
    }
    else{
      return ((_slow*1000000 - _fast*1000000)/ _slow * 1000000)> deviationThreshold;
    }
  }

    function getTxnByBlock(uint256 _a) external view returns(bytes memory){
      return allTxns[_a];
    }
}