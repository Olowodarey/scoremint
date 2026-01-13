# Deployment Error Fix

## Issue

The deployment script failed because the PRIVATE_KEY in your `.env` file is missing the `0x` prefix.

## Fix

Open `contract/.env` and make sure your PRIVATE_KEY starts with `0x`:

```bash
# ❌ Wrong:
PRIVATE_KEY=abc123def456...

# ✅ Correct:
PRIVATE_KEY=0xabc123def456...
```

## After fixing

Once you've added the `0x` prefix, run:

```bash
cd contract
source .env && forge script script/Deploy.s.sol --rpc-url $BASE_RPC_URL --via-ir
```

If the dry-run succeeds, deploy with:

```bash
forge script script/Deploy.s.sol --rpc-url base --broadcast --verify --via-ir
```
