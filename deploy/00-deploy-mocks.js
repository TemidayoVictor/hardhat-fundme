const { network } = require("hardhat");
const {
  developmentChains,
  DECIMALS,
  INITIAL_ANSWER,
} = require("../helper-hardhat-config");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  //  Only deploy this script if the current chain is a development chain i.e. localhost or hardhat
  if (developmentChains.includes(network.name)) {
    log("Local Network detected. Deploying Mocks. . . ");
    // deploy the mockV3Aggregator
    await deploy("MockV3Aggregator", {
      contract: "MockV3Aggregator",
      from: deployer,
      log: true,
      args: [DECIMALS, INITIAL_ANSWER], // args are the arguments for the constructor
    });

    log("Mocks Deployed !!!");
    log(
      "-----------------------------------------------------------------------"
    );
  } else {
    log("Testnet detected, Mocks not Deployed");
    log(
      "-----------------------------------------------------------------------"
    );
  }
};

module.exports.tags = ["all", "mocks"];
