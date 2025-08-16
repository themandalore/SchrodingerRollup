// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.19;

import "./Oracle.sol";

//   _________      .__              .___.__                           /\        __________       .__  .__                
//  /   _____/ ____ |  |_________  __| _/|__| ____    ____   __________)/ ______ \______   \ ____ |  | |  |  __ ________  
//  \_____  \_/ ___\|  |  \_  __ \/ __ | |  |/    \  / ___\_/ __ \_  __ \/  ___/  |       _//  _ \|  | |  | |  |  \____ \ 
//  /        \  \___|   Y  \  | \/ /_/ | |  |   |  \/ /_/  >  ___/|  | \/\___ \   |    |   (  <_> )  |_|  |_|  |  /  |_> >
// /_______  /\___  >___|  /__|  \____ | |__|___|  /\___  / \___  >__|  /____  >  |____|_  /\____/|____/____/____/|   __/ 
//         \/     \/     \/           \/         \//_____/      \/           \/          \/                       |__|
/// @title SchrodingerRollup
/// @dev This is an minimum-viable POA rollup
// its part based-rollup, part-trusted sequencer, but that's not the cool thing
// the cool piece of the rollup is that it forks the chain if there is a disagreement in the oracle price
// it keeps 2 potential rollup states for a while and then will later settle the chain
contract SchrodingerRollup{
  
  uint256 public constant deviationThreshold = 5;//percent threshold to kick off a fork
  uint256 public constant settlementTime = 1 minutes;
  bytes[] public allTxns;
  uint256 public forks;
  bool public isForked;
  uint256 public lastFinalBlockNumber;
  uint256 public lastFinalBlockTime;
  uint256 public rollupBlockNumber;
  uint256[] public prices;
  Oracle public oracle;

  mapping(uint256 => uint256[3]) savedOraclePrices;//fork to prices,timestamp for comparison
  mapping(uint256 => mapping(bool => bytes[])) txnsByFork;//you save all the hashes in each side of the fork.
  mapping(uint256 => mapping(bool => uint256[])) pricesByFork;//you save all the hashes in each side of the fork.

  event DataPosted(bytes _signedTx,uint256 _fastOracle,uint256 _slowOracle);
  event ForkInitiated(uint256 _rollupBlockNumber,uint256 _forks, uint256 _fastOracle,uint256 _slowOracle);
  event ForkClosed(uint256 _openForks);

  constructor(address _oracle){
    oracle = Oracle(_oracle);
  }

  /**
    * @dev allows anyone to post a txn to the DA Layer making a rollup block
    * @param _signedTx a signedTx to be included on the rollup
    * @param _forkChoice 0 if both, 1 if true, 2 if false
    */
  function postBlob(bytes calldata _signedTx, uint8 _forkChoice) external{
    (uint256 _fastOracle, uint256 _slowOracle) = oracle.getPrices();
    if(_isWithinRange(_fastOracle,_slowOracle)){
      prices.push(_fastOracle);
      if(isForked){
        uint256[3] memory _forkData;
        bytes[] memory _forkTxns;
        uint256[] memory _forkPrices;
          _forkData = savedOraclePrices[forks];
          if(block.timestamp - _forkData[2] >= settlementTime){//must wait settlement time
            if(_isCloserA(_fastOracle,_forkData[1],_forkData[2])){//if it's closer to a
              _forkTxns = txnsByFork[forks][true];
              _forkPrices = pricesByFork[forks][true];
            }
            else{
              _forkTxns = txnsByFork[forks][false];
              _forkPrices = pricesByFork[forks][false];
            }
            for(uint256 _l = 0;_l < _forkTxns.length;_l++){
                allTxns.push(_forkTxns[_l]);
                prices.push(_forkPrices[_l]);
              }
          }
      }
    }
    else{
      if(!isForked){
        isForked = true;
        forks++;
        emit ForkInitiated(rollupBlockNumber, forks, _fastOracle, _slowOracle);
        savedOraclePrices[forks] = [_fastOracle,_slowOracle,block.timestamp];
      }
    }
    _storeTxns(_signedTx,_fastOracle,_slowOracle, _forkChoice);
    emit DataPosted(_signedTx, _fastOracle, _slowOracle);
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

  function _storeTxns(bytes memory _signedTx, uint256 _fast, uint256 _slow, uint8 _forkChoice) internal{
    if(isForked){
      if(_forkChoice != 1){
        txnsByFork[forks][false].push(_signedTx);
        pricesByFork[forks][false].push(_slow);
      }
      if(_forkChoice != 2){
        txnsByFork[forks][true].push(_signedTx);
        pricesByFork[forks][true].push(_fast);
      }
    }
    else{
      allTxns.push(_signedTx);
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