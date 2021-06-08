const chai = require('chai');
const assert = chai.assert;
const assertNode = require('assert/strict');

const { Universal, MemoryAccount, Node } = require('@aeternity/aepp-sdk');

const NETWORKS = require('../config/network.json');
const NETWORK_NAME = "local";

const {defaultWallets: WALLETS} = require('../config/wallets.json');

const contractUtils = require('../utils/contract-utils');

describe('TicTacToe', () => {
  
  let ticTacToeContractInstance;

  before(async () => {
    const node = await Node({ url: NETWORKS[NETWORK_NAME].nodeUrl });
    client = await Universal({
        nodes: [
          { name: NETWORK_NAME, instance: node },
        ],
        compilerUrl: NETWORKS[NETWORK_NAME].compilerUrl,
        accounts: [MemoryAccount({ keypair: WALLETS[0] })],
        address: WALLETS[0].publicKey
    });
    try {
        // path relative to root of project
        const contractContent = contractUtils.getContractContent('./contracts/TicTacToe/TicTacToe.aes');
        // initialize the contract instance
        ticTacToeContractInstance = await client.getContractInstance(contractContent);
    } catch(err) {
        console.error(err);
        assert.fail('Could not initialize contract instance');
    }
  });

  describe('Deploy contract', () => {
    it('should deploy TicTacToe contract', async () => {
      const init = await ticTacToeContractInstance.deploy([]);
      assert.equal(init.result.returnType, 'ok');
    });
  });

  describe('Interact with the contract', () => {
    it('should reject with invalid position', async () => {
      await assertNode.rejects(ticTacToeContractInstance.methods.make_move(41,1), (err) => {
        assert.include(err.message, "Incorrect position!");
        return true;
      });
    });

    it('should reject with invalid player', async () => {
      await assertNode.rejects(ticTacToeContractInstance.methods.make_move(11,3), (err) => {
        assert.include(err.message, "Invalid player!");
        return true;
      });
    });

    it('should make move as player 1', async () => {
      const result = await ticTacToeContractInstance.methods.make_move(11,1);
      assert.equal(result.decodedResult, "Game continues. The other player's turn.");
    });

    it('should reject not your turn', async () => {
      await assertNode.rejects(ticTacToeContractInstance.methods.make_move(12,1), (err) => {
        assert.include(err.message, "It's not your turn! Player 2 has to play now!");
        return true;
      });
    });

    it('should reject place already taken', async () => {
      await assertNode.rejects(ticTacToeContractInstance.methods.make_move(11,2), (err) => {
        assert.include(err.message, "Place is already taken!");
        return true;
      });
    });

    it('should make move as player 2', async () => {
      const result = await ticTacToeContractInstance.methods.make_move(12,2);
      assert.equal(result.decodedResult, "Game continues. The other player's turn.");
    });

    it('should make move as player 1', async () => {
      const result = await ticTacToeContractInstance.methods.make_move(33,1);
      assert.equal(result.decodedResult, "Game continues. The other player's turn.");
    });

    it('should make move as player 2', async () => {
      const result = await ticTacToeContractInstance.methods.make_move(23,2);
      assert.equal(result.decodedResult, "Game continues. The other player's turn.");
    });

    it('should make move as player 1', async () => {
      const result = await ticTacToeContractInstance.methods.make_move(31,1);
      assert.equal(result.decodedResult, "Game continues. The other player's turn.");
    });

    it('should make move as player 2', async () => {
      const result = await ticTacToeContractInstance.methods.make_move(21,2);
      assert.equal(result.decodedResult, "Game continues. The other player's turn.");
    });

    it('should win as player 1', async () => {
      const result = await ticTacToeContractInstance.methods.make_move(32,1);
      assert.equal(result.decodedResult, "You are the winner! Congratulations player 1");
    });
  });
});
