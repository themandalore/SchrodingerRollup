# Schrödinger's Rollup

<p align="center">
    <img src= './public/scat.jpg' width="250" height="200" alt='tellor.io' />
</p>


<b>Schrodinger's Rollup</b> is a rollup contract for ambiguous oracle states. If the fast oracle (should be the price formation exchange) and the slow oracle (ideally a TWAP median of multiple exchanges), differ by some threshold, you temporarily fork the chain.  Now you have two universes for the rollup, one where the price moved and one where it didn’t.  Then we wait a certain period of time (like 30 seconds) and then see whether or not the new price is closer to the fast fork or the slow fork.  Then we take that path as the canonical chain.  


This repository includes an MVP based-rollup that accepts on-chain oracle prices and forks based on their deviations.  Most of the time, it's a normal based rollup: users can post their transactions to Ethereum and then it’s part of our rollup block.  In the case that the price feeds are different though, you can pick fast fork, slow fork, or both, and then we store two different universes of transactions and then pick which universe to keep after the prices converge.  

Note that bridges should take caution to only release funds on the rollup in the case of non-contentious state (e.g. the user is okay to do a transaction on both sides of the fork).  This repository does not include the validating bridge. 


#### Clone project and install dependencies

```bash
git clone git@github.com:themandalore/SchrodingerRollup.git
```
```
npm i
npx hardhat compile
```

#### How to Use
Just create a signed transaction and post blobs: 

Here is the main function:
```solidity
  function postBlob(bytes calldata _signedTx, uint8 _forkChoice) external{}
```


#### Testing:

Hardhat: 

```bash
npx hardhat test
```


#### Maintainers <a name="maintainers"> </a>
[@themandalore](https://github.com/themandalore)