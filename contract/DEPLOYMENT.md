# Deployment Instructions

## Current Status

❌ **Contract NOT deployed** - Simulation successful but no actual deployment due to insufficient funds

## Deployment Details

- **Deployer Address:** `0x778DB78469FE2341917317c8aD32552E9C085409`
- **Current Balance:** 0 ETH on Base mainnet
- **Required Balance:** At least 0.001 ETH (~$3-4)
- **Target Network:** Base Mainnet (Chain ID: 8453)

## Steps to Deploy

### 1. Fund Your Deployer Wallet

Add ETH to `0x778DB78469FE2341917317c8aD32552E9C085409` on Base mainnet:

**Option A: Bridge from Ethereum**

- Go to https://bridge.base.org
- Connect your wallet
- Bridge at least 0.001 ETH to Base

**Option B: Buy on Base**

- Use Coinbase or another exchange
- Withdraw directly to Base network

### 2. Verify Balance

```bash
cast balance 0x778DB78469FE2341917317c8aD32552E9C085409 --rpc-url base
```

### 3. Deploy Contract

Once you have ETH, run:

```bash
forge script script/Deploy.s.sol:DeployScript --rpc-url base --broadcast --verify
```

### 4. After Successful Deployment

The script will:

- ✅ Deploy Scoremint contract
- ✅ Set you as owner
- ✅ Set oracle address (same as deployer)
- ✅ Verify contract on Basescan
- ✅ Output contract address

### 5. Update Frontend

Add the deployed contract address to `frontend/.env.local`:

```env
NEXT_PUBLIC_SCOREMINT_ADDRESS=<deployed_contract_address>
```

## Contract Configuration

- **Owner:** Your deployer address
- **Oracle:** Your deployer address (you can change this later)
- **Network:** Base Mainnet
- **Verification:** Automatic on Basescan

## Estimated Costs

- **Deployment:** ~0.0005 ETH
- **Total Recommended:** 0.001 ETH (includes buffer)

## Need Help?

If you encounter issues:

1. Check your ETH balance on Base
2. Ensure BASE_RPC_URL is set correctly in `.env`
3. Verify BASESCAN_API_KEY is set for contract verification
