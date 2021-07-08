const chai = require('chai');
const assert = chai.assert;

const { Universal, MemoryAccount, Node, Crypto, AmountFormatter, TxBuilderHelper, SCHEMA } = require('@aeternity/aepp-sdk');

const NETWORKS = require('../config/network.json');
const NETWORK_NAME = "local";

const {defaultWallets: WALLETS} = require('../config/wallets.json');

const contractUtils = require('../utils/contract-utils');

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

describe('AensDelegation', () => {
    let client;
    let aensDelegationContractInstance;
    let salt;
    let aensDelegationSignature;
    
    const minerKeyPair = {
        publicKey: 'ak_2mwRmUeYmfuW93ti9HMSUJzCk1EYcQEfikVSzgo6k2VghsWhgU',
        secretKey: 'bb9f0b01c8c9553cfbaf7ef81a50f977b1326801ebf7294d1c2cbccdedf27476e9bbf604e611b5460a3b3999e9771b6f60417d73ce7c5519e12f7e127a1225ca'
    }
    const delegateKeypair = WALLETS[1];
    const nameOwnerKeypair = Crypto.generateKeyPair();
    const newOwnerKeypair = Crypto.generateKeyPair();
    const testName = 'verylongtestnametoensureweonlypay3ae' + getRandomInt(1,5000) + '.chain';
    console.log(testName);

    before(async () => {
        const node = await Node({ url: NETWORKS[NETWORK_NAME].nodeUrl });
        client = await Universal({
            nodes: [
            { name: NETWORK_NAME, instance: node },
            ],
            compilerUrl: NETWORKS[NETWORK_NAME].compilerUrl,
            accounts: [MemoryAccount({ keypair: delegateKeypair }), MemoryAccount({ keypair: nameOwnerKeypair })],
        });
        try {
            // path relative to root of project
            const contractContent = contractUtils.getContractContent('./contracts/DelegationSignature/AensDelegation.aes');
            // initialize the contract instance
            aensDelegationContractInstance = await client.getContractInstance(contractContent);
        } catch(err) {
            console.error(err);
            assert.fail('Could not initialize contract instance');
        }
        // fund account of nameOwner with 4 AE (some funds are required to cover the name fee)
        await client.spend(4, nameOwnerKeypair.publicKey, {
            onAccount: minerKeyPair,
            denomination: AmountFormatter.AE_AMOUNT_FORMATS.AE
        });

        // fund newOwner with 1 AE as there is currently an issue (shouldn't be required for delegated actions)
        // see https://github.com/aeternity/aeternity/issues/3674
        await client.spend(1, newOwnerKeypair.publicKey, {
            onAccount: minerKeyPair,
            denomination: AmountFormatter.AE_AMOUNT_FORMATS.AE
        });
    });

    describe('Deploy contract', () => {
        it('should deploy AensDelegation contract', async () => {
            await aensDelegationContractInstance.deploy();
        });
    });

    describe('Interact with the contract', async () => {
        it('should pre-claim a name', async () => {
            salt = Crypto.salt();
            const commitmentHashEncoded = TxBuilderHelper.commitmentHash(testName, salt);
            const commitmentHashDecoded = TxBuilderHelper.decode(commitmentHashEncoded, 'cm');
            const preClaimSignature = await client.delegateNamePreclaimSignature(aensDelegationContractInstance.deployInfo.address, {onAccount: nameOwnerKeypair});
            await aensDelegationContractInstance.methods.pre_claim(nameOwnerKeypair.publicKey, commitmentHashDecoded, preClaimSignature, {onAccount: delegateKeypair});
        });
        it('should claim a name', async () => {
            aensDelegationSignature = await client.delegateNameClaimSignature(aensDelegationContractInstance.deployInfo.address, testName, {onAccount: nameOwnerKeypair});
            // https://github.com/aeternity/aepp-sdk-js/issues/1251 (BigNumber as param?)
            // https://github.com/aeternity/aepp-sdk-js/issues/1252 (wrong minimum name fee for names with length >= 31)
            const minimumNameFee = TxBuilderHelper.getMinimumNameFee(testName);
            await aensDelegationContractInstance.methods.claim(nameOwnerKeypair.publicKey, testName, salt, 3000000000000000000, aensDelegationSignature, {onAccount: delegateKeypair});
        });
        it('should extend a name', async () => {
            let nameResult = await client.aensQuery(testName);
            const oldTtlHeight = nameResult.ttl;
            const currentHeight = await client.height();
            const newTtlHeight = currentHeight + 500;
            const fixedTtl = `FixedTTL(${newTtlHeight})`;
            // we can use the same signature as obtained via `delegateNameClaimSignature` (only pre-claim signature is different)
            // see https://github.com/aeternity/aepp-sdk-js/issues/1237
            await aensDelegationContractInstance.methods.extend(nameOwnerKeypair.publicKey, testName, aensDelegationSignature, fixedTtl, {onAccount: delegateKeypair});
            nameResult = await client.aensQuery(testName);
            assert.notDeepEqual(nameResult.ttl, oldTtlHeight);
            assert.equal(nameResult.ttl, newTtlHeight)
        });
        // excluded due to unsupported AENS types
        // see https://github.com/aeternity/aepp-sdk-js/issues/1253
        xit('should add and get pointers correctly', async () => {
            const accountPointerKey = SCHEMA.NAME_ID_KEY['ak'];
            const oraclePointerKey = SCHEMA.NAME_ID_KEY['ok'];
            const contractPointerKey = SCHEMA.NAME_ID_KEY['ct'];
            const channelPointerKey = SCHEMA.NAME_ID_KEY['ch'];
            let aensName = await aensDelegationContractInstance.methods.get_name(testName);
            console.log(aensName);
            let getPointersResult = await aensDelegationContractInstance.methods.get_pointers(testName);
            console.log(getPointersResult.decodedResult);
            await aensDelegationContractInstance.methods.add_key(nameOwnerKeypair.publicKey, testName, accountPointerKey, nameOwnerKeypair.publicKey, aensDelegationSignature, {onAccount: delegateKeypair});
            aensName = await aensDelegationContractInstance.methods.get_name(testName);
            console.log(aensName);
            pointers = await aensDelegationContractInstance.methods.get_pointers(testName);
            console.log(pointers);
        });
        it('should transfer a name', async () => {
            let getOwnerDryRun = await aensDelegationContractInstance.methods.get_owner(testName);
            assert.equal(getOwnerDryRun.decodedResult, nameOwnerKeypair.publicKey);
            await aensDelegationContractInstance.methods.transfer(nameOwnerKeypair.publicKey, newOwnerKeypair.publicKey, testName, aensDelegationSignature, {onAccount: delegateKeypair});
            getOwnerDryRun = await aensDelegationContractInstance.methods.get_owner(testName);
            assert.equal(getOwnerDryRun.decodedResult, newOwnerKeypair.publicKey);
        });
        it('should revoke a name', async () => {
            // you need a signature from the new owner now ;)
            aensDelegationSignature = await client.delegateNameClaimSignature(aensDelegationContractInstance.deployInfo.address, testName, {onAccount: newOwnerKeypair});
            await aensDelegationContractInstance.methods.revoke(newOwnerKeypair.publicKey, testName, aensDelegationSignature, {onAccount: delegateKeypair});
            try {
                nameResult = await client.aensQuery(testName);
            } catch(e) {
                assert.equal(e.response.body.reason, 'Name revoked');
            }
        });
    });
});
