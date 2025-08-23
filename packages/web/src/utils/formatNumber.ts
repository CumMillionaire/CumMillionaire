export const fmt = (n: number) => new Intl.NumberFormat('en-EN', { maximumFractionDigits: 2 }).format(Number(n || 0));
