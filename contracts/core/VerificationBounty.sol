//SPDX-License-Identifier: Unlicense
pragma solidity ^0.6.9;
pragma experimental ABIEncoderV2;

import "./IdeaTokenExchange.sol";

import { IERC20 } from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import { SafeMath } from '@openzeppelin/contracts/math/SafeMath.sol';
import "../util/Ownable.sol";

contract VerificationBounty is Ownable {

    uint256 public _lockPeriod;

    address public _donationCurrency;

    address public _ideaTokenExchange;

    //ideatoken address => ideatoken
    mapping (address => Bounty) public bounties;

    struct Donation {
        uint256 amount;
        uint256 ts;
    }

    struct Bounty {
        bool hasClaimed;
        uint256 totalAmount;
        mapping (address => Donation) donors;
    }

    using SafeMath for uint256;

    constructor(uint256 lockPeriod, address donationCurrency, address ideaTokenExchange) public {
        _lockPeriod = lockPeriod;
        _donationCurrency = donationCurrency;
        _ideaTokenExchange = ideaTokenExchange;
    }


    function donate(address token, uint256 amount) external {
        require(IdeaTokenExchange(_ideaTokenExchange).getTokenOwner(token) == address(0), "The token owner has already verified");
        require(bounties[token].hasClaimed==false, "Account has already claimed");
        require(bounties[token].donors[msg.sender].amount==0, "You have already donated");
        IERC20(_donationCurrency).transferFrom(msg.sender, address(this), amount);
        Donation memory donation;
        donation.amount = amount;
        donation.ts = block.timestamp;
        Bounty storage bounty = bounties[token];
        bounty.totalAmount = bounty.totalAmount.add(amount);
        bounty.donors[msg.sender] = donation;
    }

    function reclaimDonation(address token) external {
        Donation memory donation = bounties[token].donors[msg.sender];
        require(donation.amount > 0, "Not donated");
        require(donation.ts != 0 && (block.timestamp > donation.ts+_lockPeriod), "Cant reclaim yet");
        uint256 amount = donation.amount;
        bounties[token].donors[msg.sender].amount = 0;
        bounties[token].donors[msg.sender].ts = 0;
        bounties[token].totalAmount = bounties[token].totalAmount.sub(amount);
        IERC20(_donationCurrency).transfer(msg.sender, donation.amount);
    }

    function claimBounty(address token) external {
        require(IdeaTokenExchange(_ideaTokenExchange).getTokenOwner(token) == msg.sender, "Only the token owner can claim the bounty");
        Bounty storage bounty = bounties[token];
        require(bounty.hasClaimed == false, "Already claimed");
        uint256 totalAmount = bounty.totalAmount;
        bounty.hasClaimed = true;
        IERC20(_donationCurrency).transfer(msg.sender, totalAmount);
    }

    function getBountyTotalAmount(address token) public view returns (uint256) {
        return bounties[token].totalAmount;
    }

    function setLockPeriod(uint256 lockPeriod_) external onlyOwner {
        _lockPeriod = lockPeriod_;
    }

}
