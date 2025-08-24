export const txScanUrl = (hash?: `0x${string}`, chainId?: number) =>
  !hash ? '#' : `${chainId === 97 ? 'https://testnet.bscscan.com/tx/' : 'https://bscscan.com/tx/'}${hash}`;

export const readContractScanUrl = (address: `0x${string}`, chainId?: number) =>
  !address ? '#' : `${chainId === 97 ? 'https://testnet.bscscan.com/address/' : 'https://bscscan.com/address/'}${address}`;
