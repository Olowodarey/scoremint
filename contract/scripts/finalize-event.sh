#!/bin/bash

# Event Finalization Script using Cast
# This script settles matches and finalizes the event

CONTRACT="0x70dB6488fA0a6869a8b599bD2be044A0BA1f5d50"
ORACLE_KEY="9238a857a5b64b9b2b95e8c3cdd70dd242c8bab59666552389b888ef5034e57d"
RPC="https://mainnet.base.org"
EVENT_ID=0

echo "🏆 Event Finalization Script"
echo "============================="
echo ""
echo "Contract: $CONTRACT"
echo "Event ID: $EVENT_ID"
echo ""

# Step 1: Check current event status
echo "📋 Step 1: Checking event status..."
EVENT_DATA=$(cast call $CONTRACT "getEvent(uint256)" $EVENT_ID --rpc-url $RPC)
echo "Event data retrieved"
echo ""

# Step 2: Check if results already exist
echo "🔍 Step 2: Checking for existing results..."
RESULTS=$(cast call $CONTRACT "getEventResults(uint256)" $EVENT_ID --rpc-url $RPC)
echo "Results: $RESULTS"
echo ""

# Step 3: Settle matches with results
echo "🔧 Step 3: Settling matches..."
echo "Match 1: São Paulo U20 3-1 Botafogo U20 (Fixture: 1509241)"
echo "Match 2: Estudiantes L.P. 4-0 Ituzaingó (Fixture: 1502448)"
echo ""

# Try to settle
echo "Sending settlement transaction..."
cast send $CONTRACT \
  "settleEventWithResults(uint256,(uint256,uint8,uint8,uint64)[])" \
  $EVENT_ID \
  "[(1509241,3,1,1769432000),(1502448,4,0,1769432000)]" \
  --private-key $ORACLE_KEY \
  --rpc-url $RPC \
  --gas-limit 500000

if [ $? -eq 0 ]; then
  echo "✅ Matches settled successfully!"
  echo ""
  
  # Step 4: Finalize event
  echo "🎯 Step 4: Finalizing event..."
  cast send $CONTRACT \
    "finalizeEvent(uint256)" \
    $EVENT_ID \
    --private-key $ORACLE_KEY \
    --rpc-url $RPC \
    --gas-limit 1000000
  
  if [ $? -eq 0 ]; then
    echo "✅ Event finalized successfully!"
    echo ""
    echo "🎉 Done! Users can now see their results."
  else
    echo "❌ Failed to finalize event"
  fi
else
  echo "❌ Failed to settle matches"
  echo ""
  echo "Trying to get more details..."
  cast call $CONTRACT \
    "settleEventWithResults(uint256,(uint256,uint8,uint8,uint64)[])" \
    $EVENT_ID \
    "[(1509241,3,1,1769432000),(1502448,4,0,1769432000)]" \
    --from 0x778DB78469FE2341917317c8aD32552E9C085409 \
    --rpc-url $RPC
fi
