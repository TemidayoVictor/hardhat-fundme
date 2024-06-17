const { deployments, getNamedAccounts, ethers, network } = require("hardhat");
const { assert, expect } = require("chai");
const { BigNumber } = require("ethers");
const { developmentChains } = require("../../helper-hardhat-config");

developmentChains.includes(network.name) // if its on a testnet, don't run; else run.
  ? describe.skip
  : describe("FundMe", async function () {
      let fundMe;
      let deployer;
      let sendValue = "1000000000000000000";

      beforeEach(async function () {
        // the  first thing to do is to deploy the contract
        // using hardhat deploy
        deployer = await ethers.provider.getSigner(); // account of the deployer
        fundMe = await ethers.getContractAt(
          "FundMe",
          (
            await deployments.get("FundMe")
          ).address,
          deployer
        );
      });

      it("allows users to fund the contract and withdraw from the contract", async function () {
        await fundMe.fund({ value: sendValue }); // fund the contract
        await fundMe.withdraw();
        const endingBalance = await ethers.provider.getBalance(fundMe.target);
        assert.equal(endingBalance.toString(), 0);
      });
    });
