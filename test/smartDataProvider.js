/*
 * ISC License (ISC)
 * Copyright (c) 2018 aeternity developers
 *
 *  Permission to use, copy, modify, and/or distribute this software for any
 *  purpose with or without fee is hereby granted, provided that the above
 *  copyright notice and this permission notice appear in all copies.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 *  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 *  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 *  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 *  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 *  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 *  PERFORMANCE OF THIS SOFTWARE.
 */
const chai = require('chai');
const assert = chai.assert;

const { Universal, MemoryAccount, Node } = require('@aeternity/aepp-sdk');

const NETWORKS = require('../config/network.json');
const NETWORK_NAME = "local";

const {defaultWallets: WALLETS} = require('../config/wallets.json');

const contractUtils = require('../utils/contract-utils');

describe('SmartDataProvider', () => {
    const SMART_DATA_PROVIDER_BACKEND_SOURCE = './contracts/SmartDataProvider/SmartDataProviderBackend.aes';
    const SMART_DATA_PROVIDER_CLIENT_SOURCE = './contracts/SmartDataProvider/SmartDataProviderClient.aes';

    let client;
    let backendContractInstance, clientContractInstance;

    before(async () => {
        const node = await Node({ url: NETWORKS[NETWORK_NAME].nodeUrl });
        client = await Universal({
            nodes: [
              { name: NETWORK_NAME, instance: node },
            ],
            compilerUrl: NETWORKS[NETWORK_NAME].compilerUrl,
            accounts: [MemoryAccount({ keypair: WALLETS[0] })],
            address: WALLETS[0].publicKey
        });
    });

    describe('Deploy contracts', () => {

        it('should deploy smart-data-provider backend contract', async () => {
            // get content of contract
            const contractContent = contractUtils.getContractContent(SMART_DATA_PROVIDER_BACKEND_SOURCE);
            // initialize the contract instance
            backendContractInstance = await client.getContractInstance(contractContent);
            await backendContractInstance.deploy([]);
        });
    
        it('should deploy smart-data-provider client contract', async () => {
            // a filesystem object must be passed to the compiler if the contract uses custom includes
            const filesystem = contractUtils.getFilesystem(SMART_DATA_PROVIDER_CLIENT_SOURCE);
            // get content of contract
            const contractContent = contractUtils.getContractContent(SMART_DATA_PROVIDER_CLIENT_SOURCE);
            // initialize the contract instance
            clientContractInstance = await client.getContractInstance(contractContent, {filesystem});
            await clientContractInstance.deploy([]);
        });
      });
    
      describe('Interact with contracts', () => {
        it('should get USD exchange rate', async () => {
          const result = await clientContractInstance.methods.get_exchange_rate(backendContractInstance.deployInfo.address, "USD", {amount: 100});
          assert.equal(result.decodedResult, '1')
        });
    
        it('should get EUR exchange rate', async () => {
          const result = await clientContractInstance.methods.get_exchange_rate(backendContractInstance.deployInfo.address, "EUR", {amount: 100});
          assert.equal(result.decodedResult, '2')
        });
      })
});