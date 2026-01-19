// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Script.sol";
import "../src/Scoremint.sol";

contract SetOracle is Script {
    function run() external {
        // Load environment variables
        string memory pkString = vm.envString("PRIVATE_KEY");
        uint256 deployerPrivateKey;

        if (bytes(pkString).length == 64) {
            pkString = string.concat("0x", pkString);
        }
        deployerPrivateKey = vm.parseUint(pkString);

        address contractAddress = vm.envAddress("CONTRACT_ADDRESS");
        address oracleAddress = vm.envAddress("ORACLE_ADDRESS");

        console.log("==============================================");
        console.log("Setting Oracle for Scoremint Contract");
        console.log("==============================================");
        console.log("Contract:", contractAddress);
        console.log("Oracle:", oracleAddress);

        vm.startBroadcast(deployerPrivateKey);

        Scoremint scoremint = Scoremint(contractAddress);

        // Set the oracle
        scoremint.setOracle(oracleAddress);

        console.log("\nOracle set successfully!");

        vm.stopBroadcast();

        console.log("==============================================");
    }
}
