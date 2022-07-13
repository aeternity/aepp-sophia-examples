const { utils } = require('@aeternity/aeproject');

const chai = require('chai');
const assert = chai.assert;

describe('SmartDataProvider', () => {
    const SMART_DATA_PROVIDER_BACKEND_SOURCE = './contracts/SmartDataProvider/SmartDataProviderBackend.aes';
    const SMART_DATA_PROVIDER_CLIENT_SOURCE = './contracts/SmartDataProvider/SmartDataProviderClient.aes';

    let aeSdk;
    let backendContractInstance, clientContractInstance;

    before(async () => {
      aeSdk = await utils.getSdk();
    });

    describe('Deploy contracts', () => {
      it('should deploy smart-data-provider backend contract', async () => {
          // get content of contract
          const contractContent = utils.getContractContent(SMART_DATA_PROVIDER_BACKEND_SOURCE);
          // initialize the contract instance
          backendContractInstance = await aeSdk.getContractInstance({ source: contractContent });
          await backendContractInstance.deploy([]);
      });

      it('should deploy smart-data-provider client contract', async () => {
          // a fileSystem object must be passed to the compiler if the contract uses custom includes
          const fileSystem = utils.getFilesystem(SMART_DATA_PROVIDER_CLIENT_SOURCE);
          // get content of contract
          const contractContent = utils.getContractContent(SMART_DATA_PROVIDER_CLIENT_SOURCE);
          // initialize the contract instance
          clientContractInstance = await aeSdk.getContractInstance({ source: contractContent, fileSystem});
          await clientContractInstance.deploy([]);
      });
    });

    // TODO "Invocation failed?!" => Devmode bug?!
    describe('Interact with contracts', () => {
      it('should get USD exchange rate', async () => {
        const result = await clientContractInstance.methods.get_exchange_rate(
            backendContractInstance.deployInfo.address, "USD", { amount: 100, gas: 36000 },
        );
        assert.equal(result.decodedResult, '1')
      });

      it('should get EUR exchange rate', async () => {
        const result = await clientContractInstance.methods.get_exchange_rate(
            backendContractInstance.deployInfo.address, "EUR", { amount: 100, gas: 36000 },
        );
        assert.equal(result.decodedResult, '2')
      });
    });
});
