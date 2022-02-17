const { utils, wallets } = require('@aeternity/aeproject');
const { Crypto, AmountFormatter } = require('@aeternity/aepp-sdk');

const chai = require('chai');
const assert = chai.assert;

describe('OracleDelegation', () => {
    let aeSdk;
    let oracleDelegationContractInstance;
    let initialTtl;
    
    const qFee = 5000; // aettos
    const delegateKeypair = wallets[0];
    const oracleKeypair = Crypto.generateKeyPair();
    const inquiryKeypair = wallets[1];
    const oracleId = `ok_${oracleKeypair.publicKey.slice(3)}`;

    before(async () => {
        aeSdk = await utils.getClient();
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
        await aeSdk.spend(1, oracleKeypair.publicKey, {
            denomination: AmountFormatter.AE_AMOUNT_FORMATS.AE
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
            oracleDelegationSig = await aeSdk.createOracleDelegationSignature({ contractId: oracleDelegationContractInstance.deployInfo.address }, { onAccount: oracleKeypair });
        });
        it('should register an oracle', async () => {
            await oracleDelegationContractInstance.methods.register_oracle(oracleKeypair.publicKey, oracleDelegationSig, qFee, { RelativeTTL: [800] }, { onAccount: delegateKeypair });
            const oracle = await aeSdk.getOracleObject(oracleId);
            assert.equal(oracle.id, oracleId);
            initialTtl = oracle.ttl;
        });
        it('should extend an oracle', async () => {
            await oracleDelegationContractInstance.methods.extend_oracle(oracleId, oracleDelegationSig, { RelativeTTL: [800] }, {onAccount: delegateKeypair});
            const oracle = await aeSdk.getOracleObject(oracleId);
            assert.equal(oracle.ttl, initialTtl + 800);
        });
        xit('should respond to a specific query', async () => {
            const createQueryResult = await oracleDelegationContractInstance.methods.create_query(
                oracleId,
                "how is the wheather over there?",
                { RelativeTTL: [200] },
                { RelativeTTL: [200] },
                { onAccount: inquiryKeypair, amount: qFee });
            const queryId = createQueryResult.decodedResult;
            const oracleRespondSig = await aeSdk.createOracleDelegationSignature({ contractId: oracleDelegationContractInstance.deployInfo.address, queryId }, { onAccount: oracleKeypair });
            // TODO why does this fail?
            await oracleDelegationContractInstance.methods.respond(oracleId, queryId, oracleRespondSig, 'sunny =)', { onAccount: delegateKeypair });
            // TODO receive query object from node and compare response
        });
    });
});
