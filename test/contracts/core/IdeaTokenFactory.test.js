const { expect } = require('chai')
const { BigNumber } = require('ethers')
const { ethers } = require('hardhat')

describe('core/IdeaTokenFactory', () => {
	let DomainNoSubdomainNameVerifier
	let IdeaTokenFactory

	const tokenName = 'example.com'
	const marketName = 'testMarket'
	const baseCost = BigNumber.from('1000000000000000000') // 10**18
	const priceRise = BigNumber.from('100000000000000000') // 10**17
	const tradingFeeRate = BigNumber.from('100')
	const platformFeeRate = BigNumber.from('50')

	let userAccount
	let adminAccount
	let ideaTokenExchangeAddress
	const zeroAddress = '0x0000000000000000000000000000000000000000'

	let ideaTokenFactory

	before(async () => {
		const accounts = await ethers.getSigners()
		userAccount = accounts[0]
		adminAccount = accounts[1]
		ideaTokenExchangeAddress = accounts[2].address

		DomainNoSubdomainNameVerifier = await ethers.getContractFactory('DomainNoSubdomainNameVerifier')
		IdeaTokenFactory = await ethers.getContractFactory('IdeaTokenFactory')
	})

	beforeEach(async () => {
		ideaTokenFactory = await IdeaTokenFactory.connect(adminAccount).deploy()
		await ideaTokenFactory.deployed()
		await ideaTokenFactory.connect(adminAccount).initialize(adminAccount.address, ideaTokenExchangeAddress)
	})

	it('admin is owner', async () => {
		expect(adminAccount.address).is.equal(await ideaTokenFactory.getOwner())
	})

	it('can add market', async () => {
		const nameVerifier = await DomainNoSubdomainNameVerifier.deploy()
		await nameVerifier.deployed()
		await ideaTokenFactory
			.connect(adminAccount)
			.addMarket(marketName, nameVerifier.address, baseCost, priceRise, tradingFeeRate, platformFeeRate)

		expect(BigNumber.from('1').eq(await ideaTokenFactory.getNumMarkets())).to.be.equal
		expect(BigNumber.from('1').eq(await ideaTokenFactory.getMarketIDByName(marketName))).to.be.equal

		const marketDetailsByID = await ideaTokenFactory.getMarketDetailsByID(BigNumber.from('1'))
		const marketDetailsByName = await ideaTokenFactory.getMarketDetailsByName(marketName)

		expect(marketDetailsByID.exists).to.be.true
		expect(marketDetailsByID.id.eq(BigNumber.from('1'))).to.be.true
		expect(marketDetailsByID.name).to.be.equal(marketName)
		expect(marketDetailsByID.nameVerifier).to.be.equal(nameVerifier.address)
		expect(marketDetailsByID.numTokens.eq(BigNumber.from('0'))).to.be.true
		expect(marketDetailsByID.baseCost.eq(baseCost)).to.be.true
		expect(marketDetailsByID.priceRise.eq(priceRise)).to.be.true
		expect(marketDetailsByID.tradingFeeRate.eq(tradingFeeRate)).to.be.true
		expect(marketDetailsByID.platformFeeRate.eq(platformFeeRate)).to.be.true

		expect(marketDetailsByName.exists).to.be.true
		expect(marketDetailsByName.id.eq(BigNumber.from('1'))).to.be.true
		expect(marketDetailsByName.name).to.be.equal(marketName)
		expect(marketDetailsByName.nameVerifier).to.be.equal(nameVerifier.address)
		expect(marketDetailsByName.numTokens.eq(BigNumber.from('0'))).to.be.true
		expect(marketDetailsByName.baseCost.eq(baseCost)).to.be.true
		expect(marketDetailsByName.priceRise.eq(priceRise)).to.be.true
		expect(marketDetailsByName.tradingFeeRate.eq(tradingFeeRate)).to.be.true
		expect(marketDetailsByName.platformFeeRate.eq(platformFeeRate)).to.be.true
	})

	it('fail add market with same name', async () => {
		const nameVerifier = await DomainNoSubdomainNameVerifier.deploy()
		await nameVerifier.deployed()
		await ideaTokenFactory
			.connect(adminAccount)
			.addMarket(marketName, nameVerifier.address, baseCost, priceRise, tradingFeeRate, platformFeeRate)

		await expect(
			ideaTokenFactory
				.connect(adminAccount)
				.addMarket(marketName, nameVerifier.address, baseCost, priceRise, tradingFeeRate, platformFeeRate)
		).to.be.revertedWith('addMarket: market exists already')
	})

	it('checks parameters when adding market', async () => {
		await expect(
			ideaTokenFactory
				.connect(adminAccount)
				.addMarket(
					marketName,
					'0x0000000000000000000000000000000000000000',
					BigNumber.from('0'),
					priceRise,
					tradingFeeRate,
					platformFeeRate
				)
		).to.be.revertedWith('addMarket: invalid parameters')

		await expect(
			ideaTokenFactory
				.connect(adminAccount)
				.addMarket(
					marketName,
					'0x0000000000000000000000000000000000000000',
					baseCost,
					BigNumber.from('0'),
					tradingFeeRate,
					platformFeeRate
				)
		).to.be.revertedWith('addMarket: invalid parameters')
	})

	it('only admin can add market', async () => {
		await expect(
			ideaTokenFactory
				.connect(userAccount)
				.addMarket(
					marketName,
					'0x0000000000000000000000000000000000000000',
					baseCost,
					priceRise,
					tradingFeeRate,
					platformFeeRate
				)
		).to.be.revertedWith('Ownable: onlyOwner')
	})

	it('can add token', async () => {
		const nameVerifier = await DomainNoSubdomainNameVerifier.deploy()
		await nameVerifier.deployed()
		await ideaTokenFactory
			.connect(adminAccount)
			.addMarket(marketName, nameVerifier.address, baseCost, priceRise, tradingFeeRate, platformFeeRate)

		await ideaTokenFactory.addToken(tokenName, BigNumber.from('1'))

		const marketDetails = await ideaTokenFactory.getMarketDetailsByID(BigNumber.from('1'))

		expect(marketDetails.exists).to.be.true
		expect(marketDetails.id.eq(BigNumber.from('1'))).to.be.true
		expect(marketDetails.name).to.be.equal(marketName)
		expect(marketDetails.nameVerifier).to.be.equal(nameVerifier.address)
		expect(marketDetails.numTokens.eq(BigNumber.from('1'))).to.be.true
		expect(marketDetails.baseCost.eq(baseCost)).to.be.true
		expect(marketDetails.priceRise.eq(priceRise)).to.be.true
		expect(marketDetails.tradingFeeRate.eq(tradingFeeRate)).to.be.true
		expect(marketDetails.platformFeeRate.eq(platformFeeRate)).to.be.true
	})

	it('fail add token with invalid name', async () => {
		const nameVerifier = await DomainNoSubdomainNameVerifier.deploy()
		await nameVerifier.deployed()
		await ideaTokenFactory
			.connect(adminAccount)
			.addMarket(marketName, nameVerifier.address, baseCost, priceRise, tradingFeeRate, platformFeeRate)

		await expect(ideaTokenFactory.addToken('some.invalid.name', BigNumber.from('1'))).to.be.revertedWith(
			'addToken: name verification failed'
		)
	})

	it('fail add token with same name twice', async () => {
		const nameVerifier = await DomainNoSubdomainNameVerifier.deploy()
		await nameVerifier.deployed()
		await ideaTokenFactory
			.connect(adminAccount)
			.addMarket(marketName, nameVerifier.address, baseCost, priceRise, tradingFeeRate, platformFeeRate)

		await ideaTokenFactory.addToken(tokenName, BigNumber.from('1'))
		await expect(ideaTokenFactory.addToken(tokenName, BigNumber.from('1'))).to.be.revertedWith(
			'addToken: name verification failed'
		)
	})

	it('fail add token invalid market', async () => {
		const nameVerifier = await DomainNoSubdomainNameVerifier.deploy()
		await nameVerifier.deployed()
		await ideaTokenFactory
			.connect(adminAccount)
			.addMarket(marketName, nameVerifier.address, baseCost, priceRise, tradingFeeRate, platformFeeRate)

		await ideaTokenFactory.addToken(tokenName, BigNumber.from('1'))
		await expect(ideaTokenFactory.addToken(tokenName, BigNumber.from('2'))).to.be.revertedWith(
			'addToken: market does not exist'
		)
	})

	it('can set trading fee', async () => {
		await ideaTokenFactory
			.connect(adminAccount)
			.addMarket(marketName, zeroAddress, baseCost, priceRise, tradingFeeRate, platformFeeRate)

		await ideaTokenFactory.connect(adminAccount).setTradingFee(BigNumber.from('1'), BigNumber.from('123'))
		const marketDetails = await ideaTokenFactory.getMarketDetailsByID(BigNumber.from('1'))
		expect(marketDetails.tradingFeeRate).to.be.equal('123')
	})

	it('fail user sets trading fee', async () => {
		await ideaTokenFactory
			.connect(adminAccount)
			.addMarket(marketName, zeroAddress, baseCost, priceRise, tradingFeeRate, platformFeeRate)

		await expect(
			ideaTokenFactory.connect(userAccount).setTradingFee(BigNumber.from('1'), BigNumber.from('123'))
		).to.be.revertedWith('Ownable: onlyOwner')
	})

	it('fail set trading fee invalid market', async () => {
		await ideaTokenFactory
			.connect(adminAccount)
			.addMarket(marketName, zeroAddress, baseCost, priceRise, tradingFeeRate, platformFeeRate)

		await expect(
			ideaTokenFactory.connect(adminAccount).setTradingFee(BigNumber.from('2'), BigNumber.from('123'))
		).to.be.revertedWith('setTradingFee: market does not exist')
	})

	it('can set platform fee', async () => {
		await ideaTokenFactory
			.connect(adminAccount)
			.addMarket(marketName, zeroAddress, baseCost, priceRise, tradingFeeRate, platformFeeRate)

		await ideaTokenFactory.connect(adminAccount).setPlatformFee(BigNumber.from('1'), BigNumber.from('123'))
		const marketDetails = await ideaTokenFactory.getMarketDetailsByID(BigNumber.from('1'))
		expect(marketDetails.platformFeeRate).to.equal('123')
	})

	it('fail user sets platform fee', async () => {
		await ideaTokenFactory
			.connect(adminAccount)
			.addMarket(marketName, zeroAddress, baseCost, priceRise, tradingFeeRate, platformFeeRate)

		await expect(
			ideaTokenFactory.connect(userAccount).setPlatformFee(BigNumber.from('1'), BigNumber.from('123'))
		).to.be.revertedWith('Ownable: onlyOwner')
	})

	it('fail set platform fee invalid market', async () => {
		await ideaTokenFactory
			.connect(adminAccount)
			.addMarket(marketName, zeroAddress, baseCost, priceRise, tradingFeeRate, platformFeeRate)

		await expect(
			ideaTokenFactory.connect(adminAccount).setPlatformFee(BigNumber.from('2'), BigNumber.from('123'))
		).to.be.revertedWith('setPlatformFee: market does not exist')
	})
})
