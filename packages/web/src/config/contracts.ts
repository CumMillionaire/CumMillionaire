import { Address } from 'viem';

export const CONTRACT_URL = 'https://github.com/CumMillionaire/CumMillionaire/blob/main/packages/contracts/src/CumRocketLottery.sol';

const CONTRACTS_MAP: Record<string, any> = {
  mainnet: {
    LOTTERY: '0x78C6836d6240498E186dc85190B32378779Ee1a4' as Address,
    CUMMIES_TOKEN: '0x27Ae27110350B98d564b9A3eeD31bAeBc82d878d' as Address,
    PERMIT2: '0x000000000022D473030F116dDEE9F6B43aC78BA3' as Address,
  },
  testnet: {
    LOTTERY: '0x4b159933FE67F04a6d38F04e8b3FFF622BF0798d' as Address,
    CUMMIES_TOKEN: '0x381289c785D0094d4c42f8bfB1215DE48d7f1ff8' as Address,
    PERMIT2: '0x000000000022D473030F116dDEE9F6B43aC78BA3' as Address,
  },
  local: {
    LOTTERY: '0x524F04724632eED237cbA3c37272e018b3A7967e' as Address,
    CUMMIES_TOKEN: '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318' as Address,
    PERMIT2: '0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82' as Address,
  },
} as const;

export const CONTRACTS = CONTRACTS_MAP[process.env.NEXT_PUBLIC_CHAIN_NAME || 'local'];

