const { run, ethers, artifacts } = require('hardhat');

const abis = require('../deployed/abis-rinkeby.json');
const rinkeby_addresses = require('../deployed/deployed-rinkeby.json');
const daiMock = "0x924C5F01759bdB5cF37e9c9755d61ab3f39f5Ae1";
async function main() {
    
}

main()
.then(() => process.exit(0))
.catch((error) => {
	console.error(error)
	process.exit(1)
})
