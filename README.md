This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-onchain`](https://www.npmjs.com/package/create-onchain).


## Getting Started

First, install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

Next, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Wallet Setup

This app supports **MetaMask** and Coinbase Wallet for sending transactions on **Base Sepolia testnet**.

### Using MetaMask (Recommended)

1. **Install MetaMask**: If you don't have it, install the [MetaMask browser extension](https://metamask.io/download/)

2. **Add Base Sepolia Network**:
   - Open MetaMask
   - Click the network dropdown (top left)
   - Click "Add Network" → "Add a network manually"
   - Enter these details:
     - **Network Name**: Base Sepolia
     - **RPC URL**: `https://sepolia.base.org`
     - **Chain ID**: `84532`
     - **Currency Symbol**: ETH
     - **Block Explorer**: `https://sepolia.basescan.org`
   - Click "Save"

3. **Get Test ETH**:
   - Visit [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
   - Connect your wallet and claim free testnet ETH

4. **Connect Your Wallet**:
   - Click "Send $" on any user marker on the map
   - Click "Connect Wallet"
   - Select "MetaMask" from the options
   - Approve the connection in MetaMask

### Features
- 🗺️ Interactive map showing based users
- 💸 Send ETH payments (0.01, 0.05, 0.1 ETH or custom amount)
- 📊 View transaction history in your profile
- 🔒 Secure wallet connection with Base Sepolia testnet
- 🏷️ **Basename support**: Displays your Basename if you have one on Base Mainnet

### About Basenames
- **Basenames** are human-readable names on Base (like `yourname.base.eth`)
- They only exist on **Base Mainnet**, not on testnets
- While you test transactions on Base Sepolia, the app will check Base Mainnet for your Basename
- If you don't have a Basename, your wallet address will be displayed
- To get a Basename, visit [base.org/names](https://www.base.org/names)

## Learn More

To learn more about OnchainKit, see our [documentation](https://docs.base.org/onchainkit).

To learn more about Next.js, see the [Next.js documentation](https://nextjs.org/docs).
