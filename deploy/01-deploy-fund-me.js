const { network } = require("hardhat");
const {
  networkConfig,
  developmentChains,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");
require("dotenv").config();

// 1st way to deploy

// function deployFunc() {
//   console.log("Hi!!!");
// }

// module.exports.default = deployFunc;

// 2nd way to deploy

// module.exports = async (hre) => {
//   const { getNamedAccounts, deployments } = hre;
// };

// 3rd way to deploy

// To ensure that the PriceFeed Address that is used is based on the chain we are on.

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log, get } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  // When going for localhost or hardhat network, we want to use a mock.
  // If ethUsdPriceFeedAddress does not exist for the network(local testing),
  // we deploy a minimal version.

  let ethUsdPriceFeedAddress;
  if (developmentChains.includes(network.name)) {
    // that is if we are on a development chain [hardhat, localhost]
    const ethUsdAggregator = await get("MockV3Aggregator"); // this will get the latest deployment of MockV3Aggregator.
    ethUsdPriceFeedAddress = ethUsdAggregator.address;
  } else {
    ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
  }

  const args = [ethUsdPriceFeedAddress];

  const fundMe = await deploy("FundMe", {
    from: deployer,
    args: args, // The aim of setting this here, is to ensure that regardless of the chain
    // we are on, we wont have to hard code the address for the Aggregator. We can just set it when we are
    // about to deploy the contract.
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  // verify contract if it is being deployed to a testnet
  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(fundMe.address, args);
  } else {
    log("Development Chain Detected, Verification procedure skipped");
  }

  log(
    "-----------------------------------------------------------------------"
  );
};

module.exports.tags = ["all", "fundme"];
