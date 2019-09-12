const path = require('path');
const chai = require('chai');
let chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const assert = chai.assert;

const AeSDK = require('@aeternity/aepp-sdk');
const Crypto = require('@aeternity/aepp-sdk').Crypto;
const Universal = AeSDK.Universal;
const config = require("./constants/config.json")
const utils = require('./utils/utils');
const getClient = utils.getClient;

const SMART_DATA_PROVIDER_BACKEND_CONTRACT_FILE_PATH = "./../contracts/smart-data-provider-backend.aes";
const SMART_DATA_PROVIDER_CLIENT_CONTRACT_FILE_PATH = "./../contracts/smart-data-provider-client.aes";

const smartDataProviderBackendContractSource = utils.readFileRelative(`./contracts/${SMART_DATA_PROVIDER_BACKEND_CONTRACT_FILE_PATH}`, 'utf-8')
const smartDataProviderClientContractSource = utils.readFileRelative(`./contracts/${SMART_DATA_PROVIDER_CLIENT_CONTRACT_FILE_PATH}`, 'utf-8')

describe('Smart Provider Contract', () => {

  let client, smartDataProviderBackendContractInstance, smartDataProviderClientContractInstance;
  let addressBackend;
  let addressClient;

  beforeEach(async () => {
      client = await getClient(Universal, config, config.ownerKeyPair);
  });

  describe('Deploy contracts', () => {

    it('should deploy smart-data-provider backend contract', async () => {
      smartDataProviderBackendContractInstance = await client.getContractInstance(smartDataProviderBackendContractSource);
      const init = await smartDataProviderBackendContractInstance.deploy([]);
      addressBackend = init.result.contractId;
      assert.equal(init.result.returnType, 'ok');
    })

    it('should deploy smart-data-provider client contract', async () => {
      smartDataProviderClientContractInstance = await client.getContractInstance(smartDataProviderClientContractSource);
      const init = await smartDataProviderClientContractInstance.deploy([]);
      addressClient = init.result.contractId;
      assert.equal(init.result.returnType, 'ok');
    })
    
  })

  describe('Interact with contracts', () => {
   
    it('should get USD exchange rate', async () => {
      const result = await smartDataProviderClientContractInstance.methods.get_exchange_rate(addressBackend, "USD", {amount: 100})
      assert.equal(result.decodedResult, '1')
    })

    it('should get EUR exchange rate', async () => {
      const result = await smartDataProviderClientContractInstance.methods.get_exchange_rate(addressBackend, "EUR", {amount: 100})
      assert.equal(result.decodedResult, '2')
    })
  })
})
