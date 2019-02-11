const fs = require('fs');
const path = require('path');
const chai = require('chai');
let chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const assert = chai.assert;
const AeSDK = require('@aeternity/aepp-sdk');
const Universal = AeSDK.Universal;
const config = require("./constants/config.json")
const utils = require('./../utils/utils');
const errorMessages = require('./constants/error-messages.json');

const CONTRACT_FILE_PATH =  "./../contracts/crypto-hamsters.aes";

const getDeployedContractInstance = utils.getDeployedContractInstance;
const executeSmartContractFunction = utils.executeSmartContractFunction;

const contentOfContract = utils.readFileRelative(path.resolve(__dirname, CONTRACT_FILE_PATH), config.filesEncoding);

const randomNames = [
    'aleks',
    'gosho',
    'john',
    'peter'
]

const cryptoHamsterFunctions = require('./constants/smartContractFunctions.json');

describe('Crypto Hamsters', async () => {

    let cryptoHamsterInstance;

    beforeEach(async () => {
        let deployInfo = await getDeployedContractInstance(Universal, config, contentOfContract);
        cryptoHamsterInstance = deployInfo.deployedContract;
    });
    
    it('Should create hamster successfully', async () => {
        await executeSmartContractFunction(cryptoHamsterInstance, cryptoHamsterFunctions.CREATE_HAMSTER, `("${randomNames[0]}")`);

        let result = await executeSmartContractFunction(cryptoHamsterInstance, cryptoHamsterFunctions.NAME_EXISTS, `("${randomNames[0]}")`);
        let resultValue = (await result.decode('bool')).value;
        assert.ok(resultValue === 1, 'Hamster does not exist!');
    });

    it('Should create few hamsters successfully', async () => {
        for (let i = 0; i < randomNames.length; i++) {
            await executeSmartContractFunction(cryptoHamsterInstance, cryptoHamsterFunctions.CREATE_HAMSTER, `("${randomNames[i]}")`);

            let result = await executeSmartContractFunction(cryptoHamsterInstance, cryptoHamsterFunctions.NAME_EXISTS, `("${randomNames[i]}")`);
            let resultValue = (await result.decode('bool')).value;
            assert.ok(resultValue === 1, 'Hamster does not exist!');
        }
    });

    it('[NEGATIVE] Should NOT create hamster with same name', async () => {
        await executeSmartContractFunction(cryptoHamsterInstance, cryptoHamsterFunctions.CREATE_HAMSTER, `("${randomNames[0]}")`);
        await assert.isRejected(executeSmartContractFunction(cryptoHamsterInstance, cryptoHamsterFunctions.CREATE_HAMSTER, `("${randomNames[0]}")`), errorMessages.NAME_ALREADY_TAKEN);
    });

    it('Hamster (name) should NOT exist', async () => {

        for (let i = 0; i < randomNames.length; i++) {
            let result = await executeSmartContractFunction(cryptoHamsterInstance, cryptoHamsterFunctions.NAME_EXISTS, `("${randomNames[i]}")`);
            let resultValue = (await result.decode('bool')).value;
            assert.ok(resultValue === 0, 'Hamster does not exist!');
        }
    });

    it('[NEGATIVE] Should throw exception when there are not any hamsters', async () => {

        for (let i = 0; i < randomNames.length; i++) {
            await assert.isRejected(executeSmartContractFunction(cryptoHamsterInstance, cryptoHamsterFunctions.GET_HAMSTER_DNA, `("${randomNames[i]}")`), errorMessages.NONEXISTEN_HAMSTER_NAME);
        }
    });

    it('Hamsters DNA should not match', async () => {

        let dnas = [];

        for (let i = 0; i < randomNames.length; i++) {
            await executeSmartContractFunction(cryptoHamsterInstance, cryptoHamsterFunctions.CREATE_HAMSTER, `("${randomNames[i]}")`);

            let result = await executeSmartContractFunction(cryptoHamsterInstance, cryptoHamsterFunctions.GET_HAMSTER_DNA, `("${randomNames[i]}")`);
            let resultValue = (await result.decode('int')).value;
            
            if (dnas.includes(resultValue)) {
                assert.ok(false, 'DNA already exist!')
            } else {
                dnas.push(resultValue);
            }
        }
    });
})