pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "chainlink/contracts/src/v0.8/vrf/mocks/VRFCoordinatorV2_5Mock.sol";
import "../../src/CumRocketLottery.sol";

contract SubscriptionManager {
    // This function orchestrates everything in one transaction
    function createAndFundSubscription(
        // VRF
        VRFCoordinatorV2_5Mock _vrfCoordinator,
        uint256 _fundAmount,
        // lottery
        address cummies,
        address wNative,
        address link,
        address router,
        address permit2,
        bytes32 keyHash,
        uint256 minLink
    )
    external
    returns (uint256, CumRocketLottery)
    {
        uint256 subId = _vrfCoordinator.createSubscription();
        _vrfCoordinator.fundSubscription(subId, _fundAmount);

        CumRocketLottery lot = new CumRocketLottery(
            cummies, wNative, link, router, address(_vrfCoordinator), permit2, subId, keyHash
        );
        _vrfCoordinator.addConsumer(subId, address(lot));

        if (minLink > 0) {
            lot.setMinLinkBalance(minLink);
        }

        return (subId, lot);
    }
}
