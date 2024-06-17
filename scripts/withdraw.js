const { getNamedAccounts, ethers } = require("hardhat");

async function main() {
  const { deployer } = await getNamedAccounts();
  const FundMe = await ethers.getContractAt("FundMe", deployer);
  console.log("Funding. . .");
  const withdrawFunds = await FundMe.withdraw();
  await withdrawFunds.wait(1);
  console.log("Funds Withdrawn");
  console.log(
    "-----------------------------------------------------------------------"
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
