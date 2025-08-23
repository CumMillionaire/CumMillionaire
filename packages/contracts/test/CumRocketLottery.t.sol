// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/CumRocketLottery.sol";

// ───── Mocks ────────────────────────────────────────────────────
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "chainlink/contracts/src/v0.8/vrf/mocks/VRFCoordinatorV2_5Mock.sol";
import {ISignatureTransfer} from "permit2/src/interfaces/ISignatureTransfer.sol";

contract ERC20Mock is ERC20 {
    constructor(string memory n, string memory s) ERC20(n, s) {}
    function mint(address to, uint256 amt) external {_mint(to, amt);}
}

contract LinkMock is ERC20Mock("Chainlink", "LINK"), ILinkToken {
    function transferAndCall(address to, uint256 val, bytes calldata) external override returns (bool) {
        _transfer(msg.sender, to, val);
        return true;
    }
}

contract RouterMock is ISwapRouter {
    IERC20 public immutable from;
    IERC20 public immutable to;

    constructor(IERC20 _from, IERC20 _to) {
        from = _from;
        to = _to;
    }

    function getAmountsIn(uint256 amountOut, address[] calldata) external pure override returns (uint256[] memory a) {
        a = new uint256[](2);
        a[0] = amountOut;   // 1:1 rate for tests
        a[1] = amountOut;
    }

    function swapTokensForExactTokens(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata,
        address recipient,
        uint256
    ) external override returns (uint256[] memory a) {
        require(amountInMax >= amountOut, "slippage");
        from.transferFrom(msg.sender, address(this), amountOut);
        to.transfer(recipient, amountOut);
        a = new uint256[](2);
        a[0] = amountOut;
        a[1] = amountOut;
    }
}

contract Permit2Mock is ISignatureTransfer {
    // ---- IEIP712 ----
    function DOMAIN_SEPARATOR() external pure returns (bytes32) {
        return bytes32(0);
    }

    // ---- Nonces ----
    function nonceBitmap(address, uint256) external pure returns (uint256) {
        return 0;
    }
    function invalidateUnorderedNonces(uint256, uint256) external { }

    // ---- Single transfer ----
    function permitTransferFrom(
        PermitTransferFrom memory permit,
        SignatureTransferDetails calldata transferDetails,
        address owner,
        bytes calldata /*signature*/
    ) external {
        require(
            transferDetails.requestedAmount <= permit.permitted.amount,
            "excess"
        );
        IERC20(permit.permitted.token).transferFrom(
            owner,
            transferDetails.to,
            transferDetails.requestedAmount
        );
    }

    // ---- Batch transfer ----
    function permitTransferFrom(
        PermitBatchTransferFrom memory permit,
        SignatureTransferDetails[] calldata transferDetails,
        address owner,
        bytes calldata /*signature*/
    ) external {
        uint256 len = transferDetails.length;
        require(len == permit.permitted.length, "len");
        for (uint256 i = 0; i < len; ++i) {
            require(
                transferDetails[i].requestedAmount <= permit.permitted[i].amount,
                "excess"
            );
            IERC20(permit.permitted[i].token).transferFrom(
                owner,
                transferDetails[i].to,
                transferDetails[i].requestedAmount
            );
        }
    }

    // ---- Witness (single) ----
    function permitWitnessTransferFrom(
        PermitTransferFrom memory permit,
        SignatureTransferDetails calldata transferDetails,
        address owner,
        bytes32 /*witness*/,
        string calldata /*witnessTypeString*/,
        bytes calldata /*signature*/
    ) external {
        this.permitTransferFrom(permit, transferDetails, owner, "");
    }

    // ---- Witness (batch) ----
    function permitWitnessTransferFrom(
        PermitBatchTransferFrom memory permit,
        SignatureTransferDetails[] calldata transferDetails,
        address owner,
        bytes32 /*witness*/,
        string calldata /*witnessTypeString*/,
        bytes calldata /*signature*/
    ) external {
        this.permitTransferFrom(permit, transferDetails, owner, "");
    }
}

