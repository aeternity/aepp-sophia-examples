const { utils } = require('@aeternity/aeproject');
const { AE_AMOUNT_FORMATS, MemoryAccount, POINTER_KEY_BY_PREFIX, commitmentHash, decode, generateKeyPair, getMinimumNameFee, salt } = require('@aeternity/aepp-sdk');

const { assert } = require('chai');

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

const accounts = utils.getDefaultAccounts();

describe('AensDelegation', async () => {
    let aeSdk;
    let contract;
    let randomSalt;
    let aensDelegationSignature;
    
    const mainAccount = accounts[0]
    const delegateAccount = accounts[1];
    const nameOwnerAccount = new MemoryAccount({ keypair: generateKeyPair() });
    const nameOwnerAddress = await nameOwnerAccount.address();
    const newOwnerAccount = new MemoryAccount({ keypair: generateKeyPair() });
    const newOwnerAddress = await newOwnerAccount.address();
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
        await aeSdk.spend(4, nameOwnerAddress, {
            onAccount: mainAccount,
            denomination: AE_AMOUNT_FORMATS.AE
        });

        // fund newOwner with 1 AE as there is currently an issue (shouldn't be required for delegated actions)
        // see https://github.com/aeternity/aeternity/issues/3674
        await aeSdk.spend(1, nameOwnerAddress, {
            onAccount: mainAccount,
            denomination: AE_AMOUNT_FORMATS.AE
        });
    });

    describe('Deploy contract', () => {
        it('should deploy AensDelegation contract', async () => {
            await contract.deploy();
        });
    });

    describe('Interact with the contract', async () => {
        it('should pre-claim a name', async () => {
            randomSalt = salt();
            const commitmentHashEncoded = commitmentHash(testName, randomSalt);
            const commitmentHashDecoded = decode(commitmentHashEncoded, 'cm');
            const preClaimSignature = await aeSdk.createAensDelegationSignature(contract.deployInfo.address, { onAccount: nameOwnerAccount });
            await contract.methods.pre_claim(nameOwnerAddress, commitmentHashDecoded, preClaimSignature, { onAccount: delegateAccount });
        });
        it('should claim a name', async () => {
            aensDelegationSignature = await aeSdk.createAensDelegationSignature(contract.deployInfo.address, { name: testName, onAccount: nameOwnerAccount });
            const minimumNameFee = getMinimumNameFee(testName);
            await contract.methods.claim(nameOwnerAddress, testName, randomSalt, minimumNameFee, aensDelegationSignature, { onAccount: delegateAccount });
        });
        it('should extend a name', async () => {
            let nameResult = await aeSdk.aensQuery(testName);
            const oldTtlHeight = nameResult.ttl;
            const currentHeight = await aeSdk.height();
            const newTtlHeight = currentHeight + 500;
            const fixedTtl = { 'FixedTTL': [newTtlHeight] };
            await contract.methods.extend(nameOwnerAddress, testName, aensDelegationSignature, fixedTtl, { onAccount: delegateAccount });
            nameResult = await aeSdk.aensQuery(testName);
            assert.notDeepEqual(nameResult.ttl, oldTtlHeight);
            assert.equal(nameResult.ttl, newTtlHeight)
        });
        it('should add and get pointers correctly', async () => {
            // a little bit inconvenient right now, we're discussing how to deal with that in the following issue
            // => https://github.com/aeternity/aepp-sdk-js/issues/1332
            const accountPointerKey = POINTER_KEY_BY_PREFIX['ak'];
            const oraclePointerKey = POINTER_KEY_BY_PREFIX['ok'];
            const contractPointerKey = POINTER_KEY_BY_PREFIX['ct'];
            const channelPointerKey = POINTER_KEY_BY_PREFIX['ch'];
            const expectedPointerResult = new Map();
            let getPointersResult = await contract.methods.get_pointers(testName);
            assert.deepEqual(getPointersResult.decodedResult, expectedPointerResult);
            const accountPt = { 'AENS.AccountPt': [nameOwnerAddress] };
            const contractPt = { 'AENS.ContractPt': [nameOwnerAddress] }; // faked contract (can be set!)
            const oraclePt = { 'AENS.OraclePt': [nameOwnerAddress] }; // faked oracle (can be set!)
            const channelPt = { 'AENS.ChannelPt': [nameOwnerAddress] }; // faked channel (can be set!)
            await contract.methods.add_key(nameOwnerAddress, testName, accountPointerKey, accountPt, aensDelegationSignature, { onAccount: delegateAccount });
            await contract.methods.add_key(nameOwnerAddress, testName, contractPointerKey, contractPt, aensDelegationSignature, { onAccount: delegateAccount });
            await contract.methods.add_key(nameOwnerAddress, testName, oraclePointerKey, oraclePt, aensDelegationSignature, { onAccount: delegateAccount });
            await contract.methods.add_key(nameOwnerAddress, testName, channelPointerKey, channelPt, aensDelegationSignature, { onAccount: delegateAccount });
            expectedPointerResult.set('account_pubkey', accountPt);
            expectedPointerResult.set('contract_pubkey', contractPt)
            expectedPointerResult.set('oracle_pubkey', oraclePt);
            expectedPointerResult.set('channel', channelPt);
            getPointersResult = await contract.methods.get_pointers(testName);
            assert.deepEqual(getPointersResult.decodedResult, expectedPointerResult);
        });
        it('should transfer a name', async () => {
            let getOwnerDryRun = await contract.methods.get_owner(testName);
            assert.equal(getOwnerDryRun.decodedResult, nameOwnerAddress);
            await contract.methods.transfer(nameOwnerAddress, newOwnerAddress, testName, aensDelegationSignature, { onAccount: delegateAccount });
            getOwnerDryRun = await contract.methods.get_owner(testName);
            assert.equal(getOwnerDryRun.decodedResult, newOwnerAddress);
        });
        it('should revoke a name', async () => {
            // you need a signature from the new owner now ;)
            aensDelegationSignature = await aeSdk.createAensDelegationSignature(contract.deployInfo.address, { name: testName, onAccount: newOwnerAccount });
            await contract.methods.revoke(newOwnerAddress, testName, aensDelegationSignature, {onAccount: delegateAccount});
            try {
                nameResult = await aeSdk.aensQuery(testName);
            } catch(e) {
                assert.equal(e.response.body.reason, 'Name revoked');
            }
        });
    });
});
