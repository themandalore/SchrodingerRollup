// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.19;

import {ECDSA} from "./ECDSA.sol";
import "./Constants.sol";

/// @title Oracle
/// @dev a centralized oracle for pushing prices
contract Oracle {
    uint256 fastPrice;
    uint256 slowPrice;
    address guardian;
    string constant asset = "TRB/USD";

    constructor(address _guardian){
        guardian = _guardian;
    }

    function getPrices() external view returns(uint256,uint256){
        return (fastPrice, slowPrice);
    }

    function updatePrices(uint256 _fast, uint256 _slow) external{

        fastPrice = _fast;
        slowPrice = _slow;
    }

}