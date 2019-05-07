const chai = require('chai');
let chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const assert = chai.assert;

const AeSDK = require('@aeternity/aepp-sdk');
const Universal = AeSDK.Universal;

const config = require('./constants/config.json');
const sourceFile = './contracts/Ownable.aes';
const errorMessages = require('./constants/error-messages.json');

const utils = require('./../utils/utils');
const notOwnerPublicKeyAsHex = utils.publicKeyToHex(config.notOwnerKeyPair.publicKey);
const getClient = utils.getClient;

const ownableFunctions = require('./constants/smartContractFunctions.json')

describe('Ownable', () => {

    let firstClient;
    let secondClient;
    let ownableSource;

    before(async () => {

        firstClient = await getClient(Universal, config, config.ownerKeyPair);
        secondClient = await getClient(Universal, config, config.notOwnerKeyPair);

        await firstClient.spend(1, config.notOwnerKeyPair.publicKey);

        ownableSource = utils.readFileRelative(sourceFile, config.filesEncoding);
    });

    describe('Deploy contract', () => {

        it('deploying successfully', async () => {
            let contractObject = await firstClient.getContractInstance(ownableSource);
            let deployInfo = (await contractObject.deploy([])).deployInfo;

            assert.equal(config.ownerKeyPair.publicKey, deployInfo.owner);
        })
    })

    describe('Smart contract tests', () => {

        let contractObject;

        beforeEach(async () => {

            contractObject = await firstClient.getContractInstance(ownableSource);
            await contractObject.deploy([]);
        })

        it('should set the proper owner to the smart contract', async () => {

            const callOwnerResult = await contractObject.call(ownableFunctions.OWNER);
            let ownerPublicKey = await callOwnerResult.decode();

            assert.equal(ownerPublicKey, config.ownerKeyPair.publicKey);
        })

        it('should execute if owner calls onlyOwner', async () => {
            await assert.isFulfilled(contractObject.call(ownableFunctions.ONLY_OWNER));
        })

        it('should return true if the caller is the owner, check function', async () => {

            const callIsOwnerResult = await contractObject.call(ownableFunctions.IS_OWNER);
            const decodedData = await callIsOwnerResult.decode();

            assert.equal(decodedData, true, 'The owner is different from the caller')
        })

        it('should change the owner to #0 address', async () => {

            await contractObject.call(ownableFunctions.RENOUNCE_OWNERSHIP);
            const getOwnerResult = await contractObject.call(ownableFunctions.OWNER);

            let defaultAddress = await getOwnerResult.decode();

            assert.equal(defaultAddress, 0, 'The owner is different from the caller');
        })

        it('should transfer ownership of the contract', async () => {

            const callTransferOwnershipPromise = contractObject.call(ownableFunctions.TRANSFER_OWNERSHIP, [`${ config.notOwnerKeyPair.publicKey }`]);
            await assert.isFulfilled(callTransferOwnershipPromise, 'Calling transfer ownership function failed');

            const callOwnerResult = await contractObject.call(ownableFunctions.OWNER);
            let ownerPublicKey = await callOwnerResult.decode();

            assert.equal(ownerPublicKey, config.notOwnerKeyPair.publicKey)
        })

        it('should throw if not owner call function onlyOwner', async () => {
            const unauthorizedOnlyOwnerPromise = secondClient.contractCall(ownableSource, contractObject.deployInfo.address, ownableFunctions.ONLY_OWNER);
            await assert.isRejected(unauthorizedOnlyOwnerPromise, errorMessages.NOT_AN_OWNER);
        })

        it('should throw if not owner tries to renounce ownership', async () => {
            const unauthorizedRenounceOwnershipPromise = secondClient.contractCall(ownableSource, contractObject.deployInfo.address, ownableFunctions.RENOUNCE_OWNERSHIP);

            await assert.isRejected(unauthorizedRenounceOwnershipPromise, errorMessages.NOT_AN_OWNER)

            const callOwnerResult = await contractObject.call(ownableFunctions.OWNER);
            let ownerPublicKey = await callOwnerResult.decode();

            assert.equal(ownerPublicKey, config.ownerKeyPair.publicKey)
        })

        it('should throw if not an owner tries to change the ownership of the contract', async () => {
            const unauthorizedTransferOwnershipPromise = secondClient.contractCall(ownableSource, contractObject.deployInfo.address, ownableFunctions.TRANSFER_OWNERSHIP, [`${ notOwnerPublicKeyAsHex }`]);

            await assert.isRejected(unauthorizedTransferOwnershipPromise, errorMessages.NOT_AN_OWNER);
            const callOwnerResult = await contractObject.call(ownableFunctions.OWNER);
            let ownerPublicKey = await callOwnerResult.decode();

            assert.equal(ownerPublicKey, config.ownerKeyPair.publicKey);
        })
    })
})