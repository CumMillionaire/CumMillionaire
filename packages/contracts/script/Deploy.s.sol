// forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast --private-key $PRIVATE_KEY --verify --etherscan-api-key $BSCSCAN_API_KEY

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {CumRocketLottery} from "../src/CumRocketLottery.sol";

contract DeployLottery is Script {
    CumRocketLottery public cumRocketLottery;

    function run() external {
        vm.startBroadcast();

        address cummies        = vm.envAddress("CUMMIES_TOKEN");
        address wbnb           = vm.envAddress("WBNB_TOKEN");
        address linkToken      = vm.envAddress("LINK_TOKEN");
        address swapRouter     = vm.envAddress("SWAP_ROUTER");
        address vrfCoordinator = vm.envAddress("VRF_COORDINATOR");
        address permit2        = vm.envAddress("PERMIT2_ADDRESS");
        uint256  subId         = uint256(vm.envUint("VRF_SUB_ID"));
        bytes32 keyHash        = vm.envBytes32("VRF_KEY_HASH");

        cumRocketLottery = new CumRocketLottery(
            cummies,
            wbnb,
            linkToken,
            swapRouter,
            vrfCoordinator,
            permit2,
            subId,
            keyHash
        );

        console2.log("=== DEPLOYMENT CONFIG ===");
        console2.log("CUMMIES Token :", cummies);
        console2.log("WBNB Token    :", wbnb);
        console2.log("LINK Token    :", linkToken);
        console2.log("Swap Router   :", swapRouter);
        console2.log("Permit2       :", permit2);
        console2.log("VRF           :", vrfCoordinator);
        console2.log("VRF Sub ID    :", subId);
        console2.log("VRF Key Hash  :", vm.toString(keyHash));
        console2.log("========================");
        console2.log("");
        console2.log("CumRocketLottery deployed at:", address(cumRocketLottery));

        vm.stopBroadcast();
    }
}