export const CUMMIES_ABI = [{
  'inputs': [],
  'stateMutability': 'nonpayable',
  'type': 'constructor',
}, {
  'anonymous': false,
  'inputs': [{ 'indexed': true, 'internalType': 'address', 'name': 'owner', 'type': 'address' }, {
    'indexed': true,
    'internalType': 'address',
    'name': 'spender',
    'type': 'address',
  }, { 'indexed': false, 'internalType': 'uint256', 'name': 'value', 'type': 'uint256' }],
  'name': 'Approval',
  'type': 'event',
}, {
  'anonymous': false,
  'inputs': [{
    'indexed': true,
    'internalType': 'address',
    'name': 'previousOwner',
    'type': 'address',
  }, { 'indexed': true, 'internalType': 'address', 'name': 'newOwner', 'type': 'address' }],
  'name': 'OwnershipTransferred',
  'type': 'event',
}, {
  'anonymous': false,
  'inputs': [{ 'indexed': true, 'internalType': 'address', 'name': 'from', 'type': 'address' }, {
    'indexed': true,
    'internalType': 'address',
    'name': 'to',
    'type': 'address',
  }, { 'indexed': false, 'internalType': 'uint256', 'name': 'value', 'type': 'uint256' }],
  'name': 'Transfer',
  'type': 'event',
}, {
  'inputs': [],
  'name': '_getBurnFee',
  'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
  'stateMutability': 'view',
  'type': 'function',
}, {
  'inputs': [],
  'name': '_getTaxFee',
  'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
  'stateMutability': 'view',
  'type': 'function',
}, {
  'inputs': [{ 'internalType': 'uint256', 'name': 'burnFee', 'type': 'uint256' }],
  'name': '_setBurnFee',
  'outputs': [],
  'stateMutability': 'nonpayable',
  'type': 'function',
}, {
  'inputs': [{ 'internalType': 'uint256', 'name': 'taxFee', 'type': 'uint256' }],
  'name': '_setTaxFee',
  'outputs': [],
  'stateMutability': 'nonpayable',
  'type': 'function',
}, {
  'inputs': [{ 'internalType': 'address', 'name': 'owner', 'type': 'address' }, {
    'internalType': 'address',
    'name': 'spender',
    'type': 'address',
  }],
  'name': 'allowance',
  'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
  'stateMutability': 'view',
  'type': 'function',
}, {
  'inputs': [{ 'internalType': 'address', 'name': 'spender', 'type': 'address' }, {
    'internalType': 'uint256',
    'name': 'amount',
    'type': 'uint256',
  }],
  'name': 'approve',
  'outputs': [{ 'internalType': 'bool', 'name': '', 'type': 'bool' }],
  'stateMutability': 'nonpayable',
  'type': 'function',
}, {
  'inputs': [{ 'internalType': 'address', 'name': 'account', 'type': 'address' }],
  'name': 'balanceOf',
  'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
  'stateMutability': 'view',
  'type': 'function',
}, {
  'inputs': [],
  'name': 'decimals',
  'outputs': [{ 'internalType': 'uint8', 'name': '', 'type': 'uint8' }],
  'stateMutability': 'view',
  'type': 'function',
}, {
  'inputs': [{ 'internalType': 'address', 'name': 'spender', 'type': 'address' }, {
    'internalType': 'uint256',
    'name': 'subtractedValue',
    'type': 'uint256',
  }],
  'name': 'decreaseAllowance',
  'outputs': [{ 'internalType': 'bool', 'name': '', 'type': 'bool' }],
  'stateMutability': 'nonpayable',
  'type': 'function',
}, {
  'inputs': [{ 'internalType': 'uint256', 'name': 'tAmount', 'type': 'uint256' }],
  'name': 'deliver',
  'outputs': [],
  'stateMutability': 'nonpayable',
  'type': 'function',
}, {
  'inputs': [{ 'internalType': 'address', 'name': 'account', 'type': 'address' }],
  'name': 'excludeAccount',
  'outputs': [],
  'stateMutability': 'nonpayable',
  'type': 'function',
}, {
  'inputs': [{ 'internalType': 'address', 'name': 'account', 'type': 'address' }],
  'name': 'includeAccount',
  'outputs': [],
  'stateMutability': 'nonpayable',
  'type': 'function',
}, {
  'inputs': [{ 'internalType': 'address', 'name': 'spender', 'type': 'address' }, {
    'internalType': 'uint256',
    'name': 'addedValue',
    'type': 'uint256',
  }],
  'name': 'increaseAllowance',
  'outputs': [{ 'internalType': 'bool', 'name': '', 'type': 'bool' }],
  'stateMutability': 'nonpayable',
  'type': 'function',
}, {
  'inputs': [{ 'internalType': 'address', 'name': '', 'type': 'address' }],
  'name': 'isAllowed',
  'outputs': [{ 'internalType': 'bool', 'name': '', 'type': 'bool' }],
  'stateMutability': 'view',
  'type': 'function',
}, {
  'inputs': [{ 'internalType': 'address', 'name': 'account', 'type': 'address' }],
  'name': 'isExcluded',
  'outputs': [{ 'internalType': 'bool', 'name': '', 'type': 'bool' }],
  'stateMutability': 'view',
  'type': 'function',
}, {
  'inputs': [],
  'name': 'isPaused',
  'outputs': [{ 'internalType': 'bool', 'name': '', 'type': 'bool' }],
  'stateMutability': 'view',
  'type': 'function',
}, {
  'inputs': [],
  'name': 'max_tx_size',
  'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
  'stateMutability': 'view',
  'type': 'function',
}, {
  'inputs': [],
  'name': 'name',
  'outputs': [{ 'internalType': 'string', 'name': '', 'type': 'string' }],
  'stateMutability': 'view',
  'type': 'function',
}, {
  'inputs': [],
  'name': 'owner',
  'outputs': [{ 'internalType': 'address', 'name': '', 'type': 'address' }],
  'stateMutability': 'view',
  'type': 'function',
}, {
  'inputs': [{ 'internalType': 'uint256', 'name': 'tAmount', 'type': 'uint256' }, {
    'internalType': 'bool',
    'name': 'deductTransferFee',
    'type': 'bool',
  }],
  'name': 'reflectionFromToken',
  'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
  'stateMutability': 'view',
  'type': 'function',
}, {
  'inputs': [],
  'name': 'renounceOwnership',
  'outputs': [],
  'stateMutability': 'nonpayable',
  'type': 'function',
}, {
  'inputs': [{ 'internalType': 'uint256', 'name': 'newMax', 'type': 'uint256' }],
  'name': 'setMaxTxAmount',
  'outputs': [],
  'stateMutability': 'nonpayable',
  'type': 'function',
}, {
  'inputs': [],
  'name': 'symbol',
  'outputs': [{ 'internalType': 'string', 'name': '', 'type': 'string' }],
  'stateMutability': 'view',
  'type': 'function',
}, {
  'inputs': [{ 'internalType': 'address', 'name': 'addr', 'type': 'address' }],
  'name': 'toggleAllowed',
  'outputs': [],
  'stateMutability': 'nonpayable',
  'type': 'function',
}, {
  'inputs': [{ 'internalType': 'uint256', 'name': 'rAmount', 'type': 'uint256' }],
  'name': 'tokenFromReflection',
  'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
  'stateMutability': 'view',
  'type': 'function',
}, {
  'inputs': [],
  'name': 'totalBurn',
  'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
  'stateMutability': 'view',
  'type': 'function',
}, {
  'inputs': [],
  'name': 'totalFees',
  'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
  'stateMutability': 'view',
  'type': 'function',
}, {
  'inputs': [],
  'name': 'totalSupply',
  'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
  'stateMutability': 'view',
  'type': 'function',
}, {
  'inputs': [{ 'internalType': 'address', 'name': 'recipient', 'type': 'address' }, {
    'internalType': 'uint256',
    'name': 'amount',
    'type': 'uint256',
  }],
  'name': 'transfer',
  'outputs': [{ 'internalType': 'bool', 'name': '', 'type': 'bool' }],
  'stateMutability': 'nonpayable',
  'type': 'function',
}, {
  'inputs': [{ 'internalType': 'address', 'name': 'sender', 'type': 'address' }, {
    'internalType': 'address',
    'name': 'recipient',
    'type': 'address',
  }, { 'internalType': 'uint256', 'name': 'amount', 'type': 'uint256' }],
  'name': 'transferFrom',
  'outputs': [{ 'internalType': 'bool', 'name': '', 'type': 'bool' }],
  'stateMutability': 'nonpayable',
  'type': 'function',
}, {
  'inputs': [{ 'internalType': 'address', 'name': 'newOwner', 'type': 'address' }],
  'name': 'transferOwnership',
  'outputs': [],
  'stateMutability': 'nonpayable',
  'type': 'function',
}, {
  'inputs': [],
  'name': 'unpause',
  'outputs': [{ 'internalType': 'bool', 'name': '', 'type': 'bool' }],
  'stateMutability': 'nonpayable',
  'type': 'function',
}] as const;

