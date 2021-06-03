const chai = require('chai');
const assert = chai.assert;
const assertNode = require('assert/strict');

const { Universal, MemoryAccount, Node } = require('@aeternity/aepp-sdk');

const NETWORKS = require('../config/network.json');
const NETWORK_NAME = "local";

const {defaultWallets: WALLETS} = require('../config/wallets.json');

const contractUtils = require('../utils/contract-utils');

const hamsterNames = [
    'aleks',
    'gosho',
    'john',
    'peter'
];

describe('Crypto Hamster', async () => {

    let cryptoHamsterInstance;

    beforeEach(async () => {
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
            const contractContent = contractUtils.getContractContent('./contracts/CryptoHamster/CryptoHamster.aes');
            // initialize the contract instance
            cryptoHamsterInstance = await client.getContractInstance(contractContent);
            await cryptoHamsterInstance.deploy([]);
        } catch(err) {
            console.error(err);
            assert.fail('Could not initialize contract instance');
        }
    });

    it('Should create hamster successfully', async () => {
        await cryptoHamsterInstance.methods.create_hamster(hamsterNames[0]);
        const result = await cryptoHamsterInstance.methods.name_exists(hamsterNames[0]);
        assert.isTrue(result.decodedResult, 'Hamster does not exist!');
    });

    it('Should create few hamsters successfully', async () => {
        for (let i = 0; i < hamsterNames.length; i++) {
            await cryptoHamsterInstance.methods.create_hamster(hamsterNames[i]);
            const result = await cryptoHamsterInstance.methods.name_exists(hamsterNames[i]);
            assert.isTrue(result.decodedResult, 'Hamster does not exist!');
        }
    });

    it('[NEGATIVE] Should NOT create hamster with same name', async () => {
        await cryptoHamsterInstance.methods.create_hamster(hamsterNames[0]);
        await assertNode.rejects(
            cryptoHamsterInstance.methods.create_hamster(hamsterNames[0]), (err) => {
                assert.include(err.message, "Name is already taken");
                return true;
            });
    });

    it('Hamster (name) should NOT exist', async () => {
        for (let i = 0; i < hamsterNames.length; i++) {
            const result = await cryptoHamsterInstance.methods.name_exists(hamsterNames[i]);
            assert.isFalse(result.decodedResult, 'Hamster does not exist!');
        }
    });

    it('[NEGATIVE] Should throw exception when there are not any hamsters', async () => {
        for (let i = 0; i < hamsterNames.length; i++) {
            await assertNode.rejects(cryptoHamsterInstance.methods.get_hamster_dna(hamsterNames[i]), (err) => {
                assert.include(err.message, "There is no hamster with that name!");
                return true;
            });
        }
    });

    it('Hamsters DNA should not match', async () => {
        const dnas = [];
        for (let i = 0; i < hamsterNames.length; i++) {
            await cryptoHamsterInstance.methods.create_hamster(hamsterNames[i]);
            const result = await cryptoHamsterInstance.methods.get_hamster_dna(hamsterNames[i]);
            if (dnas.includes(result.decodedResult)) {
                assert.fail('DNA already exist!');
            } else {
                dnas.push(result.decodedResult);
            }
        }
    });
});