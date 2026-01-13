# Fund Your Deployer Wallet

## Your Deployer Address

```
0x778DB78469FE2341917317c8aD32552E9C085409
```

## Current Balance

**0 ETH** (needs funding!)

## How Much ETH Needed

**Minimum: 0.01 ETH** (recommended for safe deployment)

## How to Fund

### Option 1: Bridge from Ethereum

1. Go to https://bridge.base.org
2. Connect wallet with ETH on Ethereum mainnet
3. Bridge 0.01 ETH to Base
4. Send to: `0x778DB78469FE2341917317c8aD32552E9C085409`

### Option 2: Buy on Exchange & Withdraw to Base

1. Buy ETH on Coinbase/Binance/etc
2. Withdraw to Base network
3. Use address: `0x778DB78469FE2341917317c8aD32552E9C085409`

### Option 3: Use a Faucet (Testnet Only)

For Base Goerli testnet (testing):

- https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

### Option 4: Transfer from Another Base Wallet

If you have ETH on Base in another wallet:

1. Send 0.01 ETH to: `0x778DB78469FE2341917317c8aD32552E9C085409`
2. Use Base network

## Verify Balance

```bash
cd contract
cast balance 0x778DB78469FE2341917317c8aD32552E9C085409 --rpc-url base
```

## After Funding

Once you've sent ETH, wait for confirmation (usually 1-2 minutes), then:

```bash
# Verify balance
cast balance 0x778DB78469FE2341917317c8aD32552E9C085409 --rpc-url base

# Deploy
forge script script/Deploy.s.sol --rpc-url base --broadcast --verify --via-ir
```

---

**Important:** Make sure you're sending ETH on the **Base network**, NOT Ethereum mainnet!
