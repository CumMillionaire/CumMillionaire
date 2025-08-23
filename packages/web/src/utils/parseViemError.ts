import {
  BaseError,
  ContractFunctionRevertedError,
  decodeErrorResult,
  isHex,
  Abi,
} from 'viem';
import { ERC20_ERRORS_ABI } from '@/config/contracts';

const ERROR_LINE = /^Error:\s*([A-Za-z0-9_]+)\s*(?:\((.*)\))?/; // "Error: DepositsClosed()" or "Error: InsufficientAllowance(123)"

export function parseViemError(
  err: unknown,
  abis: Abi[] = [ERC20_ERRORS_ABI],
): { tag?: string; args?: unknown[]; message: string } {
  console.error(err);

  let tag: string | undefined;
  let args: unknown[] | undefined;

  const e = err as BaseError;
  const cause: any = (e as any)?.walk?.((err: any) => err instanceof ContractFunctionRevertedError) ?? err;

  // 1) best case: viem already gives us the error name
  if (cause instanceof ContractFunctionRevertedError) {
    tag = cause?.data?.errorName || (cause?.data?.abiItem as any)?.name;
    args = cause?.data?.args as unknown[] | undefined;
  }

  // 2) fallback: metaMessages[0] = "Error: DepositsClosed()"
  if (!tag && Array.isArray((e as any)?.metaMessages)) {
    const first = String((e as any).metaMessages[0] || '');
    const m = first.match(ERROR_LINE);
    if (m) {
      tag = m[1];
      if (m[2]) {
        args = m[2].length ? m[2].split(/\s*,\s*/) : [];
      }
    }
  }

  // 3) decode revert raw data with ABI
  // const revertData = cause?.data?.data ?? cause?.data ?? cause?.cause?.data;
  const revertData = cause?.raw;
  if (!tag && isHex(revertData)) {
    // Try contract's own ABI first
    if ((e as any).abi) {
      try {
        const dec = decodeErrorResult({
          abi: (e as any).abi,
          data: revertData,
        });
        tag = dec.errorName;
        args = dec.args as unknown[] | undefined;
      } catch {
      }
    }

    // Try additional ABIs if still no match
    if (!tag && abis.length > 0) {
      for (const abi of abis) {
        try {
          const dec = decodeErrorResult({ abi, data: revertData });
          tag = dec.errorName;
          args = dec.args as unknown[] | undefined;
          break;
        } catch {
          // Continue to next ABI
        }
      }
    }
  }

  const message =
    (friendlyMessage(tag, args) ?? (e as any)?.shortMessage) ||
    `Transaction reverted${tag ? `: (${tag})` : ''}`;

  return { tag, args, message };
}

function friendlyMessage(name?: string, args?: unknown[]) {
  switch (name) {
    case 'DepositsClosed':
      return 'Deposits are currently closed.';
    case 'DeadlineExpired':
      return 'Signature deadline has passed. Please sign again.';
    case 'InsufficientAllowance':
      return 'Allowance too low. Increase approval or use Permit2.';
    case 'InsufficientBalance':
      return 'Insufficient token balance.';
    case 'ERC20InsufficientAllowance':
      const [_spender, allowance, needed] = args || [];
      return `Insufficient allowance. Current: ${allowance}, needed: ${needed}. Please increase approval.`;
    case 'ERC20InsufficientBalance':
      const [_sender, balance, neededBalance] = args || [];
      return `Insufficient balance. Current: ${balance}, needed: ${neededBalance}.`;
    case 'ERC20InvalidSender':
      return 'Invalid sender address.';
    case 'ERC20InvalidReceiver':
      return 'Invalid receiver address.';
    default:
      // Si c’est Error(string), l’info utile est souvent dans args[0]
      if (name === 'Error' && typeof args?.[0] === 'string')
        return String(args[0]);
      return undefined;
  }
}
