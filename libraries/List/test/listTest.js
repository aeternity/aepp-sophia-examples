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
const Deployer = require('aeproject-lib').Deployer;
const LIST_CONTRACT_PATH = "./contracts/List.aes";

describe('List Contract', () => {
  let deployer, instance;
  let ownerKeyPair = wallets[0];

  before(async () => {
    deployer = new Deployer('local', ownerKeyPair.secretKey)
  })

  it('Deploying List Contract', async () => {
    const deployedPromise = deployer.deploy(LIST_CONTRACT_PATH)

    await assert.isFulfilled(deployedPromise, 'Could not deploy the List Smart Contract');
    instance = await Promise.resolve(deployedPromise)
  })

  it('Should List size', async () => {
    assert.equal((await instance.size([])).decodedResult, 0)
    assert.equal((await instance.size(["x"])).decodedResult, 1)
    assert.equal((await instance.size([1,2,3])).decodedResult, 3)
  })
})
