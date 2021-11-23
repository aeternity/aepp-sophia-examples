const { assert } = require('chai');
const { utils, wallets, networks } = require('@aeternity/aeproject');

const { Universal, MemoryAccount, Node, Crypto, AmountFormatter, TxBuilderHelper, SCHEMA } = require('@aeternity/aepp-sdk');

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

describe('AensDelegation', () => {
    let client;
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
        // individually initialize Universal stamp
        // instead of using utils.getClient()
        client = await Universal.compose({
            deepProps: { Ae: { defaults: { interval: 50 } } },
        })({
            nodes: [{ name: 'node', instance: await Node({ url: networks.devmode.nodeUrl, ignoreVersion: true }) }],
            compilerUrl: networks.devmode.compilerUrl,
            accounts: [MemoryAccount({ keypair: delegateKeypair }), MemoryAccount({ keypair: nameOwnerKeypair })],
        });
        try {
            // path relative to root of project
            const contractContent = utils.getContractContent('./contracts/DelegationSignature/AensDelegation.aes');
            // initialize the contract instance with sourcecode
            contract = await client.getContractInstance({ source: contractContent });
        } catch(err) {
            console.error(err);
            assert.fail('Could not initialize contract instance');
        }
        // fund account of nameOwner with 4 AE (some funds are required to cover the name fee)
        await client.spend(4, nameOwnerKeypair.publicKey, {
            onAccount: mainKeypair,
            denomination: AmountFormatter.AE_AMOUNT_FORMATS.AE
        });

        // fund newOwner with 1 AE as there is currently an issue (shouldn't be required for delegated actions)
        // see https://github.com/aeternity/aeternity/issues/3674
        await client.spend(1, newOwnerKeypair.publicKey, {
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
            const preClaimSignature = await client.createAensDelegationSignature({ contractId: contract.deployInfo.address }, { onAccount: nameOwnerKeypair });
            await contract.methods.pre_claim(nameOwnerKeypair.publicKey, commitmentHashDecoded, preClaimSignature, { onAccount: delegateKeypair });
        });
        it('should claim a name', async () => {
            aensDelegationSignature = await client.createAensDelegationSignature({ contractId: contract.deployInfo.address, name: testName}, { onAccount: nameOwnerKeypair });
            // https://github.com/aeternity/aepp-sdk-js/issues/1251 (BigNumber as param?)
            // https://github.com/aeternity/aepp-sdk-js/issues/1252 (wrong minimum name fee for names with length >= 31)
            const minimumNameFee = TxBuilderHelper.getMinimumNameFee(testName);
            await contract.methods.claim(nameOwnerKeypair.publicKey, testName, salt, 3000000000000000000, aensDelegationSignature, { onAccount: delegateKeypair });
        });
        it('should extend a name', async () => {
            let nameResult = await client.aensQuery(testName);
            const oldTtlHeight = nameResult.ttl;
            const currentHeight = await client.height();
            const newTtlHeight = currentHeight + 500;
            const fixedTtl = {'FixedTTL':[newTtlHeight]};
            // we can use the same signature as obtained via `delegateNameClaimSignature` (only pre-claim signature is different)
            // see https://github.com/aeternity/aepp-sdk-js/issues/1237
            await contract.methods.extend(nameOwnerKeypair.publicKey, testName, aensDelegationSignature, fixedTtl, { onAccount: delegateKeypair });
            nameResult = await client.aensQuery(testName);
            assert.notDeepEqual(nameResult.ttl, oldTtlHeight);
            assert.equal(nameResult.ttl, newTtlHeight)
        });
        // excluded due to unsupported AENS types
        // see https://github.com/aeternity/aepp-sdk-js/issues/1253
        it('should add and get pointers correctly', async () => {
            const accountPointerKey = SCHEMA.NAME_ID_KEY['ak'];
            const oraclePointerKey = SCHEMA.NAME_ID_KEY['ok'];
            const contractPointerKey = SCHEMA.NAME_ID_KEY['ct'];
            const channelPointerKey = SCHEMA.NAME_ID_KEY['ch'];
            let getPointersResult = await contract.methods.get_pointers(testName);
            console.log(getPointersResult.decodedResult);
            await contract.methods.add_key(nameOwnerKeypair.publicKey, testName, accountPointerKey, {'AENS.AccountPt':[nameOwnerKeypair.publicKey]}, aensDelegationSignature, { onAccount: delegateKeypair });
            await contract.methods.add_key(nameOwnerKeypair.publicKey, testName, oraclePointerKey, {'AENS.OraclePt':[nameOwnerKeypair.publicKey]}, aensDelegationSignature, { onAccount: delegateKeypair });
            await contract.methods.add_key(nameOwnerKeypair.publicKey, testName, contractPointerKey, {'AENS.ContractPt':[nameOwnerKeypair.publicKey]}, aensDelegationSignature, { onAccount: delegateKeypair });
            await contract.methods.add_key(nameOwnerKeypair.publicKey, testName, channelPointerKey, {'AENS.ChannelPt':[nameOwnerKeypair.publicKey]}, aensDelegationSignature, { onAccount: delegateKeypair });
            let aensName = await contract.methods.get_name(testName);
            console.log(aensName.decodedResult);
            pointers = await contract.methods.get_pointers(testName);
            console.log(pointers.decodedResult);
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
            aensDelegationSignature = await client.createAensDelegationSignature({ contractId: contract.deployInfo.address, name: testName }, { onAccount: newOwnerKeypair });
            await contract.methods.revoke(newOwnerKeypair.publicKey, testName, aensDelegationSignature, {onAccount: delegateKeypair});
            try {
                nameResult = await client.aensQuery(testName);
            } catch(e) {
                assert.equal(e.response.body.reason, 'Name revoked');
            }
        });
    });
});
