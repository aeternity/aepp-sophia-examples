const Ae = require('@aeternity/aepp-sdk').Universal

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

describe('Smart Provider Contract', () => {
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

  describe('Deploy contracts', () => {
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
})
