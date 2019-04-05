const {
    MemoryAccount,
    Channel,
    Crypto,
    Universal,
    TxBuilder
} = require('@aeternity/aepp-sdk');

const {
    API_URL,
    INTERNAL_API_URL,
    STATE_CHANNEL_URL,
    NETWORK_ID,
    RESPONDER_HOST,
    RESPONDER_PORT
} = require('./../config/nodeConfig');

const amounts = require('./../config/stateChannelConfig').amounts;

const keyPair = require('./../config/keyPair');
const products = require('./../config/products');
const FUND_AMOUNT = amounts.deposit * 10;

let openChannels = new Map();

let createAccount = async function (keyPair) {
    let tempAccount = await Universal({
        networkId: NETWORK_ID,
        url: API_URL,
        internalUrl: INTERNAL_API_URL,
        keypair: {
            publicKey: keyPair.publicKey,
            secretKey: keyPair.secretKey
        }
    })

    return tempAccount;
}

let account;

(async function () {
    account = await createAccount(keyPair);
})()

async function createChannel(req, res) {

    let params = req.body.params;
    params.channelReserve = parseInt(params.initiatorAmount * 0.25);

    console.log('init params:', params);

    // params.host = 'wss://sdk-testnet.aepps.com/'
    // params.port = 'channel'

    let channel = await connectAsResponder(params);
    let data = {
        channel,
        round: 1,
        product: {
            name: '',
            price: 0
        },
        isSigned: true
    }

    openChannels.set(params.initiatorId, data);

    channel.sendMessage('State channel is successfully created!', params.initiatorId);

    res.send('ok');
}

async function buyProduct(req, res) {
    let initiatorAddress = req.body.initiatorAddress;
    let productName = req.body.productName;

    let productPrice = products[productName];
    let data = openChannels.get(initiatorAddress);

    console.log(`[BUY] round: ${data.round}, module: ${data.round % 5}`);

    if (productPrice && data && data.isSigned) {

        if(data.round % 5 === 0) {
            productPrice = 0;
        }

        data.round++;
        data.product = {
            name: productName,
            price: productPrice
        }
        data.isSigned = false;

        //data.channel.sendMessage('update successfully signed', initiatorAddress);
        getOffChainBalances(data.channel);

        openChannels[initiatorAddress] = data;

        res.send({
            price: productPrice
        });
    } else {
        res.status(404);
        res.end();
    }
}

function stopChannel(req, res) {

    let initiatorAddress = req.body.initiatorAddress;
    let result = openChannels.delete(initiatorAddress);

    res.send(result);
}

async function faucet(req, res) {

    console.log('[faucet] 1');
    let pubKey = req.query.pubKey;
    if(!pubKey) {
        res.send({
            success: false,
            message: `Invalid public key!`
        });

        return;
    }

    try {
        console.log('[faucet] 2');
        let result = await account.spend(FUND_AMOUNT, pubKey);
        console.log('[FAUCET]', result);
        res.send({
            success: true,
            message: `Public key: '${pubKey}' is funded with ${FUND_AMOUNT} aettos.`
        });
    } catch (error) {
        console.log(`[ERROR] [FAUCET]`);
        console.log(error);
        console.log();

        res.send({
            success: false,
            message: `Something went wrong, cannot fund this public key. For more info look at terminal!`
        });
    }
}

async function connectAsResponder(params) {
    return await Channel({
        ...params,
        url: STATE_CHANNEL_URL,
        //url: 'wss://sdk-testnet.aepps.com/',
        role: 'responder',
        sign: responderSign
    })
}

async function responderSign(tag, tx) {
    console.log('==> responder sign tag:', tag);

    // Deserialize binary transaction so we can inspect it
    const txData = deserializeTx(tx);
    console.log(txData);

    tag = txData.tag;


    if (tag === 'responder_sign' || tag === 'CHANNEL_CREATE_TX') {
        return account.signTransaction(tx)
    }

    

    // When someone wants to transfer a tokens we will receive
    // a sign request with `update_ack` tag
    if (tag === 'update_ack' || tag === 'CHANNEL_OFFCHAIN_TX') {

        let isValid = isTxValid(txData);
        if (!isValid) {
            // TODO: challenge/dispute
            console.log('==> [ERROR] transaction is not valid');
        }

        // Check if update contains only one offchain transaction
        // and sender is initiator
        if (txData.tag === 'CHANNEL_OFFCHAIN_TX' && isValid) {
            sendConfirmMsg(txData);
            return account.signTransaction(tx);
        }
    }

    if (tag === 'shutdown_sign_ack' || tag === 'CHANNEL_CLOSE_MUTUAL_TX') { // && txData.tag === 'CHANNEL_CLOSE_MUTUAL_TX'
        console.log('txData');
        console.log('...maybe this data is INCORRECT, shows some strange responder amount....');
        console.log(txData);
        return account.signTransaction(tx);
    }

    console.log('[ERROR] ==> THERE IS NO SUITABLE CASE TO SIGN');
}

function isTxValid(txData) {
    let lastUpdateIndex = txData.updates.length - 1;
    if (lastUpdateIndex < 0) {
        console.log('==> last index is smaller than 0')
        return false;
    }

    let lastUpdate = txData.updates[lastUpdateIndex];
    let data = openChannels.get(lastUpdate.from);
    if (!data) {
        console.log('==> no data <==')
        return false;
    }

    let isRoundValid = data.round === txData.round;
    let isPriceValid = data.product.price === txData.updates[lastUpdateIndex].amount;
    let isValid = isRoundValid && isPriceValid;
    if (isValid) {
        openChannels[lastUpdate.from].isSigned = true;
    }

    return isValid;
}

function sendConfirmMsg(txData) {

    let from = txData.updates[txData.updates.length - 1].from;

    let data = openChannels.get(from);
    let msg = `Successfully bought ${data.product.name} for ${data.product.price} ae.`;
    data.channel.sendMessage(msg, from);
}

function deserializeTx(tx) {
    const txData = Crypto.deserialize(Crypto.decodeTx(tx), {
        prettyTags: true
    });

    return txData;
}

function getOffChainBalances(channel) {
    // off chain balances
    channel.balances([ keyPair.publicKey ])
        .then(function (balances) {
            console.log('==> off chain balance');
            console.log('=== host:', balances[keyPair.publicKey]);
            console.log();
        }).catch(e => console.log(e))
}

module.exports = {
    get: {
        faucet
    },
    post: {
        createChannel,
        buyProduct,
        stopChannel
    }
}