export const LOTTERY_ABI = [{
  'type': 'constructor',
  'inputs': [{ 'name': '_cummies', 'type': 'address', 'internalType': 'address' }, {
    'name': '_wNative',
    'type': 'address',
    'internalType': 'address',
  }, { 'name': '_linkToken', 'type': 'address', 'internalType': 'address' }, {
    'name': '_swapRouter',
    'type': 'address',
    'internalType': 'address',
  }, { 'name': '_vrfCoordinator', 'type': 'address', 'internalType': 'address' }, {
    'name': '_permit2',
    'type': 'address',
    'internalType': 'address',
  }, { 'name': '_subscriptionId', 'type': 'uint256', 'internalType': 'uint256' }, {
    'name': '_keyHash',
    'type': 'bytes32',
    'internalType': 'bytes32',
  }],
  'stateMutability': 'nonpayable',
}, {
  'type': 'function',
  'name': 'CALLBACK_GAS_LIMIT',
  'inputs': [],
  'outputs': [{ 'name': '', 'type': 'uint32', 'internalType': 'uint32' }],
  'stateMutability': 'view',
}, {
  'type': 'function',
  'name': 'FEE_BPS',
  'inputs': [],
  'outputs': [{ 'name': '', 'type': 'uint256', 'internalType': 'uint256' }],
  'stateMutability': 'view',
}, {
  'type': 'function',
  'name': 'NUM_WORDS',
  'inputs': [],
  'outputs': [{ 'name': '', 'type': 'uint32', 'internalType': 'uint32' }],
  'stateMutability': 'view',
}, {
  'type': 'function',
  'name': 'REQUEST_CONFIRMATION',
  'inputs': [],
  'outputs': [{ 'name': '', 'type': 'uint16', 'internalType': 'uint16' }],
  'stateMutability': 'view',
}, {
  'type': 'function',
  'name': 'TARGET_POOL',
  'inputs': [],
  'outputs': [{ 'name': '', 'type': 'uint256', 'internalType': 'uint256' }],
  'stateMutability': 'view',
}, {
  'type': 'function',
  'name': 'acceptOwnership',
  'inputs': [],
  'outputs': [],
  'stateMutability': 'nonpayable',
}, {
  'type': 'function',
  'name': 'acceptingDeposits',
  'inputs': [],
  'outputs': [{ 'name': '', 'type': 'bool', 'internalType': 'bool' }],
  'stateMutability': 'view',
}, {
  'type': 'function',
  'name': 'capAmount',
  'inputs': [{ 'name': 'amount', 'type': 'uint256', 'internalType': 'uint256' }],
  'outputs': [{ 'name': '', 'type': 'uint256', 'internalType': 'uint256' }],
  'stateMutability': 'view',
}, {
  'type': 'function',
  'name': 'claimPrize',
  'inputs': [{ 'name': 'roundId', 'type': 'uint256', 'internalType': 'uint256' }],
  'outputs': [],
  'stateMutability': 'nonpayable',
}, {
  'type': 'function',
  'name': 'cummies',
  'inputs': [],
  'outputs': [{ 'name': '', 'type': 'address', 'internalType': 'contract IERC20' }],
  'stateMutability': 'view',
}, {
  'type': 'function',
  'name': 'currentRoundActive',
  'inputs': [],
  'outputs': [{ 'name': '', 'type': 'bool', 'internalType': 'bool' }],
  'stateMutability': 'view',
}, {
  'type': 'function',
  'name': 'deposit',
  'inputs': [{ 'name': 'amount', 'type': 'uint256', 'internalType': 'uint256' }],
  'outputs': [],
  'stateMutability': 'nonpayable',
}, {
  'type': 'function',
  'name': 'depositOf',
  'inputs': [{ 'name': 'roundId', 'type': 'uint256', 'internalType': 'uint256' }, {
    'name': 'player',
    'type': 'address',
    'internalType': 'address',
  }],
  'outputs': [{ 'name': '', 'type': 'uint256', 'internalType': 'uint256' }],
  'stateMutability': 'view',
}, {
  'type': 'function',
  'name': 'depositWithPermit2',
  'inputs': [{
    'name': 'permit',
    'type': 'tuple',
    'internalType': 'struct ISignatureTransfer.PermitTransferFrom',
    'components': [{
      'name': 'permitted',
      'type': 'tuple',
      'internalType': 'struct ISignatureTransfer.TokenPermissions',
      'components': [{ 'name': 'token', 'type': 'address', 'internalType': 'address' }, {
        'name': 'amount',
        'type': 'uint256',
        'internalType': 'uint256',
      }],
    }, { 'name': 'nonce', 'type': 'uint256', 'internalType': 'uint256' }, {
      'name': 'deadline',
      'type': 'uint256',
      'internalType': 'uint256',
    }],
  }, { 'name': 'signature', 'type': 'bytes', 'internalType': 'bytes' }, {
    'name': 'amount',
    'type': 'uint256',
    'internalType': 'uint256',
  }],
  'outputs': [],
  'stateMutability': 'nonpayable',
}, {
  'type': 'function',
  'name': 'deposits',
  'inputs': [{ 'name': '', 'type': 'address', 'internalType': 'address' }],
  'outputs': [{ 'name': '', 'type': 'uint256', 'internalType': 'uint256' }],
  'stateMutability': 'view',
}, {
  'type': 'function',
  'name': 'depositsAtRound',
  'inputs': [{ 'name': '', 'type': 'uint256', 'internalType': 'uint256' }, {
    'name': '',
    'type': 'address',
    'internalType': 'address',
  }],
  'outputs': [{ 'name': '', 'type': 'uint256', 'internalType': 'uint256' }],
  'stateMutability': 'view',
}, {
  'type': 'function',
  'name': 'keyHash',
  'inputs': [],
  'outputs': [{ 'name': '', 'type': 'bytes32', 'internalType': 'bytes32' }],
  'stateMutability': 'view',
}, {
  'type': 'function',
  'name': 'linkToken',
  'inputs': [],
  'outputs': [{ 'name': '', 'type': 'address', 'internalType': 'contract ILinkToken' }],
  'stateMutability': 'view',
}, {
  'type': 'function',
  'name': 'maxAcceptableGross',
  'inputs': [],
  'outputs': [{ 'name': '', 'type': 'uint256', 'internalType': 'uint256' }],
  'stateMutability': 'view',
}, {
  'type': 'function',
  'name': 'minLinkBalance',
  'inputs': [],
  'outputs': [{ 'name': '', 'type': 'uint256', 'internalType': 'uint256' }],
  'stateMutability': 'view',
}, {
  'type': 'function',
  'name': 'owner',
  'inputs': [],
  'outputs': [{ 'name': '', 'type': 'address', 'internalType': 'address' }],
  'stateMutability': 'view',
}, {
  'type': 'function',
  'name': 'permit2',
  'inputs': [],
  'outputs': [{ 'name': '', 'type': 'address', 'internalType': 'contract ISignatureTransfer' }],
  'stateMutability': 'view',
}, {
  'type': 'function',
  'name': 'players',
  'inputs': [{ 'name': '', 'type': 'uint256', 'internalType': 'uint256' }],
  'outputs': [{ 'name': '', 'type': 'address', 'internalType': 'address' }],
  'stateMutability': 'view',
}, {
  'type': 'function',
  'name': 'playersCount',
  'inputs': [],
  'outputs': [{ 'name': '', 'type': 'uint256', 'internalType': 'uint256' }],
  'stateMutability': 'view',
}, {
  'type': 'function',
  'name': 'playersOf',
  'inputs': [{ 'name': 'roundId', 'type': 'uint256', 'internalType': 'uint256' }],
  'outputs': [{ 'name': '', 'type': 'address[]', 'internalType': 'address[]' }],
  'stateMutability': 'view',
}, {
  'type': 'function',
  'name': 'previewGross',
  'inputs': [{ 'name': 'net', 'type': 'uint256', 'internalType': 'uint256' }],
  'outputs': [{ 'name': '', 'type': 'uint256', 'internalType': 'uint256' }],
  'stateMutability': 'pure',
}, {
  'type': 'function',
  'name': 'previewNet',
  'inputs': [{ 'name': 'gross', 'type': 'uint256', 'internalType': 'uint256' }],
  'outputs': [{ 'name': '', 'type': 'uint256', 'internalType': 'uint256' }],
  'stateMutability': 'pure',
}, {
  'type': 'function',
  'name': 'prizeOf',
  'inputs': [{ 'name': 'roundId', 'type': 'uint256', 'internalType': 'uint256' }],
  'outputs': [{ 'name': '', 'type': 'uint256', 'internalType': 'uint256' }],
  'stateMutability': 'view',
}, {
  'type': 'function',
  'name': 'protocolFees',
  'inputs': [],
  'outputs': [{ 'name': '', 'type': 'uint256', 'internalType': 'uint256' }],
  'stateMutability': 'view',
}, {
  'type': 'function',
  'name': 'rawFulfillRandomWords',
  'inputs': [{ 'name': 'requestId', 'type': 'uint256', 'internalType': 'uint256' }, {
    'name': 'randomWords',
    'type': 'uint256[]',
    'internalType': 'uint256[]',
  }],
  'outputs': [],
  'stateMutability': 'nonpayable',
}, {
  'type': 'function',
  'name': 'requestRandomness',
  'inputs': [],
  'outputs': [],
  'stateMutability': 'nonpayable',
}, {
  'type': 'function',
  'name': 'rounds',
  'inputs': [{ 'name': '', 'type': 'uint256', 'internalType': 'uint256' }],
  'outputs': [{ 'name': 'winner', 'type': 'address', 'internalType': 'address' }, {
    'name': 'prize',
    'type': 'uint256',
    'internalType': 'uint256',
  }, { 'name': 'claimed', 'type': 'bool', 'internalType': 'bool' }, {
    'name': 'vrfRequestId',
    'type': 'uint256',
    'internalType': 'uint256',
  }],
  'stateMutability': 'view',
}, {
  'type': 'function',
  'name': 'roundsCount',
  'inputs': [],
  'outputs': [{ 'name': '', 'type': 'uint256', 'internalType': 'uint256' }],
  'stateMutability': 'view',
}, {
  'type': 'function',
  'name': 'roundsHistoryCount',
  'inputs': [],
  'outputs': [{ 'name': '', 'type': 'uint256', 'internalType': 'uint256' }],
  'stateMutability': 'view',
}, {
  'type': 'function',
  'name': 's_vrfCoordinator',
  'inputs': [],
  'outputs': [{ 'name': '', 'type': 'address', 'internalType': 'contract IVRFCoordinatorV2Plus' }],
  'stateMutability': 'view',
}, {
  'type': 'function',
  'name': 'setCoordinator',
  'inputs': [{ 'name': '_vrfCoordinator', 'type': 'address', 'internalType': 'address' }],
  'outputs': [],
  'stateMutability': 'nonpayable',
}, {
  'type': 'function',
  'name': 'setMinLinkBalance',
  'inputs': [{ 'name': '_min', 'type': 'uint256', 'internalType': 'uint256' }],
  'outputs': [],
  'stateMutability': 'nonpayable',
}, {
  'type': 'function',
  'name': 'setSlippageBps',
  'inputs': [{ 'name': '_bps', 'type': 'uint256', 'internalType': 'uint256' }],
  'outputs': [],
  'stateMutability': 'nonpayable',
}, {
  'type': 'function',
  'name': 'setSwapRouter',
  'inputs': [{ 'name': '_router', 'type': 'address', 'internalType': 'address' }],
  'outputs': [],
  'stateMutability': 'nonpayable',
}, {
  'type': 'function',
  'name': 'slippageBps',
  'inputs': [],
  'outputs': [{ 'name': '', 'type': 'uint256', 'internalType': 'uint256' }],
  'stateMutability': 'view',
}, {
  'type': 'function',
  'name': 'subscriptionId',
  'inputs': [],
  'outputs': [{ 'name': '', 'type': 'uint256', 'internalType': 'uint256' }],
  'stateMutability': 'view',
}, {
  'type': 'function',
  'name': 'subscriptionLinkBalance',
  'inputs': [],
  'outputs': [{ 'name': '', 'type': 'uint96', 'internalType': 'uint96' }],
  'stateMutability': 'view',
}, {
  'type': 'function',
  'name': 'swapRouter',
  'inputs': [],
  'outputs': [{ 'name': '', 'type': 'address', 'internalType': 'contract ISwapRouter' }],
  'stateMutability': 'view',
}, {
  'type': 'function',
  'name': 'totalDeposits',
  'inputs': [],
  'outputs': [{ 'name': '', 'type': 'uint256', 'internalType': 'uint256' }],
  'stateMutability': 'view',
}, {
  'type': 'function',
  'name': 'transferOwnership',
  'inputs': [{ 'name': 'to', 'type': 'address', 'internalType': 'address' }],
  'outputs': [],
  'stateMutability': 'nonpayable',
}, {
  'type': 'function',
  'name': 'vrfRequestId',
  'inputs': [],
  'outputs': [{ 'name': '', 'type': 'uint256', 'internalType': 'uint256' }],
  'stateMutability': 'view',
}, {
  'type': 'function',
  'name': 'wNative',
  'inputs': [],
  'outputs': [{ 'name': '', 'type': 'address', 'internalType': 'address' }],
  'stateMutability': 'view',
}, {
  'type': 'function',
  'name': 'winnerOf',
  'inputs': [{ 'name': 'roundId', 'type': 'uint256', 'internalType': 'uint256' }],
  'outputs': [{ 'name': '', 'type': 'address', 'internalType': 'address' }],
  'stateMutability': 'view',
}, {
  'type': 'event',
  'name': 'CoordinatorSet',
  'inputs': [{ 'name': 'vrfCoordinator', 'type': 'address', 'indexed': false, 'internalType': 'address' }],
  'anonymous': false,
}, {
  'type': 'event',
  'name': 'DepositClosed',
  'inputs': [{
    'name': 'netPool',
    'type': 'uint256',
    'indexed': false,
    'internalType': 'uint256',
  }, { 'name': 'feesPool', 'type': 'uint256', 'indexed': false, 'internalType': 'uint256' }],
  'anonymous': false,
}, {
  'type': 'event',
  'name': 'Deposited',
  'inputs': [{ 'name': 'roundId', 'type': 'uint256', 'indexed': true, 'internalType': 'uint256' }, {
    'name': 'player',
    'type': 'address',
    'indexed': true,
    'internalType': 'address',
  }, { 'name': 'amountNet', 'type': 'uint256', 'indexed': false, 'internalType': 'uint256' }, {
    'name': 'fee',
    'type': 'uint256',
    'indexed': false,
    'internalType': 'uint256',
  }],
  'anonymous': false,
}, {
  'type': 'event',
  'name': 'MinLinkBalanceUpdated',
  'inputs': [{ 'name': 'newMin', 'type': 'uint256', 'indexed': false, 'internalType': 'uint256' }],
  'anonymous': false,
}, {
  'type': 'event',
  'name': 'NewRoundStarted',
  'inputs': [{ 'name': 'newRoundId', 'type': 'uint256', 'indexed': true, 'internalType': 'uint256' }],
  'anonymous': false,
}, {
  'type': 'event',
  'name': 'OwnershipTransferRequested',
  'inputs': [{ 'name': 'from', 'type': 'address', 'indexed': true, 'internalType': 'address' }, {
    'name': 'to',
    'type': 'address',
    'indexed': true,
    'internalType': 'address',
  }],
  'anonymous': false,
}, {
  'type': 'event',
  'name': 'OwnershipTransferred',
  'inputs': [{ 'name': 'from', 'type': 'address', 'indexed': true, 'internalType': 'address' }, {
    'name': 'to',
    'type': 'address',
    'indexed': true,
    'internalType': 'address',
  }],
  'anonymous': false,
}, {
  'type': 'event',
  'name': 'PrizeClaimed',
  'inputs': [{ 'name': 'roundId', 'type': 'uint256', 'indexed': true, 'internalType': 'uint256' }, {
    'name': 'winner',
    'type': 'address',
    'indexed': true,
    'internalType': 'address',
  }, { 'name': 'amount', 'type': 'uint256', 'indexed': false, 'internalType': 'uint256' }],
  'anonymous': false,
}, {
  'type': 'event',
  'name': 'RandomnessRequested',
  'inputs': [{
    'name': 'requestId',
    'type': 'uint256',
    'indexed': true,
    'internalType': 'uint256',
  }, { 'name': 'roundId', 'type': 'uint256', 'indexed': true, 'internalType': 'uint256' }],
  'anonymous': false,
}, {
  'type': 'event',
  'name': 'RouterUpdated',
  'inputs': [{ 'name': 'newRouter', 'type': 'address', 'indexed': false, 'internalType': 'address' }],
  'anonymous': false,
}, {
  'type': 'event',
  'name': 'SlippageUpdated',
  'inputs': [{ 'name': 'newSlippageBps', 'type': 'uint256', 'indexed': false, 'internalType': 'uint256' }],
  'anonymous': false,
}, {
  'type': 'event',
  'name': 'WinnerSelected',
  'inputs': [{ 'name': 'roundId', 'type': 'uint256', 'indexed': true, 'internalType': 'uint256' }, {
    'name': 'winner',
    'type': 'address',
    'indexed': true,
    'internalType': 'address',
  }, { 'name': 'amountWon', 'type': 'uint256', 'indexed': false, 'internalType': 'uint256' }],
  'anonymous': false,
}, { 'type': 'error', 'name': 'AlreadyClaimed', 'inputs': [] }, {
  'type': 'error',
  'name': 'AmountExceedsPermit',
  'inputs': [],
}, { 'type': 'error', 'name': 'DepositsClosed', 'inputs': [] }, {
  'type': 'error',
  'name': 'DepositsOpen',
  'inputs': [],
}, { 'type': 'error', 'name': 'FeesInsufficient', 'inputs': [] }, {
  'type': 'error',
  'name': 'NotWinner',
  'inputs': [],
}, {
  'type': 'error',
  'name': 'OnlyCoordinatorCanFulfill',
  'inputs': [{ 'name': 'have', 'type': 'address', 'internalType': 'address' }, {
    'name': 'want',
    'type': 'address',
    'internalType': 'address',
  }],
}, {
  'type': 'error',
  'name': 'OnlyOwnerOrCoordinator',
  'inputs': [{ 'name': 'have', 'type': 'address', 'internalType': 'address' }, {
    'name': 'owner',
    'type': 'address',
    'internalType': 'address',
  }, { 'name': 'coordinator', 'type': 'address', 'internalType': 'address' }],
}, { 'type': 'error', 'name': 'PrizeUnclaimed', 'inputs': [] }, {
  'type': 'error',
  'name': 'ReentrancyGuardReentrantCall',
  'inputs': [],
}, {
  'type': 'error',
  'name': 'SafeERC20FailedOperation',
  'inputs': [{ 'name': 'token', 'type': 'address', 'internalType': 'address' }],
}, { 'type': 'error', 'name': 'SlippageTooHigh', 'inputs': [] }, {
  'type': 'error',
  'name': 'VRFAlreadyRequested',
  'inputs': [],
}, { 'type': 'error', 'name': 'WinnerAlreadySelected', 'inputs': [] }, {
  'type': 'error',
  'name': 'ZeroAddress',
  'inputs': [],
}, { 'type': 'error', 'name': 'ZeroAmount', 'inputs': [] }] as const;