// ───── Test suite ───────────────────────────────────────────────
contract CumRocketLotteryTest is Test {
    CumRocketLottery       lot;
    ERC20Mock              cummies;
    ERC20Mock              wbnb;
    LinkMock               link;
    RouterMock             router;
    Permit2Mock            permit2;
    VRFCoordinatorV2_5Mock coord;
    uint256                subId;
    bytes32                keyHash = bytes32("0x123");

    address alice = address(0xa11ce);
    address bob = address(0xb0b);

    function setUp() public {
        // tokens
        cummies = new ERC20Mock("CumRocket", "CUMMIES");
        wbnb = new ERC20Mock("Wrapped BNB", "WBNB");
        link = new LinkMock();

        // router mock (1:1 rate)
        router = new RouterMock(cummies, link);
        link.mint(address(router), 100 ether);

        // permit2 mock
        permit2 = new Permit2Mock();

        // VRF mock
        coord = new VRFCoordinatorV2_5Mock(0, 0, 1);
        subId = coord.createSubscription();
        coord.fundSubscription(subId, 0.02 ether);

        // lottery
        lot = new CumRocketLottery(
            address(cummies),
            address(wbnb),
            address(link),
            address(router),
            address(coord),
            address(permit2),
            subId,
            keyHash
        );
        coord.addConsumer(subId, address(lot));

        lot.setMinLinkBalance(0); // disable auto-fund to shorten tests

        // mint & approve
        cummies.mint(alice, 5_000_000 ether);
        cummies.mint(bob, 2_000_000 ether);

        vm.prank(alice);
        cummies.approve(address(lot), type(uint256).max);
        vm.prank(bob);
        cummies.approve(address(lot), type(uint256).max);
    }

    /*────────────────────────── HELPERS ───────────────────────────*/
    function _assertDepositCapped(address depositor, uint256 attemptGross) internal {
        uint256 remainingNet = lot.TARGET_POOL() - lot.totalDeposits();
        uint256 expectedGross = lot.previewGross(remainingNet);

        uint256 before = cummies.balanceOf(depositor);
        vm.prank(depositor);
        lot.deposit(attemptGross);
        uint256 spent = before - cummies.balanceOf(depositor);

        assertEq(spent, expectedGross, "gross capped amount mismatch");
        assertEq(lot.totalDeposits(), lot.TARGET_POOL(), "net pool must equal target");
    }

    function _assertDepositCappedWithPermit2(address depositor, uint256 attemptGross) internal {
        uint256 remainingNet = lot.TARGET_POOL() - lot.totalDeposits();
        uint256 expectedGross = lot.previewGross(remainingNet);

        ISignatureTransfer.PermitTransferFrom memory permit =
            ISignatureTransfer.PermitTransferFrom({
                permitted: ISignatureTransfer.TokenPermissions({
                    token: address(cummies),
                    amount: attemptGross
                }),
                nonce: 0,
                deadline: block.timestamp + 300
            });

        bytes memory signature = "";

        vm.prank(depositor);
        cummies.approve(address(permit2), attemptGross);

        uint256 before = cummies.balanceOf(depositor);
        vm.prank(depositor);
        lot.depositWithPermit2(permit, signature, attemptGross);
        uint256 spent = before - cummies.balanceOf(depositor);

        assertEq(spent, expectedGross, "gross capped amount mismatch (permit2)");
        assertEq(lot.totalDeposits(), lot.TARGET_POOL(), "net pool must equal target");
    }

    /*──────────────────────── BASIC TESTS ───────────────────────*/

    function testDepositUpdatesState() public {
        vm.prank(alice);
        lot.deposit(500_000 ether); // fee 2.5 % = 12 500

        assertEq(lot.totalDeposits(), 487_500 ether);
        assertEq(lot.deposits(alice), 487_500 ether);
        assertEq(lot.protocolFees(), 12_500 ether);
        assertEq(lot.playersCount(), 1);
        assertTrue(lot.currentRoundActive());
    }

    function testDepositsCloseAtTarget() public {
        vm.prank(alice);
        lot.deposit(600_000 ether); // net 585 000
        vm.prank(bob);
        _assertDepositCapped(bob, 440_000 ether);

        lot.requestRandomness();

        assertEq(lot.totalDeposits(), 1_000_000 ether);
        assertFalse(lot.currentRoundActive());
        assertGt(lot.vrfRequestId(), 0);
    }

    function testWinnerCanClaimPrizeAndHistory() public {
        // Close at target
        vm.prank(alice);
        lot.deposit(600_000 ether);
        vm.prank(bob);
        _assertDepositCapped(bob, 440_000 ether);

        // Request VRF + fulfill
        lot.requestRandomness();
        uint256 req = lot.vrfRequestId();
        coord.fulfillRandomWords(req, address(lot));

        // History checks (roundId = 0)
        assertEq(lot.roundsHistoryCount(), 1, "roundsCount increments on startNewRound");
        address[] memory ps = lot.playersOf(0);
        assertEq(ps.length, 2);
        assertEq(lot.depositOf(0, alice), 585_000 ether);
        assertEq(lot.depositOf(0, bob),   415_000 ether);
        assertEq(lot.prizeOf(0), 1_000_000 ether);

        // New round checks
        assertTrue(lot.currentRoundActive());
        assertEq(lot.playersCount(), 0);
        assertEq(lot.totalDeposits(), 0);
        assertEq(lot.roundsHistoryCount(), 1);

        address w = lot.winnerOf(0);
        assertTrue(w == alice || w == bob);

        uint256 before = cummies.balanceOf(w);
        vm.prank(w);
        lot.claimPrize(0);
        assertEq(cummies.balanceOf(w), before + 1_000_000 ether);
    }

    /*───────────────────  AUTO-FUND AND SWAP LINK  ───────────────────*/

    function testAutoFundSwapConsumesFees() public {
        lot.setMinLinkBalance(0.022 ether); // enable auto-fund

        vm.prank(alice);
        lot.deposit(1_100_000 ether);

        uint256 protocolFeesBeforeSwap = lot.protocolFees();

        lot.requestRandomness();

        // The subscription remains at 0.02 ether because the VRF v2.5 mock does not handle transferAndCall correctly
        assertEq(lot.subscriptionLinkBalance(), 0.02 ether);
        assertEq(
            lot.protocolFees(),
            protocolFeesBeforeSwap - 0.002 ether
        );
    }

    function testFeesInsufficientReverts() public {
        lot.setMinLinkBalance(200000 ether);

        vm.prank(alice);
        lot.deposit(2_000_000 ether);

        vm.expectRevert(CumRocketLottery.FeesInsufficient.selector);
        lot.requestRandomness();
    }

    /*──────────────────────  GOVERNANCE PARAMETERS  ─────────────*/

    function testSlippageTooHighRevert() public {
        vm.expectRevert(CumRocketLottery.SlippageTooHigh.selector);
        lot.setSlippageBps(2000); // > 10 %
    }

    function testSetSwapRouterZeroAddressRevert() public {
        vm.expectRevert(abi.encodeWithSignature("ZeroAddress()"));
        lot.setSwapRouter(address(0));
    }

    /*────────────────────────  ERREURS CUSTOM  ──────────────────*/

    function testZeroAmountReverts() public {
        vm.expectRevert(CumRocketLottery.ZeroAmount.selector);
        lot.deposit(0);
    }

    function testDepositsClosedReverts() public {
        vm.prank(alice);
        lot.deposit(1_100_000 ether);

        vm.expectRevert(CumRocketLottery.DepositsClosed.selector);
        vm.prank(bob);
        lot.deposit(1 ether);
    }

    function testNotWinnerClaimReverts() public {
        vm.prank(alice);
        lot.deposit(1_100_000 ether);

        lot.requestRandomness();
        uint256 req = lot.vrfRequestId();
        coord.fulfillRandomWords(req, address(lot));

        vm.expectRevert(CumRocketLottery.NotWinner.selector);
        vm.prank(bob);
        lot.claimPrize(0);
    }

    function testAlreadyClaimedReverts() public {
        vm.prank(alice);
        lot.deposit(1_100_000 ether);

        lot.requestRandomness();
        uint256 req = lot.vrfRequestId();
        coord.fulfillRandomWords(req, address(lot));
        address w = lot.winnerOf(0);

        vm.prank(w);
        lot.claimPrize(0);

        vm.expectRevert(CumRocketLottery.AlreadyClaimed.selector);
        vm.prank(w);
        lot.claimPrize(0);
    }

    /*────────────────────────  PERMIT2 TESTS  ───────────────────*/

    function testDepositWithPermit2UpdatesState() public {
        // Setup permit structure
        ISignatureTransfer.PermitTransferFrom memory permit = ISignatureTransfer.PermitTransferFrom({
            permitted: ISignatureTransfer.TokenPermissions({
            token: address(cummies),
            amount: 500_000 ether
        }),
            nonce: 0,
            deadline: block.timestamp + 300
        });

        bytes memory signature = ""; // Mock signature (empty for our mock)

        // Alice needs to approve permit2 contract to spend her tokens
        vm.prank(alice);
        cummies.approve(address(permit2), 500_000 ether);

        // Use permit2 deposit
        vm.prank(alice);
        lot.depositWithPermit2(permit, signature, 500_000 ether);

        // Check state is updated correctly (same as regular deposit)
        assertEq(lot.totalDeposits(), 487_500 ether); // after 2.5% fee
        assertEq(lot.deposits(alice), 487_500 ether);
        assertEq(lot.protocolFees(), 12_500 ether);
        assertEq(lot.playersCount(), 1);
        assertTrue(lot.currentRoundActive());
    }

    function testDepositWithPermit2ClosesAtTarget() public {
        // Permit for Alice (Signature Transfer)
        ISignatureTransfer.PermitTransferFrom memory permitAlice =
                            ISignatureTransfer.PermitTransferFrom({
                permitted: ISignatureTransfer.TokenPermissions({
                token: address(cummies),
                amount: 600_000 ether
            }),
                nonce: 0,
                deadline: block.timestamp + 300
            });

        // Permit for Bob
        ISignatureTransfer.PermitTransferFrom memory permitBob =
                            ISignatureTransfer.PermitTransferFrom({
                permitted: ISignatureTransfer.TokenPermissions({
                token: address(cummies),
                amount: 440_000 ether
            }),
                nonce: 0,
                deadline: block.timestamp + 300
            });

        bytes memory signature = ""; // Mock signature

        // Approvals to the mock Permit2
        vm.prank(alice);
        cummies.approve(address(permit2), 600_000 ether);
        vm.prank(bob);
        cummies.approve(address(permit2), 440_000 ether);

        // Deposits via permit2 (the second will be trimmed to reach exactly 1,000,000 net)
        vm.prank(alice);
        lot.depositWithPermit2(permitAlice, signature, 600_000 ether);

        vm.prank(bob);
        lot.depositWithPermit2(permitBob, signature, 440_000 ether);

        lot.requestRandomness();

        // Checks: deposits are closed and a VRF request has been issued
        assertEq(lot.totalDeposits(), 1_000_000 ether);
        assertFalse(lot.currentRoundActive());
        assertGt(lot.vrfRequestId(), 0);
    }

    function testDepositWithPermit2ZeroAmountReverts() public {
        // Permit with allowed amount = 0
        ISignatureTransfer.PermitTransferFrom memory permit =
                            ISignatureTransfer.PermitTransferFrom({
                permitted: ISignatureTransfer.TokenPermissions({
                token: address(cummies),
                amount: 0
            }),
                nonce: 0,
                deadline: block.timestamp + 300
            });

        bytes memory signature = "";

        vm.expectRevert(CumRocketLottery.ZeroAmount.selector);
        vm.prank(alice);
        lot.depositWithPermit2(permit, signature, 0);
    }

    function testDepositWithPermit2WhenClosedReverts() public {
        // Close deposits (a single large deposit trimmed)
        vm.prank(alice);
        lot.deposit(1_100_000 ether);

        // Permit for 100k
        ISignatureTransfer.PermitTransferFrom memory permit =
                            ISignatureTransfer.PermitTransferFrom({
                permitted: ISignatureTransfer.TokenPermissions({
                token: address(cummies),
                amount: 100_000 ether
            }),
                nonce: 0,
                deadline: block.timestamp + 300
            });

        bytes memory signature = "";

        vm.prank(bob);
        cummies.approve(address(permit2), 100_000 ether);

        vm.expectRevert(CumRocketLottery.DepositsClosed.selector);
        vm.prank(bob);
        lot.depositWithPermit2(permit, signature, 100_000 ether);
    }

    function testHelperChecksCappedGrossOnSecondDeposit() public {
        // 1st deposit: 600,000 → net 585,000
        vm.prank(alice);
        lot.deposit(600_000 ether);

        // 2nd deposit: Bob tries 440,000, will be trimmed to 425,642 (net 415,000)
        // 585,000 + 415,000 = exact 1,000,000 net
        _assertDepositCapped(bob, 440_000 ether);
    }

    function testHelperChecksCappedGrossOnSecondDepositPermit2() public {
        vm.prank(alice);
        lot.deposit(600_000 ether);

        uint256 attemptGross = 440_000 ether;
        uint256 remainingNet = lot.TARGET_POOL() - lot.totalDeposits();
        uint256 expectedGross = lot.previewGross(remainingNet);

        ISignatureTransfer.PermitTransferFrom memory permit =
                            ISignatureTransfer.PermitTransferFrom({
                permitted: ISignatureTransfer.TokenPermissions({
                token: address(cummies),
                amount: attemptGross
            }),
                nonce: 0,
                deadline: block.timestamp + 300
            });

        bytes memory signature = "";

        vm.prank(bob);
        cummies.approve(address(permit2), attemptGross);

        uint256 before = cummies.balanceOf(bob);
        vm.prank(bob);
        lot.depositWithPermit2(permit, signature, attemptGross);
        uint256 spent = before - cummies.balanceOf(bob);

        assertEq(spent, expectedGross, "gross capped amount mismatch (permit2)");
        assertEq(lot.totalDeposits(), lot.TARGET_POOL(), "net pool must equal target");
    }

    function testSurplusBurnedAfterVRFDraw() public {
        vm.prank(alice);
        lot.deposit(600_000 ether); // net 585 000, fees 15 000
        vm.prank(bob);
        _assertDepositCapped(bob, 440_000 ether);

        uint256 protocolFeesBeforeDraw = lot.protocolFees();
        assertGt(protocolFeesBeforeDraw, 0, "Should have protocol fees before draw");

        address burnAddress = 0x000000000000000000000000000000000000dEaD;
        uint256 burnAddressBalanceBefore = cummies.balanceOf(burnAddress);

        lot.requestRandomness();
        uint256 req = lot.vrfRequestId();
        coord.fulfillRandomWords(req, address(lot));

        assertEq(lot.protocolFees(), 0, "Protocol fees should be reset to 0 after burn");

        uint256 burnAddressBalanceAfter = cummies.balanceOf(burnAddress);
        uint256 burnedAmount = burnAddressBalanceAfter - burnAddressBalanceBefore;
        assertEq(burnedAmount, protocolFeesBeforeDraw, "Burned amount should equal previous protocol fees");

        assertTrue(lot.currentRoundActive(), "New round should be active after burn");
        assertEq(lot.roundsCount(), 1, "Should be on round 1 after completing round 0");
    }
}
