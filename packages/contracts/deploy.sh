#!/bin/bash

# 🚀 Unified deployment script for CumMillionaire
# Usage: ./deploy.sh [testnet|mainnet]

set -e

# Check if network parameter is provided
if [ -z "$1" ]; then
    echo "❌ Missing network parameter!"
    echo "Usage: ./deploy.sh [testnet|mainnet]"
    echo ""
    echo "Examples:"
    echo "  ./deploy.sh testnet    # Deploy on BSC Testnet"
    echo "  ./deploy.sh mainnet    # Deploy on BSC Mainnet"
    exit 1
fi

NETWORK=$1

# Validate network parameter
if [ "$NETWORK" != "testnet" ] && [ "$NETWORK" != "mainnet" ]; then
    echo "❌ Invalid network: $NETWORK"
    echo "Valid networks: testnet, mainnet"
    exit 1
fi

echo "=== DEPLOYING CUMROCKET LOTTERY ON BSC $(echo "$NETWORK" | tr '[:lower:]' '[:upper:]') ==="
echo ""

# Set environment files based on network
ENV_FILE=".env.$NETWORK"
ENV_LOCAL_FILE=".env.$NETWORK.local"

# Check that the main .env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Missing $ENV_FILE file!"
    echo "📝 Copy the $ENV_FILE file and configure your variables"
    exit 1
fi

echo "📁 Loading environment from: $ENV_FILE"

# Load main environment variables
source "$ENV_FILE"

# Load local overrides if they exist
if [ -f "$ENV_LOCAL_FILE" ]; then
    echo "📁 Loading local overrides from: $ENV_LOCAL_FILE"
    source "$ENV_LOCAL_FILE"
else
    echo "ℹ️  No local overrides file found ($ENV_LOCAL_FILE)"
fi

# Set network-specific variables
if [ "$NETWORK" = "testnet" ]; then
    RPC_URL_VAR="BSC_TESTNET_RPC_URL"
    EXPLORER_NAME="BscScan Testnet"
    EXPLORER_URL="https://testnet.bscscan.com"
    VRF_URL="https://vrf.chain.link/bsc-testnet"
    FAUCET_URL="https://testnet.bnbchain.org/faucet-smart"
    PANCAKESWAP_URL="https://pancakeswap.finance/?chain=bscTestnet"
else
    RPC_URL_VAR="BSC_MAINNET_RPC_URL"
    EXPLORER_NAME="BscScan"
    EXPLORER_URL="https://bscscan.com"
    VRF_URL="https://vrf.chain.link/bsc"
    FAUCET_URL=""
    PANCAKESWAP_URL="https://pancakeswap.finance/?chain=bsc"
fi

# Get RPC URL dynamically based on network
RPC_URL=$(eval echo \$$RPC_URL_VAR)

# Check critical variables
if [ -z "$PRIVATE_KEY" ] || [ "$PRIVATE_KEY" = "your_private_key_here" ]; then
    echo "❌ PRIVATE_KEY not configured in $ENV_FILE"
    exit 1
fi

if [ -z "$VRF_SUB_ID" ] || [ "$VRF_SUB_ID" = "your_vrf_subscription_id_here" ]; then
    echo "❌ VRF_SUB_ID not configured in $ENV_FILE"
    echo "🔗 Create a subscription at: $VRF_URL"
    exit 1
fi

if [ -z "$RPC_URL" ]; then
    echo "❌ $RPC_URL_VAR not configured in $ENV_FILE"
    exit 1
fi

echo "✅ Configuration validated for $NETWORK"
echo "🌐 RPC URL: $RPC_URL"
echo "🏗️  Deploying..."
echo ""

# Export environment variables for forge script
export CUMMIES_TOKEN
export WBNB_TOKEN
export LINK_TOKEN
export SWAP_ROUTER
export VRF_COORDINATOR
export PERMIT2_ADDRESS
export VRF_SUB_ID
export VRF_KEY_HASH

# Deployment with Foundry
if [ -z "$BSCSCAN_API_KEY" ] || [ "$BSCSCAN_API_KEY" = "your_bscscan_api_key_here" ]; then
    echo "⚠️  Deploying without automatic verification (no BscScan API key)"
    forge script script/Deploy.s.sol \
        --rpc-url "$RPC_URL" \
        --broadcast \
        --private-key "$PRIVATE_KEY"
else
    echo "🔍 Deploying with verification on $EXPLORER_NAME"
    forge script script/Deploy.s.sol \
        --rpc-url "$RPC_URL" \
        --broadcast \
        --private-key "$PRIVATE_KEY" \
        --verify \
        --etherscan-api-key "$BSCSCAN_API_KEY"
fi

echo ""
echo "🎉 === DEPLOYMENT COMPLETED ON BSC $(echo "$NETWORK" | tr '[:lower:]' '[:upper:]') ==="
echo ""
echo "📋 NEXT STEPS:"
echo "1. 🔗 Go to $VRF_URL"
echo "2. 🎯 Add the contract address as a consumer to your VRF subscription"
echo "3. 💰 Fund your subscription with LINK tokens"
echo "4. 🧪 Test the contract on $EXPLORER_URL"
echo ""

if [ "$NETWORK" = "testnet" ]; then
    echo "💡 USEFUL LINKS (TESTNET):"
    echo "   • BSC Testnet Faucet: $FAUCET_URL"
    echo "   • PancakeSwap Testnet: $PANCAKESWAP_URL"
    echo "   • $EXPLORER_NAME: $EXPLORER_URL"
    echo "   • Chainlink VRF: $VRF_URL"
else
    echo "💡 USEFUL LINKS (MAINNET):"
    echo "   • PancakeSwap: $PANCAKESWAP_URL"
    echo "   • $EXPLORER_NAME: $EXPLORER_URL"
    echo "   • Chainlink VRF: $VRF_URL"
fi

echo ""
