// forge script script/DeployLocal.s.sol --rpc-url http://127.0.0.1:8545 --broadcast --private-key <ANVIL_KEY>

pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/CumRocketLottery.sol";
import "../test/CumRocketLottery.t.sol";
import "chainlink/contracts/src/v0.8/vrf/mocks/VRFCoordinatorV2_5Mock.sol";
import "./helpers/SubscriptionManager.sol";

contract DeployLocal is Script {
    function run() external {
        uint256 pkey = vm.envUint("PK"); // or via --private-key
        vm.startBroadcast(pkey);
        vm.roll(block.number + 1);

        // 1) Tokens & router
        ERC20Mock cummies = new ERC20Mock("CumRocket", "CUMMIES");
        ERC20Mock wbnb = new ERC20Mock("Wrapped BNB", "WBNB");
        LinkMock link = new LinkMock();
        RouterMock router = new RouterMock(IERC20(address(cummies)), IERC20(address(link)));
        link.mint(address(router), 100 ether); // pour l’auto-fund plus tard

        // 2) Permit2 mock (SignatureTransfer)
        Permit2Mock permit2 = new Permit2Mock();
//        address permit2 = address(0x000000000022D473030F116dDEE9F6B43aC78BA3);
//        Permit2 permit2 = new Permit2();

        // 3) VRF mock

        VRFCoordinatorV2_5Mock coord = new VRFCoordinatorV2_5Mock(0, 0, int256(1e18));

//        uint256 subId = coord.createSubscription();
//        (uint96 balance, uint96 nativeBalance, uint64 reqCount, address subOwner, address[] memory consumers) = coord.getSubscription(subId);
//        console2.log("subOwner", subOwner);
//        coord.fundSubscription(subId, 1 ether);

        SubscriptionManager subManager = new SubscriptionManager();
        (uint256 subId, CumRocketLottery lot) = subManager.createAndFundSubscription(
            // VRF
            coord,
            1 ether,
            // lottery
            address(cummies),
            address(wbnb),
            address(link),
            address(router),
            address(permit2),
            bytes32("0x123"),
            0
        );

        // 4) Lottery
//        CumRocketLottery lot = new CumRocketLottery(
//            address(cummies),
//            address(link),
//            address(router),
//            address(coord),
//            address(permit2),
//            1, // subId,
//            bytes32("0x123")
//        );
//        coord.addConsumer(subId, address(lot));

        // 5) QoL
//        lot.setMinLinkBalance(0); // ignore l’auto-fund pour commencer

        // 6) Seed dev account
        address a0 = vm.addr(pkey);
        cummies.mint(a0, 2_000_000 ether);

        console2.log("CUMMIES:", address(cummies));
        console2.log("LINK   :", address(link));
        console2.log("ROUTER :", address(router));
        console2.log("PERMIT2:", address(permit2));
        console2.log("VRF    :", address(coord));
        console2.log("LOTTERY:", address(lot));
        console2.log("SUBID  :", subId);

        vm.stopBroadcast();
    }
}
