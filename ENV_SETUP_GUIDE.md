# Environment Setup Guide

You need TWO different .env files - one for contract deployment, one for the frontend oracle.

## 📋 Summary

| File                  | Purpose               | When to Use             |
| --------------------- | --------------------- | ----------------------- |
| `contract/.env`       | Deploy smart contract | First (deploy contract) |
| `frontend/.env.local` | Oracle integration    | After deployment        |

---

## 1️⃣ Contract Deployment (.env in contract folder)

**File:** `contract/.env`

```bash
# Copy the example file
cd contract
cp .env.example .env
```

**Fill in these values:**

```bash
# Your deployer wallet private key (needs ~0.01 ETH on Base)
PRIVATE_KEY=0x...

# Base mainnet RPC
BASE_RPC_URL=https://mainnet.base.org

# Basescan API key (get from https://basescan.org/myapikey)
BASESCAN_API_KEY=...

# Oracle wallet address (can add after frontend setup)
ORACLE_ADDRESS=0x...

# Your wallet address (for reference)
DEPLOYER_ADDRESS=0x...
```

### How to get these values:

#### PRIVATE_KEY (Deployer)

```bash
# Option 1: From MetaMask
# MetaMask → Account Details → Export Private Key

# Option 2: Create new wallet with cast
cast wallet new
# Save the private key and address
```

#### BASE_RPC_URL

```bash
# Option 1: Use public RPC (free)
https://mainnet.base.org

# Option 2: Use Alchemy (recommended for production)
# 1. Go to https://alchemy.com
# 2. Create account → Create new app
# 3. Select "Base" network
# 4. Copy the HTTPS URL
https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
```

#### BASESCAN_API_KEY

```bash
# 1. Go to https://basescan.org
# 2. Sign up / Login
# 3. Go to https://basescan.org/myapikey
# 4. Create new API key
# 5. Copy the key
```

#### ORACLE_ADDRESS

```bash
# This is the wallet that will settle matches
# Create it in step 2 (frontend setup)
# Or create now with: cast wallet new
```

---

## 2️⃣ Frontend Oracle (.env.local in frontend folder)

**File:** `frontend/.env.local`

```bash
# Copy the example file
cd frontend
cp .env.local.example .env.local
```

**Fill in these values:**

```bash
# API-Football key (you should already have this)
API_FOOTBALL_KEY=your_api_key

# Oracle wallet private key (different from deployer!)
ORACLE_PRIVATE_KEY=0x...

# Deployed contract address (fill after deployment)
CONTRACT_ADDRESS=0x...

# Base RPC (can use same as contract)
BASE_RPC_URL=https://mainnet.base.org
```

### How to get these values:

#### ORACLE_PRIVATE_KEY

```bash
# Create a NEW wallet specifically for oracle
cast wallet new

# Output:
# Address: 0x123... ← This is your ORACLE_ADDRESS
# Private key: 0xabc... ← This is your ORACLE_PRIVATE_KEY

# Fund this wallet with ~0.05 ETH on Base
```

#### CONTRACT_ADDRESS

```bash
# You'll get this AFTER deploying the contract
# Will be output from deployment script
```

---

## 🚀 Deployment Order

### Step 1: Setup Contract Environment

```bash
cd contract
cp .env.example .env
# Edit .env with your values
```

### Step 2: Create Oracle Wallet

```bash
cast wallet new
# Save the address → use as ORACLE_ADDRESS in contract/.env
# Save the private key → use as ORACLE_PRIVATE_KEY in frontend/.env.local
```

### Step 3: Fund Wallets

```bash
# Deployer wallet (for deployment): ~0.01 ETH
# Oracle wallet (for match settlement): ~0.05 ETH
```

### Step 4: Deploy Contract

```bash
cd contract
forge script script/Deploy.s.sol --rpc-url base --broadcast --verify
# Copy the deployed contract address
```

### Step 5: Setup Frontend Environment

```bash
cd frontend
cp .env.local.example .env.local
# Add ORACLE_PRIVATE_KEY and CONTRACT_ADDRESS
```

### Step 6: Set Oracle in Contract

```bash
# Using cast
cast send <CONTRACT_ADDRESS> \
  "setOracle(address)" \
  <ORACLE_ADDRESS> \
  --private-key $PRIVATE_KEY \
  --rpc-url $BASE_RPC_URL

# Or create a script to do this
```

---

## 📝 Quick Checklist

**Before Deployment:**

- [ ] Created deployer wallet with private key
- [ ] Created oracle wallet (separate!)
- [ ] Funded deployer wallet (~0.01 ETH on Base)
- [ ] Funded oracle wallet (~0.05 ETH on Base)
- [ ] Got Basescan API key
- [ ] Filled `contract/.env` with all values
- [ ] Filled `frontend/.env.local` (can add CONTRACT_ADDRESS after)

**After Deployment:**

- [ ] Contract deployed successfully
- [ ] Contract verified on Basescan
- [ ] Added CONTRACT_ADDRESS to `frontend/.env.local`
- [ ] Called `setOracle(address)` on contract
- [ ] Tested oracle endpoints

---

## 🔒 Security

**NEVER commit these files:**

```bash
# Add to .gitignore
echo "contract/.env" >> .gitignore
echo "frontend/.env.local" >> .gitignore
```

**Two separate wallets:**

- **Deployer:** Only for deploying, can be cold storage after
- **Oracle:** Active, needs funds, monitored regularly

---

## 💡 Example Values

**contract/.env:**

```bash
PRIVATE_KEY=0x1234567890abcdef... (64 chars)
BASE_RPC_URL=https://mainnet.base.org
BASESCAN_API_KEY=ABC123XYZ789
ORACLE_ADDRESS=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0
DEPLOYER_ADDRESS=0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199
```

**frontend/.env.local:**

```bash
API_FOOTBALL_KEY=your_existing_key
ORACLE_PRIVATE_KEY=0xabcdef1234567890... (64 chars)
CONTRACT_ADDRESS=0x... (will fill after deployment)
BASE_RPC_URL=https://mainnet.base.org
```

---

Ready to deploy! Start with setting up `contract/.env` first. 🚀
