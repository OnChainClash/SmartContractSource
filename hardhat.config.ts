import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

import "hardhat-gas-reporter"

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
    },
    a8testnet: {
      url: 'https://rpc-testnet.ancient8.gg',
      accounts: ['0x1627d06255de999462dbc7582ea8cc6dffd58f9b09a00a59dfa474d25d3be709'],
      gasPrice: 1000000000,
    },
    a8celestia: {
      url: 'https://rpcv2-testnet.ancient8.gg',
      accounts: ['0x1627d06255de999462dbc7582ea8cc6dffd58f9b09a00a59dfa474d25d3be709'],
      gasPrice: 1000000000,
    }
  },
  defaultNetwork: 'a8celestia',
};

export default config;
