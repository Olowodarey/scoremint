// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/Scoremint.sol";

contract DeployScript is Script {
    function run() external {
        // Load private key as string (works with or without 0x prefix)
        string memory pkString = vm.envString("PRIVATE_KEY");
        uint256 deployerPrivateKey;

        // Add 0x prefix if not present
        if (bytes(pkString).length == 64) {
            pkString = string.concat("0x", pkString);
        }
        deployerPrivateKey = vm.parseUint(pkString);

        address deployer = vm.addr(deployerPrivateKey);

        console.log("==============================================");
        console.log("Deploying Scoremint to Base Mainnet");
        console.log("==============================================");
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance / 1e18, "ETH");

        require(
            deployer.balance >= 0.0005 ether,
            "Insufficient ETH for deployment"
        );

        vm.startBroadcast(deployerPrivateKey);

        // Deploy Scoremint contract directly (no proxy)
        console.log("\nDeploying Scoremint contract...");
        Scoremint scoremint = new Scoremint(deployer);
        console.log("Scoremint deployed at:", address(scoremint));

        // Verify initialization
        console.log("\nVerifying deployment...");
        address owner = scoremint.owner();
        console.log("Contract owner:", owner);
        require(owner == deployer, "Owner mismatch");

        // Set oracle if provided
        address oracleAddress = vm.envOr("ORACLE_ADDRESS", address(0));
        if (oracleAddress != address(0)) {
            console.log("\nSetting oracle address...");
            scoremint.setOracle(oracleAddress);
            console.log("Oracle set to:", oracleAddress);
        } else {
            console.log(
                "\nOracle address not provided - set it later with setOracle()"
            );
        }

        vm.stopBroadcast();

        // Summary
        console.log("\n==============================================");
        console.log("DEPLOYMENT SUCCESSFUL!");
        console.log("==============================================");
        console.log("Contract Address:", address(scoremint));
        console.log("Owner:", owner);
        if (oracleAddress != address(0)) {
            console.log("Oracle:", oracleAddress);
        }
        console.log("\nNEXT STEPS:");
        console.log("1. Verify contract on Basescan");
        console.log("2. Add contract address to frontend/.env.local");
        console.log("3. Test oracle integration");
        console.log("==============================================");

        // Save deployment info
        string memory deploymentInfo = string.concat(
            "{\n",
            '  "network": "base-mainnet",\n',
            '  "chainId": 8453,\n',
            '  "contract": "',
            vm.toString(address(scoremint)),
            '",\n',
            '  "owner": "',
            vm.toString(owner),
            '",\n',
            '  "oracle": "',
            vm.toString(oracleAddress),
            '",\n',
            '  "deployer": "',
            vm.toString(deployer),
            '"\n',
            "}"
        );

        vm.writeFile("deployments/base-mainnet.json", deploymentInfo);
        console.log(
            "\nDeployment info saved to: deployments/base-mainnet.json"
        );
    }
}
