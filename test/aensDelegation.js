const { utils, wallets } = require('@aeternity/aeproject');
const { Crypto, AmountFormatter, TxBuilderHelper, SCHEMA } = require('@aeternity/aepp-sdk');

const { assert } = require('chai');

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

describe('AensDelegation', () => {
    let aeSdk;
    let contract;
    let salt;
    let aensDelegationSignature;
    
    const mainKeypair = wallets[0]
    const delegateKeypair = wallets[1];
    const nameOwnerKeypair = Crypto.generateKeyPair();
    const newOwnerKeypair = Crypto.generateKeyPair();
    const testName = 'verylongtestnametoensureweonlypay3ae' + getRandomInt(1,5000) + '.chain';
    console.log(testName);

    before(async () => {
        aeSdk = await utils.getSdk();
        try {
            // path relative to root of project
            const contractContent = utils.getContractContent('./contracts/DelegationSignature/AensDelegation.aes');
            // initialize the contract instance with sourcecode
            contract = await aeSdk.getContractInstance({ source: contractContent });
        } catch(err) {
            console.error(err);
            assert.fail('Could not initialize contract instance');
        }
        // fund account of nameOwner with 4 AE (some funds are required to cover the name fee)
        await aeSdk.spend(4, nameOwnerKeypair.publicKey, {
            onAccount: mainKeypair,
            denomination: AmountFormatter.AE_AMOUNT_FORMATS.AE
        });

        // fund newOwner with 1 AE as there is currently an issue (shouldn't be required for delegated actions)
        // see https://github.com/aeternity/aeternity/issues/3674
        await aeSdk.spend(1, newOwnerKeypair.publicKey, {
            onAccount: mainKeypair,
            denomination: AmountFormatter.AE_AMOUNT_FORMATS.AE
        });
    });

    describe('Deploy contract', () => {
        it('should deploy AensDelegation contract', async () => {
            await contract.deploy();
        });
    });

    describe('Interact with the contract', async () => {
        it('should pre-claim a name', async () => {
            salt = Crypto.salt();
            const commitmentHashEncoded = TxBuilderHelper.commitmentHash(testName, salt);
            const commitmentHashDecoded = TxBuilderHelper.decode(commitmentHashEncoded, 'cm');
            const preClaimSignature = await aeSdk.createAensDelegationSignature({ contractId: contract.deployInfo.address }, { onAccount: nameOwnerKeypair });
            await contract.methods.pre_claim(nameOwnerKeypair.publicKey, commitmentHashDecoded, preClaimSignature, { onAccount: delegateKeypair });
        });
        it('should claim a name', async () => {
            aensDelegationSignature = await aeSdk.createAensDelegationSignature({ contractId: contract.deployInfo.address, name: testName}, { onAccount: nameOwnerKeypair });
            const minimumNameFee = TxBuilderHelper.getMinimumNameFee(testName);
            await contract.methods.claim(nameOwnerKeypair.publicKey, testName, salt, minimumNameFee, aensDelegationSignature, { onAccount: delegateKeypair });
        });
        it('should extend a name', async () => {
            let nameResult = await aeSdk.aensQuery(testName);
            const oldTtlHeight = nameResult.ttl;
            const currentHeight = await aeSdk.height();
            const newTtlHeight = currentHeight + 500;
            const fixedTtl = { 'FixedTTL': [newTtlHeight] };
            await contract.methods.extend(nameOwnerKeypair.publicKey, testName, aensDelegationSignature, fixedTtl, { onAccount: delegateKeypair });
            nameResult = await aeSdk.aensQuery(testName);
            assert.notDeepEqual(nameResult.ttl, oldTtlHeight);
            assert.equal(nameResult.ttl, newTtlHeight)
        });
        it('should add and get pointers correctly', async () => {
            // a little bit inconvenient right now, we're discussing how to deal with that in the following issue
            // => https://github.com/aeternity/aepp-sdk-js/issues/1332
            const accountPointerKey = SCHEMA.POINTER_KEY_BY_PREFIX['ak'];
            const oraclePointerKey = SCHEMA.POINTER_KEY_BY_PREFIX['ok'];
            const contractPointerKey = SCHEMA.POINTER_KEY_BY_PREFIX['ct'];
            const channelPointerKey = SCHEMA.POINTER_KEY_BY_PREFIX['ch'];
            const expectedPointerResult = new Map();
            let getPointersResult = await contract.methods.get_pointers(testName);
            assert.deepEqual(getPointersResult.decodedResult, expectedPointerResult);
            const accountPt = { 'AENS.AccountPt': [nameOwnerKeypair.publicKey] };
            const contractPt = { 'AENS.ContractPt': [nameOwnerKeypair.publicKey] }; // faked contract (can be set!)
            const oraclePt = { 'AENS.OraclePt': [nameOwnerKeypair.publicKey] }; // faked oracle (can be set!)
            const channelPt = { 'AENS.ChannelPt': [nameOwnerKeypair.publicKey] }; // faked channel (can be set!)
            await contract.methods.add_key(nameOwnerKeypair.publicKey, testName, accountPointerKey, accountPt, aensDelegationSignature, { onAccount: delegateKeypair });
            await contract.methods.add_key(nameOwnerKeypair.publicKey, testName, contractPointerKey, contractPt, aensDelegationSignature, { onAccount: delegateKeypair });
            await contract.methods.add_key(nameOwnerKeypair.publicKey, testName, oraclePointerKey, oraclePt, aensDelegationSignature, { onAccount: delegateKeypair });
            await contract.methods.add_key(nameOwnerKeypair.publicKey, testName, channelPointerKey, channelPt, aensDelegationSignature, { onAccount: delegateKeypair });
            expectedPointerResult.set('account_pubkey', accountPt);
            expectedPointerResult.set('contract_pubkey', contractPt)
            expectedPointerResult.set('oracle_pubkey', oraclePt);
            expectedPointerResult.set('channel', channelPt);
            getPointersResult = await contract.methods.get_pointers(testName);
            assert.deepEqual(getPointersResult.decodedResult, expectedPointerResult);
        });
        it('should transfer a name', async () => {
            let getOwnerDryRun = await contract.methods.get_owner(testName);
            assert.equal(getOwnerDryRun.decodedResult, nameOwnerKeypair.publicKey);
            await contract.methods.transfer(nameOwnerKeypair.publicKey, newOwnerKeypair.publicKey, testName, aensDelegationSignature, { onAccount: delegateKeypair });
            getOwnerDryRun = await contract.methods.get_owner(testName);
            assert.equal(getOwnerDryRun.decodedResult, newOwnerKeypair.publicKey);
        });
        it('should revoke a name', async () => {
            // you need a signature from the new owner now ;)
            aensDelegationSignature = await aeSdk.createAensDelegationSignature({ contractId: contract.deployInfo.address, name: testName }, { onAccount: newOwnerKeypair });
            await contract.methods.revoke(newOwnerKeypair.publicKey, testName, aensDelegationSignature, {onAccount: delegateKeypair});
            try {
                nameResult = await aeSdk.aensQuery(testName);
            } catch(e) {
                assert.equal(e.response.body.reason, 'Name revoked');
            }
        });
    });
});
