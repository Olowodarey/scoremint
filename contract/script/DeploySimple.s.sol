// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/Scoremint.sol";

contract DeploySimple is Script {
    function run() external {
        // Load private key
        string memory pkString = vm.envString("PRIVATE_KEY");
        uint256 deployerPrivateKey;

        if (bytes(pkString).length == 64) {
            pkString = string.concat("0x", pkString);
        }
        deployerPrivateKey = vm.parseUint(pkString);

        address deployer = vm.addr(deployerPrivateKey);

        console.log("==============================================");
        console.log("Deploying Scoremint (Direct) to Base Mainnet");
        console.log("==============================================");
        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance / 1e18, "ETH");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy Scoremint directly (no proxy)
        Scoremint scoremint = new Scoremint();
        console.log("\nScoremint deployed at:", address(scoremint));

        // Initialize it
        scoremint.initialize(deployer);
        console.log("Initialized with owner:", deployer);

        // Set oracle if provided
        address oracleAddress = vm.envOr("ORACLE_ADDRESS", address(0));
        if (oracleAddress != address(0)) {
            scoremint.setOracle(oracleAddress);
            console.log("Oracle set to:", oracleAddress);
        }

        vm.stopBroadcast();

        console.log("\n==============================================");
        console.log("DEPLOYMENT SUCCESSFUL!");
        console.log("==============================================");
        console.log("Contract Address:", address(scoremint));
        console.log("Owner:", deployer);
        if (oracleAddress != address(0)) {
            console.log("Oracle:", oracleAddress);
        }
        console.log("==============================================");
    }
}
