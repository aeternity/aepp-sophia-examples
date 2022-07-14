const { utils } = require('@aeternity/aeproject');
const { AE_AMOUNT_FORMATS, MemoryAccount, generateKeyPair } = require('@aeternity/aepp-sdk');

const chai = require('chai');
const assert = chai.assert;

describe('OracleDelegation', async () => {
    let aeSdk;
    let oracleDelegationContractInstance;
    let initialTtl;

    const accounts = utils.getDefaultAccounts();

    const qFee = 5000; // aettos
    const delegateAccount = accounts[0];
    const oracleAccount = new MemoryAccount({ keypair: generateKeyPair() });
    const oracleAddress = await oracleAccount.address();
    const inquiryAccount = accounts[1];
    const oracleId = `ok_${oracleAddress.slice(3)}`;

    before(async () => {
        aeSdk = await utils.getSdk();
        try {
            // path relative to root of project
            const contractContent = utils.getContractContent('./contracts/DelegationSignature/OracleDelegation.aes');
            // initialize the contract instance
            oracleDelegationContractInstance = await aeSdk.getContractInstance({ source: contractContent });
        } catch(err) {
            console.error(err);
            assert.fail('Could not initialize contract instance');
        }
        // fund account of oracle with 1 AE
        await aeSdk.spend(1, oracleAddress, {
            denomination: AE_AMOUNT_FORMATS.AE
        });
    });

    describe('Deploy contract', () => {
        it('should deploy OracleDelegation contract', async () => {
            await oracleDelegationContractInstance.deploy();
        });
    });

    describe('Interact with the contract', () => {
        let oracleDelegationSig;
        before(async () => {
            oracleDelegationSig = await aeSdk.createOracleDelegationSignature(oracleDelegationContractInstance.deployInfo.address, { onAccount: oracleAccount });
        });
        it('should register an oracle', async () => {
            await oracleDelegationContractInstance.methods.register_oracle(oracleAddress, oracleDelegationSig, qFee, { RelativeTTL: [800] }, { onAccount: delegateAccount });
            const oracle = await aeSdk.getOracleObject(oracleId);
            assert.equal(oracle.id, oracleId);
            initialTtl = oracle.ttl;
        });
        it('should extend an oracle', async () => {
            await oracleDelegationContractInstance.methods.extend_oracle(oracleId, oracleDelegationSig, { RelativeTTL: [800] }, {onAccount: delegateAccount});
            const oracle = await aeSdk.getOracleObject(oracleId);
            assert.equal(oracle.ttl, initialTtl + 800);
        });
        it('should respond to a specific query', async () => {
            const createQueryResult = await oracleDelegationContractInstance.methods.create_query(
                oracleId,
                "how is the wheather over there?",
                { RelativeTTL: [200] },
                { RelativeTTL: [200] },
                { onAccount: inquiryAccount, amount: qFee });
            const queryId = createQueryResult.decodedResult;
            const oracleRespondSig = await aeSdk.createOracleDelegationSignature(oracleDelegationContractInstance.deployInfo.address, {queryId, onAccount: oracleAccount},
            );
            await oracleDelegationContractInstance.methods.respond(oracleId, queryId, oracleRespondSig, 'sunny =)', { onAccount: delegateAccount });
            // TODO receive query object from node and compare response
        });
    });
});
