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

const deploy = async (network, privateKey, compiler, networkId) => {
  let deployer = new Deployer(network, privateKey, compiler, networkId)

  // DateTime
  await deployer.deploy("./contracts/DateTime.aes")

  // DateTime with Library
  let libraryContractAddress = (await deployer.deploy("./contracts/DateTimeLibraryContract.aes")).address
  await deployer.deploy("./contracts/DateTimeWithLibrary.aes",[libraryContractAddress])
};

module.exports = {
	deploy
};