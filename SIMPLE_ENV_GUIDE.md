# 🔑 Environment Variables - Simple Guide

## YOU NEED 2 .env FILES

### 1. `contract/.env` (For Deploying Contract)

Create this file now:

```bash
cd contract
nano .env
```

Paste this and fill in YOUR values:

```bash
PRIVATE_KEY=0x_your_deployer_wallet_private_key
BASE_RPC_URL=https://mainnet.base.org
BASESCAN_API_KEY=your_basescan_api_key
ORACLE_ADDRESS=0x_your_oracle_wallet_address
```

### 2. `frontend/.env.local` (For Oracle After Deployment)

Create this AFTER deploying contract:

```bash
cd frontend
nano .env.local
```

Paste this:

```bash
API_FOOTBALL_KEY=your_existing_key
ORACLE_PRIVATE_KEY=0x_your_oracle_wallet_private_key
CONTRACT_ADDRESS=0x_deployed_contract_address
BASE_RPC_URL=https://mainnet.base.org
```

---

## 🎯 What You Need Right Now

To deploy the contract, you need:

1. **Deployer wallet private key**

   - Export from MetaMask OR create new: `cast wallet new`
   - Fund with ~0.01 ETH on Base

2. **Basescan API key**

   - Get from: https://basescan.org/myapikey
   - Free to create

3. **Oracle wallet address** (optional for now, add later)
   - Create new wallet: `cast wallet new`
   - Save the ADDRESS for contract/.env
   - Save the PRIVATE KEY for frontend/.env.local
   - Fund with ~0.05 ETH on Base

---

## ✅ Step-by-Step

```bash
# 1. Create deployer wallet
cast wallet new
# Save: Address and Private Key

# 2. Create oracle wallet
cast wallet new
# Save: Address and Private Key

# 3. Go to contract folder
cd contract

# 4. Create .env file
cp .env.example .env

# 5. Edit .env with your values
nano .env

# 6. Ready to deploy!
forge script script/Deploy.s.sol --rpc-url base --broadcast --verify
```

---

## 📋 Full Example

**contract/.env:**

```
PRIVATE_KEY=0x1234...abcd
BASE_RPC_URL=https://mainnet.base.org
BASESCAN_API_KEY=ABC123
ORACLE_ADDRESS=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0
```

That's it! Create this file and you're ready to deploy! 🚀
