export const shortAddr = (a?: `0x${string}`) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '—');
