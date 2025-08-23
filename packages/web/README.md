# CumMillionaire - Web Frontend

A decentralized lottery application built on BNB Chain for the CumRocket token (CUMMIES).

## Features

- **Deposit CUMMIES**: Users can deposit any amount of CUMMIES tokens
- **Automatic Lottery**: When total deposits reach 1 million CUMMIES, a winner is automatically selected
- **Winner Withdrawal**: The winner can withdraw the entire jackpot
- **Real-time Stats**: Live tracking of total deposits and lottery progress

## Tech Stack

- **Next.js**: React framework with App Router
- **wagmi**: React hooks for Ethereum
- **Chakra UI v3**: Modern React component library
- **TypeScript**: Type-safe development

## Getting Started

### Prerequisites

- Node.js
- Yarn package manager
- A Reown (WalletConnect) project ID

### Installation

1. Install dependencies:
```bash
yarn
```

2. Copy environment variables:
```bash
cp .env.local.example .env.local
```

3. Get your Reown Project ID from [cloud.reown.com](https://cloud.reown.com) and add it to `.env.local`:
```
NEXT_PUBLIC_PROJECT_ID=your_project_id_here
```

4. Start the development server:
```bash
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Smart Contract Integration

The frontend integrates with the lottery smart contract deployed on BNB Chain. Update the contract addresses in `src/config/contracts.ts`.

## Available Scripts

- `yarn dev`: Start development server
- `yarn build`: Build for production
- `yarn start`: Start production server
- `yarn lint`: Run ESLint
- `yarn type-check`: Run TypeScript compiler

## Deployment

1. Build the application:
```bash
yarn build
```

2. Deploy to your preferred platform (Vercel, Netlify, etc.)

3. Make sure to set the `NEXT_PUBLIC_PROJECT_ID` environment variable in your deployment platform.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request
