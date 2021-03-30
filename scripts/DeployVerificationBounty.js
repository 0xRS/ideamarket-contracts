const { run, ethers, artifacts } = require('hardhat')


async function main() {
    const deployerAccount = (await ethers.getSigners())[0]
	const deployerAddress = deployerAccount.address
	console.log(`Deploying from ${deployerAddress}`)
    const daiMock = "";
    const ite = "";
    const VerificationBounty = await hre.ethers.getContractFactory("VerificationBounty");
    const vb = await VerificationBounty.deploy(30*24*60*60, daiMock, ite);
    await vb.deployed();
    console.log(vb.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
