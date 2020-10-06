const { expectRevert } = require('@openzeppelin/test-helpers');

const DomainNoSubdomainNameVerifier = artifacts.require('DomainNoSubdomainNameVerifier')
const TestERC20 = artifacts.require('TestERC20')
const TestCDai = artifacts.require('TestCDai')
const InterestManagerCompound = artifacts.require('InterestManagerCompound')
const IdeaTokenFactory = artifacts.require('IdeaTokenFactory')
const IdeaTokenExchange = artifacts.require('IdeaTokenExchange')
const IdeaToken = artifacts.require('IdeaToken')

const BN = web3.utils.BN

contract('core/IdeaTokenExchange', async accounts => {

    const tenPow18 = new BN('10').pow(new BN('18'))

    const marketName = 'main'
    const tokenName = 'test.com'
    const baseCost = new BN('1000000000000000000') // 10**18
    const priceRise = new BN('100000000000000000') // 10**17
    const tokensPerInterval = new BN('100000000000000000000') // 10**20
    const tradingFeeRate = new BN('100')
    const tradingFeeRateScale = new BN('10000')

    const userAccount = accounts[0]
    const adminAccount = accounts[1]
    const tradingFeeAccount = accounts[2]
    const zeroAddress = '0x0000000000000000000000000000000000000000'

    let domainNoSubdomainNameVerifier
    let dai
    let cDai
    let interestManagerCompound
    let ideaTokenFactory
    let ideaTokenExchange

    let marketID
    let tokenID
    let ideaToken

    beforeEach(async () => {
        
        domainNoSubdomainNameVerifier = await DomainNoSubdomainNameVerifier.new()
        dai = await TestERC20.new('DAI', 'DAI')
        cDai = await TestCDai.new(dai.address)
        await cDai.setExchangeRate(tenPow18)
        interestManagerCompound = await InterestManagerCompound.new()
        ideaTokenFactory = await IdeaTokenFactory.new()
        ideaTokenExchange = await IdeaTokenExchange.new()

        await interestManagerCompound.initialize(ideaTokenExchange.address,
                                                 dai.address,
                                                 cDai.address,
                                                 zeroAddress,
                                                 zeroAddress,
                                                 {from: adminAccount})

        await ideaTokenFactory.initialize(adminAccount,
                                          ideaTokenExchange.address,
                                          {from: adminAccount})

        await ideaTokenExchange.initialize(adminAccount,
                                           tradingFeeAccount,
                                           ideaTokenFactory.address,
                                           interestManagerCompound.address,
                                           dai.address,
                                           {from: adminAccount})

        await ideaTokenFactory.addMarket(marketName,
                                         domainNoSubdomainNameVerifier.address,
                                         baseCost,
                                         priceRise,
                                         tokensPerInterval,
                                         tradingFeeRate,
                                         tradingFeeRateScale,
                                         {from: adminAccount})

        marketID = await ideaTokenFactory.getMarketIDByName(marketName)

        await ideaTokenFactory.addToken(tokenName, marketID)

        tokenID = await ideaTokenFactory.getTokenIDByName(tokenName, marketID)

        ideaToken = await IdeaToken.at((await ideaTokenFactory.getTokenInfo(marketID, tokenID)).ideaToken)

    })

    it('admin is owner', async () => {
        assert.equal(adminAccount, await ideaTokenExchange.getOwner())
    })
  
    it('can buy and sell 500 tokens', async () => {
        const amount = new BN('250').mul(tenPow18)
        const firstCost = await ideaTokenExchange.getCostForBuyingTokens(ideaToken.address, amount)
        const firstTradingFee = await getTradingFeeForBuying(ideaToken, amount)
        assert.isTrue(firstCost.eq(await getCostForBuyingTokens(ideaToken, amount)))

        await dai.mint(userAccount, firstCost)
        await dai.approve(ideaTokenExchange.address, firstCost)
        await ideaTokenExchange.buyTokens(ideaToken.address, amount, firstCost, userAccount)

        assert.isTrue((await dai.balanceOf(userAccount)).eq(new BN('0')))
        assert.isTrue((await ideaToken.balanceOf(userAccount)).eq(amount))
        assert.isTrue((await dai.balanceOf(tradingFeeAccount)).eq(firstTradingFee))

        const secondCost = await ideaTokenExchange.getCostForBuyingTokens(ideaToken.address, amount)
        const secondTradingFee = await getTradingFeeForBuying(ideaToken, amount)
        assert.isTrue(secondCost.eq(await getCostForBuyingTokens(ideaToken, amount)))

        await dai.mint(userAccount, secondCost)
        await dai.approve(ideaTokenExchange.address, secondCost)
        await ideaTokenExchange.buyTokens(ideaToken.address, amount, secondCost, userAccount)

        assert.isTrue((await dai.balanceOf(userAccount)).eq(new BN('0')))
        assert.isTrue((await ideaToken.balanceOf(userAccount)).eq(amount.add(amount)))
        assert.isTrue((await dai.balanceOf(tradingFeeAccount)).eq(firstTradingFee.add(secondTradingFee)))

        const firstPrice = await ideaTokenExchange.getPriceForSellingTokens(ideaToken.address, amount)
        const thirdTradingFee = await getTradingFeeForSelling(ideaToken, amount)
        assert.isTrue(firstPrice.eq(await getPriceForSellingTokens(ideaToken, amount)))

        await ideaTokenExchange.sellTokens(ideaToken.address, amount, firstPrice, userAccount)

        assert.isTrue((await dai.balanceOf(userAccount)).eq(firstPrice))
        assert.isTrue((await ideaToken.balanceOf(userAccount)).eq(amount))
        assert.isTrue((await dai.balanceOf(tradingFeeAccount)).eq(firstTradingFee.add(secondTradingFee).add(thirdTradingFee)))

        const secondPrice = await ideaTokenExchange.getPriceForSellingTokens(ideaToken.address, amount)
        const fourthTradingFee = await getTradingFeeForSelling(ideaToken, amount)
        assert.isTrue(secondPrice.eq(await getPriceForSellingTokens(ideaToken, amount)))

        await ideaTokenExchange.sellTokens(ideaToken.address, amount, secondPrice, userAccount)

        assert.isTrue((await dai.balanceOf(userAccount)).eq(firstPrice.add(secondPrice)))
        assert.isTrue((await ideaToken.balanceOf(userAccount)).eq(new BN('0')))
        assert.isTrue((await dai.balanceOf(tradingFeeAccount)).eq(firstTradingFee.add(secondTradingFee).add(thirdTradingFee).add(fourthTradingFee)))
    })

    it('fail buy/sell - invalid token', async () => {
        await expectRevert(
            ideaTokenExchange.buyTokens(zeroAddress, tenPow18, tenPow18, userAccount),
            'buyTokens: token does not exist'
        )

        await expectRevert(
            ideaTokenExchange.sellTokens(zeroAddress, tenPow18, tenPow18, userAccount),
            'sellTokens: token does not exist'
        )
    })

    it('fail buy/sell - max cost / minPrice', async () => {
        const amount = tenPow18
        const cost = await ideaTokenExchange.getCostForBuyingTokens(ideaToken.address, tenPow18)

        await expectRevert(
            ideaTokenExchange.buyTokens(ideaToken.address, amount, cost.sub(new BN('1')), userAccount),
            'buyTokens: cost exceeds maxCost'
        )

        await dai.mint(userAccount, cost)
        await dai.approve(ideaTokenExchange.address, cost)
        await ideaTokenExchange.buyTokens(ideaToken.address, amount, cost, userAccount)

        const price = await ideaTokenExchange.getPriceForSellingTokens(ideaToken.address, tenPow18)

        await expectRevert(
            ideaTokenExchange.sellTokens(ideaToken.address, amount, price.add(new BN('1')), userAccount),
            'sellTokens: price subceeds min price'
        )
    })

    it('fail buy - not enough allowance', async () => {
        const amount = tenPow18
        const cost = await ideaTokenExchange.getCostForBuyingTokens(ideaToken.address, tenPow18)
        await dai.mint(userAccount, cost)

        await expectRevert(
            ideaTokenExchange.buyTokens(ideaToken.address, amount, cost, userAccount),
            'buyTokens: not enough allowance'
        )
    })

    it('fail buy/sell - not enough tokens', async () => {
        const amount = tenPow18
        const cost = await ideaTokenExchange.getCostForBuyingTokens(ideaToken.address, tenPow18)
        await dai.mint(userAccount, cost.sub(new BN('1')))
        await dai.approve(ideaTokenExchange.address, cost)

        await expectRevert(
            ideaTokenExchange.buyTokens(ideaToken.address, amount, cost, userAccount),
            'ERC20: transfer amount exceeds balance'
        )

        await dai.mint(adminAccount, new BN(cost))
        await dai.approve(ideaTokenExchange.address, cost, { from: adminAccount })
        await ideaTokenExchange.buyTokens(ideaToken.address, amount, cost, adminAccount, { from: adminAccount })

        await expectRevert(
            ideaTokenExchange.sellTokens(ideaToken.address, new BN('1'), new BN('0'), userAccount),
            'sellTokens: not enough tokens'
        )
    })

    function getCostForCompletedIntervals(b, r, t, n) {
        return n.mul(t).mul(b.sub(r)).add(r.mul(t).mul(n.mul(n.add(new BN('1'))).div(new BN('2'))))
    }

    function getCostFromZeroSupply(b, r, t, amount) {
        const n = amount.div(t)
        return getCostForCompletedIntervals(b, r, t, n).add(amount.sub(n.mul(t)).mul(b.add(n.mul(r)))).div(tenPow18)
    }

    function getRawCostForBuyingTokens(b, r, t, supply, amount) {
        const costForSupply = getCostFromZeroSupply(b, r, t, supply)
        const costForSupplyPlusAmount = getCostFromZeroSupply(b, r, t, supply.add(amount))

        return costForSupplyPlusAmount.sub(costForSupply)
    }

    function getRawPriceForSellingTokens(b, r, t, supply, amount) {
        const costForSupply = getCostFromZeroSupply(b, r, t, supply)
        const costForSupplyMinusAmount = getCostFromZeroSupply(b, r, t, supply.sub(amount))

        return costForSupply.sub(costForSupplyMinusAmount)
    }

    async function getTradingFeeForBuying(token, amount) {
        const supply = await token.totalSupply()
        const rawCost = getRawCostForBuyingTokens(baseCost,
                                                  priceRise,
                                                  tokensPerInterval,
                                                  supply,
                                                  amount)

        return rawCost.mul(tradingFeeRate).div(tradingFeeRateScale)
    }

    async function getTradingFeeForSelling(token, amount) {
        const supply = await token.totalSupply()
        const rawPrice = getRawPriceForSellingTokens(baseCost,
                                                     priceRise,
                                                     tokensPerInterval,
                                                     supply,
                                                     amount)

        return rawPrice.mul(tradingFeeRate).div(tradingFeeRateScale)
    }

    async function getCostForBuyingTokens(token, amount) {
        const supply = await token.totalSupply()
        const rawCost = getRawCostForBuyingTokens(baseCost,
                                                  priceRise,
                                                  tokensPerInterval,
                                                  supply,
                                                  amount)

        const fee = rawCost.mul(tradingFeeRate).div(tradingFeeRateScale)

        return rawCost.add(fee)
    }

    async function getPriceForSellingTokens(token, amount) {
        const supply = await token.totalSupply()
        const rawPrice = getRawPriceForSellingTokens(baseCost,
                                                     priceRise,
                                                     tokensPerInterval,
                                                     supply,
                                                     amount)

        const fee = rawPrice.mul(tradingFeeRate).div(tradingFeeRateScale)

        return rawPrice.sub(fee)
    }
})