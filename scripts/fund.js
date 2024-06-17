const { getNamedAccounts, ethers } = require("hardhat");

// This scripts is designed to help us fund our contract
async function main() {
  const { deployer } = await getNamedAccounts(); // get the account to be used to deploy
  const fundMe = await ethers.getContractAt("FundMe", deployer);
  const transactionResponse = await fundMe.fund({
    value: "1000000000000000000",
  }); // fund the contract with 1ETH
  await transactionResponse.wait(1); //wait for one block
  console.log("Contract Funded");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
