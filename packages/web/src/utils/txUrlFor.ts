export const txUrlFor = (hash?: `0x${string}`, chainId?: number) =>
  !hash ? '#' : `${chainId === 97 ? 'https://testnet.bscscan.com/tx/' : 'https://bscscan.com/tx/'}${hash}`;
