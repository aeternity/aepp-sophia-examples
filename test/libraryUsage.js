const chai = require('chai');
const assert = chai.assert;

const { Universal, MemoryAccount, Node } = require('@aeternity/aepp-sdk');

const NETWORKS = require('../config/network.json');
const NETWORK_NAME = "local";

const {defaultWallets: WALLETS} = require('../config/wallets.json');

const contractUtils = require('../utils/contract-utils');

describe('LibraryUsage', () => {
  let libraryUsageInstance;

  before(async () => {
    const node = await Node({ url: NETWORKS[NETWORK_NAME].nodeUrl });
    const client = await Universal({
      nodes: [
        { name: NETWORK_NAME, instance: node },
      ],
      compilerUrl: NETWORKS[NETWORK_NAME].compilerUrl,
      accounts: [MemoryAccount({ keypair: WALLETS[0] })],
      address: WALLETS[0].publicKey
    });
    try {
      // path relative to root of project
      const LIBRARY_USAGE_SOURCE = './contracts/Libraries/LibraryUsage.aes';
      // get filesystem for includes
      const filesystem = contractUtils.getFilesystem(LIBRARY_USAGE_SOURCE)
      const contractContent = contractUtils.getContractContent(LIBRARY_USAGE_SOURCE);
      // initialize the contract instance
      libraryUsageInstance = await client.getContractInstance(contractContent, {filesystem});
    } catch(err) {
      console.error(err);
      assert.fail('Could not initialize contract instance');
    }
  });

  describe('Deploy contract', () => {
    it('should deploy LibraryUsage contract', async () => {
      const init = await libraryUsageInstance.deploy([]);
      assert.equal(init.result.returnType, 'ok');
    });
  });

  describe('Interact with the contract', () => {
    it('should convert decimal to binary', async () => {
      const result = await libraryUsageInstance.methods.dec_to_binary(72);
      assert.equal(result.decodedResult, "1001000");
    });

    it('should convert decimal to octal', async () => {
      const result = await libraryUsageInstance.methods.dec_to_oct(98);
      assert.equal(result.decodedResult, "142");
    });

    it('should convert decimal to hexadecimal', async () => {
      const result = await libraryUsageInstance.methods.dec_to_hex(45);
      assert.equal(result.decodedResult, "2D");
    });

    it('should convert binary to decimal', async () => {
      const result = await libraryUsageInstance.methods.binary_to_dec(1001000);
      assert.equal(result.decodedResult, "72");
    });

    it('should convert oct to decimal', async () => {
      const result = await libraryUsageInstance.methods.oct_to_dec(142);
      assert.equal(result.decodedResult, "98");
    });
  });
});
