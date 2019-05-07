const fs = require('fs');
const path = require('path');
const {
    spawn
} = require('promisify-child-process');

const NETWORK_ID = 'ae_devnet';
const COMPILER_HTTP_ADDRESS = 'https://compiler.aepps.com';

const readFile = (path, encoding = null, errTitle = 'READ FILE ERR') => {
    try {
        return fs.readFileSync(
            path,
            encoding
        )
    } catch (e) {
        console.log(e);
        switch (e.code) {
        case 'ENOENT':
            throw new Error('File not found', e);
        default:
            throw e
        }
    }
}

const writeFile = (path, content) => {
    fs.writeFileSync(path, content);
}

const writeFileRelative = async (relativePath, content = null) => {
    return writeFile(path.resolve(process.cwd(), relativePath), content);
}

const readFileRelative = (relativePath, encoding = null, errTitle = 'READ FILE ERR') => {
    return readFile(path.resolve(process.cwd(), relativePath), encoding, errTitle);
}

const fileExists = (relativePath) => {
    return fs.existsSync(path.resolve(process.cwd(), relativePath));
}

const trimAddresses = (addressToTrim) => {
    return addressToTrim.substring(3)
}

const getDeployedContractInstance = async function (Universal, clientConfig, contractSource, initState = []) {

    let client = await getClient(Universal, clientConfig, clientConfig.ownerKeyPair);

    let compiledContract = await client.contractCompile(contractSource);

    let contractObject = await client.getContractInstance(contractSource);
    await contractObject.compile();
    let deployedContract = await contractObject.deploy(initState);

    let result = {
        deployedContract,
        compiledContract
    }

    return result;
};

const getClient = async function (Universal, clientConfig, keyPair) {
    let client = await Universal({
        url: clientConfig.host,
        internalUrl: clientConfig.internalHost,
        keypair: keyPair,
        nativeMode: true,
        networkId: NETWORK_ID,
        compilerUrl: COMPILER_HTTP_ADDRESS
    });

    return client;
}

function publicKeyToHex (crypto, publicKey) {
    let byteArray = crypto.decodeBase58Check(publicKey.split('_')[1]);
    let asHex = '#' + byteArray.toString('hex');
    return asHex;
}

const execute = async (cli, command, args, options = {}) => {
    const child = spawn(cli, [command, ...args], options)
    let result = '';

    child.stdout.on('data', (data) => {
        result += data.toString();
    })

    child.stderr.on('data', (data) => {
        result += data.toString();
    })

    await child;
    return result;
}

module.exports = {
    readFile,
    readFileRelative,
    writeFileRelative,
    fileExists,
    trimAddresses,
    getDeployedContractInstance,
    publicKeyToHex,
    getClient,
    execute
}