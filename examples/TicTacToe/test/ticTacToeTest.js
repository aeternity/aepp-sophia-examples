const Ae = require('@aeternity/aepp-sdk').Universal
const Crypto = require('@aeternity/aepp-sdk').Crypto

const config = {
  host: 'http://localhost:3001/',
  internalHost: 'http://localhost:3001/internal/',
  gas: 200000,
  ttl: 55
}

async function deployContract (contractName, ...params) {
  const [owner, gas, deployObj] = [params[0], params[1], params[2]]
  const contractSource = utils.readFileRelative(
    `./contracts/${contractName}.aes`,
    'utf-8'
  )
  const compileContract = await owner.contractCompile(contractSource, gas)
  const deployPromiseContract = await compileContract.deploy(deployObj)
  return deployPromiseContract
}

function decodeContractAddress (contract) {
  const decoded58addres = Crypto.decodeBase58Check(
    contract.address.split('_')[1]
  ).toString('hex')
  return `0x${decoded58addres}`
}

async function callContract (
  contract,
  functionName,
  args,
  decodeType = 'string'
) {
  const result = await contract.call(functionName, args)
  const decodedResult = await result.decode(decodeType)
  return decodedResult.value
}

describe('TicTacToe Contract', () => {
  let owner
  let TicTacToeContract

  before(async () => {
    const ownerKeyPair = wallets[0]
    owner = await Ae({
      url: config.host,
      internalUrl: config.internalHost,
      keypair: ownerKeyPair,
      nativeMode: true,
      networkId: 'ae_devnet'
    })
  })

  describe('Deploy contract', () => {
    it('should deploy TicTacToe contract', async () => {
      const gas = { gas: config.gas }
      const deployObj = { options: { ttl: config.ttl } }
      TicTacToeContract = await deployContract(
        'TicTacToe',
        owner,
        gas,
        deployObj
      )
      assert(TicTacToeContract.hasOwnProperty('address'))
      assert(TicTacToeContract.hasOwnProperty('owner'))
    })
  })

  describe('Interact with the contract', () => {
    before(() => {
      addressTicTacToe = decodeContractAddress(TicTacToeContract)
    })

    it('should set player 1 ', async () => {
      const args = {
        args: `(11,1)`,
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(
        TicTacToeContract,
        'make_move',
        args,
        'string'
      )
      assert.equal(result, "Game continues. The other player's turn.")
    })

    it('should set player 2 ', async () => {
      const args = {
        args: `(12, 2)`,
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(
        TicTacToeContract,
        'make_move',
        args,
        'string'
      )
      assert.equal(result, "Game continues. The other player's turn.")
    })
    it('should set player 1 ', async () => {
      const args = {
        args: `(33,1)`,
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(
        TicTacToeContract,
        'make_move',
        args,
        'string'
      )
      assert.equal(result, "Game continues. The other player's turn.")
    })

    it('should set player 2 ', async () => {
      const args = {
        args: `(23,2)`,
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(
        TicTacToeContract,
        'make_move',
        args,
        'string'
      )
      assert.equal(result, "Game continues. The other player's turn.")
    })

    it('should set player 1 ', async () => {
      const args = {
        args: `(31, 1)`,
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(
        TicTacToeContract,
        'make_move',
        args,
        'string'
      )
      assert.equal(result, "Game continues. The other player's turn.")
    })

    it('should set player 2 ', async () => {
      const args = {
        args: `(21,2)`,
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(
        TicTacToeContract,
        'make_move',
        args,
        'string'
      )
      assert.equal(result, "Game continues. The other player's turn.")
    })

    it('should win player 1 ', async () => {
      const args = {
        args: `(32,1)`,
        options: { ttl: 55 },
        abi: 'sophia'
      }
      const result = await callContract(
        TicTacToeContract,
        'make_move',
        args,
        'string'
      )
      assert.equal(result, 'You are the winner! Congratulations player 1')
    })
  })
})
