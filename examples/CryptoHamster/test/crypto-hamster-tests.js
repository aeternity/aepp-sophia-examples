const path = require('path');
const chai = require('chai');
let chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const assert = chai.assert;

const AeSDK = require('@aeternity/aepp-sdk');
const Universal = AeSDK.Universal;
const config = require("./constants/config.json")
const errorMessages = require('./constants/error-messages.json');
const utils = require('./../utils/utils');
const cryptoHamsterFunctions = require('./constants/smartContractFunctions.json');

const CONTRACT_FILE_PATH = "./../contracts/crypto-hamsters.aes";
const getClient = utils.getClient;

const contentOfContract = utils.readFileRelative(path.resolve(__dirname, CONTRACT_FILE_PATH), config.filesEncoding);

const randomNames = [
    'aleks',
    'gosho',
    'john',
    'peter'
];

describe('Crypto Hamsters', async () => {

    let cryptoHamsterInstance;

    beforeEach(async () => {
        let client = await getClient(Universal, config, config.ownerKeyPair);

        cryptoHamsterInstance = await client.getContractInstance(contentOfContract);
        await cryptoHamsterInstance.deploy([]);
    });

    it('Should create hamster successfully', async () => {
        await cryptoHamsterInstance.call(cryptoHamsterFunctions.CREATE_HAMSTER, [
            randomNames[0]
        ]);

        let result = await cryptoHamsterInstance.call(cryptoHamsterFunctions.NAME_EXISTS, [
            randomNames[0]
        ]);

        let resultValue = await result.decode();
        assert.ok(resultValue === true, 'Hamster does not exist!');
    });

    it('Should create few hamsters successfully', async () => {
        for (let i = 0; i < randomNames.length; i++) {
            await cryptoHamsterInstance.call(cryptoHamsterFunctions.CREATE_HAMSTER, [
                randomNames[i]
            ]);

            let result = await cryptoHamsterInstance.call(cryptoHamsterFunctions.NAME_EXISTS, [
                randomNames[i]
            ]);

            let resultValue = await result.decode();
            assert.ok(resultValue === true, 'Hamster does not exist!');
        }
    });

    it('[NEGATIVE] Should NOT create hamster with same name', async () => {
        await cryptoHamsterInstance.call(cryptoHamsterFunctions.CREATE_HAMSTER, [
            randomNames[0]
        ]);

        await assert.isRejected(cryptoHamsterInstance.call(cryptoHamsterFunctions.CREATE_HAMSTER, [
            randomNames[0]
        ]), errorMessages.NAME_ALREADY_TAKEN);
    });

    it('Hamster (name) should NOT exist', async () => {

        for (let i = 0; i < randomNames.length; i++) {
            let result = await cryptoHamsterInstance.call(cryptoHamsterFunctions.NAME_EXISTS, [
                randomNames[i]
            ]);

            let resultValue = await result.decode();
            assert.ok(resultValue === false, 'Hamster does not exist!');
        }
    });

    it('[NEGATIVE] Should throw exception when there are not any hamsters', async () => {

        for (let i = 0; i < randomNames.length; i++) {
            await assert.isRejected(cryptoHamsterInstance.call(cryptoHamsterFunctions.GET_HAMSTER_DNA, [
                randomNames[i]
            ]), errorMessages.NONEXISTEN_HAMSTER_NAME);
        }
    });

    it('Hamsters DNA should not match', async () => {

        let dnas = [];

        for (let i = 0; i < randomNames.length; i++) {
            await cryptoHamsterInstance.call(cryptoHamsterFunctions.CREATE_HAMSTER, [
                randomNames[i]
            ]);

            let result = await cryptoHamsterInstance.call(cryptoHamsterFunctions.GET_HAMSTER_DNA, [
                randomNames[i]
            ]);
            let resultValue = await result.decode();

            if (dnas.includes(resultValue)) {
                assert.ok(false, 'DNA already exist!')
            } else {
                dnas.push(resultValue);
            }
        }
    });
})