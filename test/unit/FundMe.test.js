const { deployments, getNamedAccounts, ethers, network } = require("hardhat");
const { assert, expect } = require("chai");
const { BigNumber } = require("ethers");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name) // if its on a testnet, don't run; else run.
  ? describe.skip
  : describe("FundMe", async function () {
      let fundMe;
      let deployer;
      let mockV3Aggregator;
      let sendValue = "1000000000000000000"; // 1 ETH.

      beforeEach(async function () {
        // the  first thing to do is to deploy the contract
        // using hardhat deploy
        deployer = await ethers.provider.getSigner();
        await deployments.fixture(["all"]); // this will deploy all the scripts that have the
        //"all" tag in the deploy folder
        fundMe = await ethers.getContractAt(
          "FundMe",
          (
            await deployments.get("FundMe")
          ).address,
          deployer
        ); // this will get the latest deployment of the fund me contract.
        // adding "deployer" after "FundMe" is state that any call to the FundMe contract is to be done via that
        // account.
        // Alternatively, If we don't want to use the deployer account, we can get all the list of accounts we
        // have added to a particular chain in the hardhat-config file by doing:
        // const accounts = await ethers.getSigners();
        // const accountZero = accounts[0]; // and so on. . .
        mockV3Aggregator = await ethers.getContractAt(
          "MockV3Aggregator",
          (
            await deployments.get("MockV3Aggregator")
          ).address,
          deployer
        );
      });

      describe("constructor", async function () {
        it("sets the aggregator address correctly", async function () {
          const response = await fundMe.s_priceFeed();
          assert.equal(response, await mockV3Aggregator.getAddress());
        });
      });

      describe("fund", async function () {
        it("Fails if not enough eth is sent", async function () {
          await expect(fundMe.fund()).to.be.reverted;
        });

        it("Should correctly update the amounted funded data structure", async function () {
          await fundMe.fund({ value: sendValue }); // fund the contract
          const response = await fundMe.s_addressToAmountFunded(deployer); // get the amount mapped to the address
          assert.equal(response.toString(), sendValue.toString());
        });

        it("Should add funder to funder array", async function () {
          await fundMe.fund({ value: sendValue });
          const response = await fundMe.s_funders(0); // get the address of the first funder in the array
          assert.equal(response, deployer.address); // check if the address was correctly updated
        });
      });

      describe("withdraw", async function () {
        // we should ensure that we first fund the contract.
        beforeEach("Fund the contract", async function () {
          await fundMe.fund({ value: sendValue });
        });

        // Test to check if the asset in the contract is transferred.

        it("should withdraw eth from a single funder", async function () {
          // Arrange
          const fundMeStartingBalance = await ethers.provider.getBalance(
            fundMe.target
          );

          const deployerStartingBalance = await ethers.provider.getBalance(
            deployer.address
          );

          // Act
          const transactionResponse = await fundMe.withdraw();
          const transactionReciept = await transactionResponse.wait(1);
          const { gasUsed, gasPrice } = transactionReciept;
          const gasCost = gasUsed * gasPrice;

          const fundMeEndingBalance = await ethers.provider.getBalance(
            fundMe.target
          );

          const deployerEndingBalance = await ethers.provider.getBalance(
            deployer.address
          );

          // Assert
          assert.equal(fundMeEndingBalance, 0);
          assert.equal(
            (fundMeStartingBalance + deployerStartingBalance).toString(),
            (deployerEndingBalance + gasCost).toString()
          );
        });

        it("cheaper withdraw single", async function () {
          // Arrange
          const fundMeStartingBalance = await ethers.provider.getBalance(
            fundMe.target
          );

          const deployerStartingBalance = await ethers.provider.getBalance(
            deployer.address
          );

          // Act
          const transactionResponse = await fundMe.cheaperWithdraw();
          const transactionReciept = await transactionResponse.wait(1);
          const { gasUsed, gasPrice } = transactionReciept;
          const gasCost = gasUsed * gasPrice;

          const fundMeEndingBalance = await ethers.provider.getBalance(
            fundMe.target
          );

          const deployerEndingBalance = await ethers.provider.getBalance(
            deployer.address
          );

          // Assert
          assert.equal(fundMeEndingBalance, 0);
          assert.equal(
            (fundMeStartingBalance + deployerStartingBalance).toString(),
            (deployerEndingBalance + gasCost).toString()
          );
        });

        it("It should withdraw properly for multiple s_funders", async function () {
          const accounts = await ethers.getSigners(); // get a number of accounts
          for (i = 1; i < 6; i++) {
            // let each of the accounts fund the contract
            const fundMeConnectedContract = await fundMe.connect(accounts[i]);
            await fundMeConnectedContract.fund({ value: sendValue });
          }

          const fundMeStartingBalance = await ethers.provider.getBalance(
            fundMe.target
          );

          const deployerStartingBalance = await ethers.provider.getBalance(
            deployer.address
          );

          // Act
          const transactionResponse = await fundMe.withdraw();
          const transactionReciept = await transactionResponse.wait(1);
          const { gasUsed, gasPrice } = transactionReciept;
          const gasCost = gasUsed * gasPrice;

          const fundMeEndingBalance = await ethers.provider.getBalance(
            fundMe.target
          );

          const deployerEndingBalance = await ethers.provider.getBalance(
            deployer.address
          );

          // Assert

          assert.equal(fundMeEndingBalance, 0);
          assert.equal(
            (fundMeStartingBalance + deployerStartingBalance).toString(),
            (deployerEndingBalance + gasCost).toString()
          );

          // ensure that s_funders are reset properly
          await expect(fundMe.s_funders(0)).to.be.reverted;
          for (i = 1; i < 6; i++) {
            assert.equal(
              await fundMe.s_addressToAmountFunded(accounts[i].address),
              0
            );
          }
        });

        it("Should only allow owner to withdraw", async function () {
          const accounts = await ethers.getSigners(); // get the list of accounts. Note: accounts[0] is always
          // the deployer, and will be the owner of the contract
          const attacker = accounts[1];
          const connectedAttackerAccount = await fundMe.connect(attacker); //connect the attacking account to
          // the contract
          await expect(connectedAttackerAccount.withdraw()).to.be.reverted;
        });
      });
    });
