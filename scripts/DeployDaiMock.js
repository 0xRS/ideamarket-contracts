const { run, ethers, artifacts } = require('hardhat')


async function main() {
    const deployerAccount = (await ethers.getSigners())[0]
	const deployerAddress = deployerAccount.address
	console.log(`Deploying from ${deployerAddress}`)
    const DAI = await hre.ethers.getContractFactory("DaiMock");
    const dai = await DAI.deploy("DAIMock", "DAI");
    await dai.deployed();
    console.log(dai.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
