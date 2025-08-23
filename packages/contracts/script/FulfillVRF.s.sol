pragma solidity ^0.8.20;
import "forge-std/Script.sol";
import "../src/CumRocketLottery.sol";
import "chainlink/contracts/src/v0.8/vrf/mocks/VRFCoordinatorV2Mock.sol";

contract FulfillVRF is Script {
    function run(address coordAddr, address lotAddr) external {
        uint256 pkey = vm.envUint("PK");
        vm.startBroadcast(pkey);
        CumRocketLottery lot = CumRocketLottery(lotAddr);
        VRFCoordinatorV2Mock coord = VRFCoordinatorV2Mock(coordAddr);
        uint256 req = lot.vrfRequestId();
        coord.fulfillRandomWords(req, lotAddr);
        vm.stopBroadcast();
    }
}
