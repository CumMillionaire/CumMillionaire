// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

import "chainlink/contracts/src/v0.8/vrf/dev/interfaces/IVRFCoordinatorV2Plus.sol";
import "chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import "chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

import {ISignatureTransfer} from "permit2/src/interfaces/ISignatureTransfer.sol";

interface ISwapRouter {
    function getAmountsIn(uint256 amountOut, address[] calldata path) external view returns (uint256[] memory amounts);
    function swapTokensForExactTokens(uint256 amountOut, uint256 amountInMax, address[] calldata path, address to, uint256 deadline) external returns (uint256[] memory amounts);
}

interface ILinkToken is IERC20 {
    function transferAndCall(address to, uint256 value, bytes calldata data) external returns (bool success);
}

contract CumRocketLottery is VRFConsumerBaseV2Plus, ReentrancyGuard {
    using Math for uint256;
    using SafeERC20 for IERC20;

    /*────────────────────────── ERRORS ──────────────────────────*/
    error DepositsClosed();
    error ZeroAmount();
    error NotWinner();
    error AlreadyClaimed();
    error PrizeUnclaimed();
    error WinnerAlreadySelected();
    error DepositsOpen();
    error FeesInsufficient();
    error SlippageTooHigh();
    error VRFAlreadyRequested();
    error AmountExceedsPermit();

    /*────────────────── CONSTANTS & IMMUTABLES ──────────────────*/
    uint256 public constant TARGET_POOL = 1_000_000 ether;
    uint256 public constant FEE_BPS = 250; // 2.5%
    uint256 internal constant BPS_DENOM = 10_000;

    uint32 public constant CALLBACK_GAS_LIMIT = 300_000;
    uint16 public constant REQUEST_CONFIRMATION = 3;
    uint32 public constant NUM_WORDS = 1;

    IERC20 public immutable cummies;
    address public immutable wNative;
    ILinkToken public immutable linkToken;
    IVRFCoordinatorV2Plus private immutable coordinator;
    ISwapRouter public swapRouter;
    ISignatureTransfer public immutable permit2;

    uint256 public immutable subscriptionId;
    bytes32 public immutable keyHash;

    /*─────────────────────── ROUND STATE ────────────────────────*/
    address[] public players;                       // joueurs du round en cours
    mapping(address => uint256) public deposits;    // dépôts (net) du round en cours
    uint256 public totalDeposits;                   // net cumulé (round en cours)
    bool public acceptingDeposits = true;

    // VRF
    uint256 public vrfRequestId;

    // Frais du protocole (global, cumulé)
    uint256 public protocolFees;

    // Paramètres VRF/LINK
    uint256 public minLinkBalance = 0.02 ether;
    uint256 public slippageBps = 200; // 2%

    /*─────────────────────── ROUND HISTORY ──────────────────────*/
    struct RoundInfo {
        address winner;
        uint256 prize;
        bool    claimed;
        uint256 vrfRequestId;
        address[] players;
    }
    // Nombre de rounds terminés et index du prochain round en cours
    uint256 public roundsCount; // == nombre de rounds terminés (ids 0..roundsCount-1)
    mapping(uint256 => RoundInfo) public rounds;
    mapping(uint256 => mapping(address => uint256)) public depositsAtRound; // roundId => (player => net)

    /*────────────────────────── EVENTS ──────────────────────────*/
    event Deposited(uint256 indexed roundId, address indexed player, uint256 amountNet, uint256 fee);
    event DepositClosed(uint256 netPool, uint256 feesPool);
    event RouterUpdated(address newRouter);
    event MinLinkBalanceUpdated(uint256 newMin);
    event SlippageUpdated(uint256 newSlippageBps);
    event RandomnessRequested(uint256 indexed requestId, uint256 indexed roundId);
    event WinnerSelected(uint256 indexed roundId, address indexed winner, uint256 amountWon);
    event PrizeClaimed(uint256 indexed roundId, address indexed winner, uint256 amount);
    event NewRoundStarted(uint256 indexed newRoundId);
    event SurplusBurned(uint256 indexed roundId, uint256 amount);

    /*──────────────────────── CONSTRUCTOR ───────────────────────*/
    constructor(
        address _cummies,
        address _wNative,
        address _linkToken,
        address _swapRouter,
        address _vrfCoordinator,
        address _permit2,
        uint256 _subscriptionId,
        bytes32 _keyHash
    ) VRFConsumerBaseV2Plus(_vrfCoordinator) {
        if (_cummies == address(0) || _wNative == address(0) || _linkToken == address(0) || _swapRouter == address(0) || _vrfCoordinator == address(0) || _permit2 == address(0)) revert ZeroAddress();
        cummies = IERC20(_cummies);
        wNative = _wNative;
        linkToken = ILinkToken(_linkToken);
        swapRouter = ISwapRouter(_swapRouter);
        coordinator = IVRFCoordinatorV2Plus(_vrfCoordinator);
        permit2 = ISignatureTransfer(_permit2);
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
    }

    /*───────────────────── USER INTERACTIONS ────────────────────*/
    function deposit(uint256 amount) external nonReentrant {
        if (!acceptingDeposits) revert DepositsClosed();
        if (amount == 0) revert ZeroAmount();

        uint256 useAmount = capAmount(amount);
        if (useAmount == 0) revert DepositsClosed();

        cummies.transferFrom(msg.sender, address(this), useAmount);

        _processDeposit(useAmount);
    }

    function depositWithPermit2(
        ISignatureTransfer.PermitTransferFrom calldata permit,
        bytes calldata signature,
        uint256 amount
    ) external nonReentrant {
        if (!acceptingDeposits) revert DepositsClosed();
        if (amount == 0) revert ZeroAmount();

        uint256 useAmount = capAmount(amount);
        if (useAmount == 0) revert DepositsClosed();
        if (useAmount > permit.permitted.amount) revert AmountExceedsPermit();

        // Use Permit2 to transfer tokens from user to this contract
        ISignatureTransfer.SignatureTransferDetails memory transferDetails =
                            ISignatureTransfer.SignatureTransferDetails({ to: address(this), requestedAmount: useAmount });

        permit2.permitTransferFrom(permit, transferDetails, msg.sender, signature);

        _processDeposit(useAmount);
    }

    /// @notice Le gagnant d'un round terminé réclame son lot.
    function claimPrize(uint256 roundId) external nonReentrant {
        RoundInfo storage r = rounds[roundId];
        if (msg.sender != r.winner) revert NotWinner();
        if (r.claimed) revert AlreadyClaimed();

        r.claimed = true;
        cummies.transfer(r.winner, r.prize);
        emit PrizeClaimed(roundId, r.winner, r.prize);
    }

    function requestRandomness() external nonReentrant {
        if (acceptingDeposits) revert DepositsOpen();
        if (vrfRequestId != 0) revert VRFAlreadyRequested();

        _fundVRFIfNeeded();

        VRFV2PlusClient.RandomWordsRequest memory request = VRFV2PlusClient.RandomWordsRequest({
            keyHash: keyHash,
            subId: subscriptionId,
            requestConfirmations: REQUEST_CONFIRMATION,
            callbackGasLimit: CALLBACK_GAS_LIMIT,
            numWords: NUM_WORDS,
            extraArgs: VRFV2PlusClient._argsToBytes(
                VRFV2PlusClient.ExtraArgsV1({
                    nativePayment: false
                })
            )
        });

        vrfRequestId = coordinator.requestRandomWords(request);
        emit RandomnessRequested(vrfRequestId, roundsCount);
    }

    /*───────────────────────── ADMIN ────────────────────────────*/
    function setSwapRouter(address _router) external onlyOwner {
        if (_router == address(0)) revert ZeroAddress();
        swapRouter = ISwapRouter(_router);
        emit RouterUpdated(_router);
    }

    function setMinLinkBalance(uint256 _min) external onlyOwner {
        minLinkBalance = _min;
        emit MinLinkBalanceUpdated(_min);
    }

    function setSlippageBps(uint256 _bps) external onlyOwner {
        if (_bps > 1_000) revert SlippageTooHigh();
        slippageBps = _bps;
        emit SlippageUpdated(_bps);
    }

    /*──────────────────────── INTERNALS ─────────────────────────*/
    function _processDeposit(uint256 grossAmount) internal {
        uint256 net = previewNet(grossAmount); // floor(gross * 9750 / 10000)
        uint256 fee = grossAmount - net;
        protocolFees += fee;

        if (deposits[msg.sender] == 0) {
            players.push(msg.sender);
        }
        deposits[msg.sender] += net;
        totalDeposits += net;

        emit Deposited(roundsCount, msg.sender, net, fee);

        if (totalDeposits == TARGET_POOL) {
            _closeDeposits();
        }
    }

    function _closeDeposits() internal {
        if (!acceptingDeposits) return;
        acceptingDeposits = false;
        emit DepositClosed(totalDeposits, protocolFees);
    }

    function _fundVRFIfNeeded() internal {
        uint96 currentLink = subscriptionLinkBalance();
        if (currentLink >= minLinkBalance) return;

        uint256 linkNeeded = minLinkBalance - uint256(currentLink);

        address[] memory path = new address[](3);
        path[0] = address(cummies);
        path[1] = wNative;
        path[2] = address(linkToken);

        uint256[] memory amountsIn = swapRouter.getAmountsIn(linkNeeded, path);
        uint256 cummiesRequired = amountsIn[0];

        if (cummiesRequired > protocolFees) revert FeesInsufficient();

        uint256 amountInMax = cummiesRequired + Math.mulDiv(cummiesRequired, slippageBps, BPS_DENOM, Math.Rounding.Floor);

        cummies.forceApprove(address(swapRouter), amountInMax);
        uint256[] memory spent = swapRouter.swapTokensForExactTokens(linkNeeded, amountInMax, path, address(this), block.timestamp + 300);
        uint256 cummiesUsed = spent[0];

        protocolFees -= cummiesUsed;

        linkToken.transferAndCall(address(coordinator), linkNeeded, abi.encode(subscriptionId));
    }

    function _startNewRound() internal {
        // Burn any remaining surplus CUMMIES (protocol fees not used for LINK)
        if (protocolFees > 0) {
            uint256 surplusToBurn = protocolFees;
            protocolFees = 0;
            cummies.transfer(0x000000000000000000000000000000000000dEaD, surplusToBurn);
            emit SurplusBurned(roundsCount, surplusToBurn);
        }

        for (uint256 i; i < players.length; ++i) {
            delete deposits[players[i]];
        }
        delete players;

        totalDeposits = 0;
        acceptingDeposits = true;
        vrfRequestId = 0;

        roundsCount += 1;
        emit NewRoundStarted(roundsCount);
    }

    /*───────────────────────── VRF ──────────────────────────────*/
    function fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) internal override {
        if (acceptingDeposits) revert DepositsOpen();
        if (rounds[roundsCount].winner != address(0)) revert WinnerAlreadySelected();

        uint256 rand = randomWords[0] % totalDeposits;
        uint256 running;
        address selected;
        for (uint256 i; i < players.length; ++i) {
            running += deposits[players[i]];
            if (rand < running) {
                selected = players[i];
                break;
            }
        }

        RoundInfo storage r = rounds[roundsCount];
        r.winner = selected;
        r.prize = totalDeposits;
        r.vrfRequestId = requestId;
        r.players = players;

        for (uint256 i; i < players.length; ++i) {
            depositsAtRound[roundsCount][players[i]] = deposits[players[i]];
        }

        emit WinnerSelected(roundsCount, selected, totalDeposits);

        _startNewRound();
    }

    /*──────────────────────── VIEW / UI HELPERS ─────────────────*/
    /// @notice Net obtenu pour un `gross`.
    function previewNet(uint256 gross) public pure returns (uint256) {
        return Math.mulDiv(gross, (BPS_DENOM - FEE_BPS), BPS_DENOM, Math.Rounding.Floor);
    }
    /// @notice Gross obtenu pour un `net`.
    function previewGross(uint256 net) public pure returns (uint256) {
        return Math.mulDiv(net, BPS_DENOM, (BPS_DENOM - FEE_BPS), Math.Rounding.Ceil);
    }

    /// @notice Montant brut accepté (rogné) pour atteindre la target au maximum.
    function capAmount(uint256 amount) public view returns (uint256) {
        uint256 remaining = TARGET_POOL - totalDeposits;
        if (remaining == 0) return 0;

        uint256 netOnAmount = previewNet(amount);
        if (netOnAmount <= remaining) return amount;

        // ceil(remaining * 10000 / 9750)
        return Math.mulDiv(remaining, BPS_DENOM, (BPS_DENOM - FEE_BPS), Math.Rounding.Ceil);
    }

    function subscriptionLinkBalance() public view returns (uint96) {
        (uint96 linkBal, , , ,) = coordinator.getSubscription(subscriptionId);
        return linkBal;
    }

    /// @notice Montant brut maximal que l’UI peut proposer maintenant (si l’utilisateur met "infini").
    function maxAcceptableGross() external view returns (uint256) { return capAmount(type(uint256).max); }

    function playersCount() external view returns (uint256) { return players.length; }
    function currentRoundActive() external view returns (bool) { return acceptingDeposits; }

    // History
    function roundsHistoryCount() external view returns (uint256) { return roundsCount; }
    function winnerOf(uint256 roundId) external view returns (address) { return rounds[roundId].winner; }
    function prizeOf(uint256 roundId) external view returns (uint256) { return rounds[roundId].prize; }
    function playersOf(uint256 roundId) external view returns (address[] memory) { return rounds[roundId].players; }
    function depositOf(uint256 roundId, address player) external view returns (uint256) { return depositsAtRound[roundId][player]; }
}