export const ERC20_ERRORS_ABI = [
  {
    'type': 'error',
    'name': 'ERC20InsufficientAllowance',
    'inputs': [
      { 'name': 'spender', 'type': 'address', 'internalType': 'address' },
      { 'name': 'allowance', 'type': 'uint256', 'internalType': 'uint256' },
      { 'name': 'needed', 'type': 'uint256', 'internalType': 'uint256' }
    ]
  },
  {
    'type': 'error',
    'name': 'ERC20InsufficientBalance',
    'inputs': [
      { 'name': 'sender', 'type': 'address', 'internalType': 'address' },
      { 'name': 'balance', 'type': 'uint256', 'internalType': 'uint256' },
      { 'name': 'needed', 'type': 'uint256', 'internalType': 'uint256' }
    ]
  },
  {
    'type': 'error',
    'name': 'ERC20InvalidSender',
    'inputs': [
      { 'name': 'sender', 'type': 'address', 'internalType': 'address' }
    ]
  },
  {
    'type': 'error',
    'name': 'ERC20InvalidReceiver',
    'inputs': [
      { 'name': 'receiver', 'type': 'address', 'internalType': 'address' }
    ]
  }
] as const;

// Constants
export const LOTTERY_THRESHOLD = BigInt('1000000000000000000000000'); // 1 million CUMMIES (18 decimals)
