const chai = require('chai');
const assert = chai.assert;

const { Universal, MemoryAccount, Node, Crypto, AmountFormatter } = require('@aeternity/aepp-sdk');

const NETWORKS = require('../config/network.json');
const NETWORK_NAME = "local";

const {defaultWallets: WALLETS} = require('../config/wallets.json');

const contractUtils = require('../utils/contract-utils');

xdescribe('OracleDelegation', () => {
    let client;
    let oracleDelegationContractInstance;
    let initialTtl;
    
    const qFee = 5000; // aettos
    const delegateKeypair = WALLETS[0];
    const oracleKeypair = Crypto.generateKeyPair();
    const inquiryKeypair = WALLETS[1];
    const oracleId = `ok_${oracleKeypair.publicKey.slice(3)}`;

    before(async () => {
        const node = await Node({ url: NETWORKS[NETWORK_NAME].nodeUrl, ignoreVersion: true });
        client = await Universal({
            nodes: [
            { name: NETWORK_NAME, instance: node },
            ],
            compilerUrl: NETWORKS[NETWORK_NAME].compilerUrl,
            accounts: [MemoryAccount({ keypair: delegateKeypair }), MemoryAccount({ keypair: oracleKeypair })],
        });
        try {
            // path relative to root of project
            const contractContent = contractUtils.getContractContent('./contracts/DelegationSignature/OracleDelegation.aes');
            // initialize the contract instance
            oracleDelegationContractInstance = await client.getContractInstance(contractContent);
        } catch(err) {
            console.error(err);
            assert.fail('Could not initialize contract instance');
        }
        // fund account of oracle with 1 AE
        await client.spend(1, oracleKeypair.publicKey, {
            denomination: AmountFormatter.AE_AMOUNT_FORMATS.AE
        });
    });

    describe('Deploy contract', () => {
        it('should deploy OracleDelegation contract', async () => {
            await oracleDelegationContractInstance.deploy();
        });
    });

    describe('Interact with the contract', async () => {
        it('should register an oracle', async () => {
            const oracleRegisterSig = await client.delegateOracleRegisterSignature(oracleDelegationContractInstance.deployInfo.address, {onAccount: oracleKeypair});
            await oracleDelegationContractInstance.methods.register_oracle(oracleKeypair.publicKey, oracleRegisterSig, qFee, 'RelativeTTL(800)', {onAccount: delegateKeypair});
            const oracle = await client.getOracleObject(oracleId);
            assert.equal(oracle.id, oracleId);
            initialTtl = oracle.ttl;
        });
        it('should extend an oracle', async () => {
            // same signature like for register, see https://github.com/aeternity/aepp-sdk-js/issues/1242
            const oracleExtendSig = await client.delegateOracleExtendSignature(oracleDelegationContractInstance.deployInfo.address, {onAccount: oracleKeypair});
            await oracleDelegationContractInstance.methods.extend_oracle(oracleId, oracleExtendSig, 'RelativeTTL(800)', {onAccount: delegateKeypair});
            const oracle = await client.getOracleObject(oracleId);
            assert.equal(oracle.ttl, initialTtl + 800);
        });
        xit('should respond to a specific query', async () => {
            const createQueryResult = await oracleDelegationContractInstance.methods.create_query(oracleId, "how is the wheather over there?", 'RelativeTTL(100)', 'RelativeTTL(100)', {onAccount: inquiryKeypair, amount: qFee})
            const queryId = createQueryResult.decodedResult;
            // currently creating an invalid signature, see https://github.com/aeternity/aepp-sdk-js/issues/1242
            const oracleRespondSig = await client.delegateOracleRespondSignature(oracleId, queryId, oracleDelegationContractInstance.deployInfo.address, { onAccount });
            await oracleDelegationContractInstance.methods.respond(oracleId, queryId, oracleRespondSig, 'sunny =)', {onAccount: delegateKeypair});
            // TODO receive query object from node and compare response
        });
    });
});
