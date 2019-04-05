// "@aeternity/aepp-sdk": "https://github.com/aeternity/aepp-sdk-js.git#2.1.1-0.1.0-next",

const {
    MemoryAccount,
    Channel,
    Crypto,
    Universal,
    TxBuilder
} = require('@aeternity/aepp-sdk')

const {
    API_URL,
    INTERNAL_API_URL,
    STATE_CHANNEL_URL,
    NETWORK_ID,
    RESPONDER_HOST,
    RESPONDER_PORT
} = require('./config/nodeConfig');


const initiatorKeyPair = {
    publicKey: 'ak_2mwRmUeYmfuW93ti9HMSUJzCk1EYcQEfikVSzgo6k2VghsWhgU',
    secretKey: 'bb9f0b01c8c9553cfbaf7ef81a50f977b1326801ebf7294d1c2cbccdedf27476e9bbf604e611b5460a3b3999e9771b6f60417d73ce7c5519e12f7e127a1225ca'
}

const responderKeyPair = {
    publicKey: 'ak_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk',
    secretKey: '7c6e602a94f30e4ea7edabe4376314f69ba7eaa2f355ecedb339df847b6f0d80575f81ffb0a297b7725dc671da0b1769b1fc5cbe45385c7b5ad1fc2eaf1d609d'
}

const initiatorAddress = initiatorKeyPair.publicKey;
const responderAddress = responderKeyPair.publicKey;

let initiatorAccount;
let responderAccount;

console.log('------------------ STATE CHANNEL DEMO -----------------------')


async function createAccounts() {
    initiatorAccount = await Universal({
        networkId: NETWORK_ID,
        url: API_URL,
        internalUrl: INTERNAL_API_URL,
        keypair: initiatorKeyPair
    })
    responderAccount = await Universal({
        networkId: NETWORK_ID,
        url: API_URL,
        internalUrl: INTERNAL_API_URL,
        keypair: responderKeyPair
    })
}

// console.log( createAccounts(initiatorKeyPair).then((r,e) => {
//     console.log(r);
//     console.log(e);
// }))

// (async function(){
//     await createAccounts();

//     let aa = responderAccount.signTransaction('tx_+HcyAaEB6bv2BOYRtUYKOzmZ6Xcbb2BBfXPOfFUZ4S9+EnoSJcqCw1ChAVdfgf+wope3cl3GcdoLF2mx/Fy+RThce1rR/C6vHWCdgsNQgpxACgCCTiDAoAAQgI1ZAPpXMi6/bkGIMNO+WjPcZZ92aix8iJGet+YkC6RUXYo=');
//     console.log(await aa);
// })()

async function initiatorSign(tag, tx) {
    console.log('==> initiatorSign initiator_sign:', tx);
    if (tag === 'initiator_sign') {
        console.log('==> initiator_sign:');
        //console.log();

        return initiatorAccount.signTransaction(tx)
    }

    // Deserialize binary transaction so we can inspect it
    // const txData = Crypto.deserialize(Crypto.decodeTx(tx), {
    //     prettyTags: true
    // })

    //const txData = deserializeTx(tx);

    // console.log();
    // console.log('----> txData');
    // console.log(txData);

    // console.log('==> initiatorSign txData');
    // console.log(txData);
    // console.log();

    if (tag === 'shutdown_sign_ack') {
        if (true 
            // txData.tag === 'CHANNEL_CLOSE_MUTUAL_TX' //&& TURN ME ON AFTER DESERIALIZE TX WORK AGAIN
            // To keep things simple we manually check that
            // balances are correct (as a result of previous transfer update)
            // txData.initiatorAmount === 49990 &&
            // txData.responderAmount === 50010
        ) {
            return initiatorAccount.signTransaction(tx)
        }
    }
}

function deserializeTx(tx) {
    const txData = Crypto.deserialize(Crypto.decodeTx(tx), {
        prettyTags: true
    })

    // const txData = TxBuilder.unpackTx(tx);

    console.log(txData);
    
    return txData;
}

async function responderSign(tag, tx) {
    console.log('==> responderSign', tag);
    // console.log(tag);
    // console.log();

    if (tag === 'responder_sign') {
        return responderAccount.signTransaction(tx)
    }

    // Deserialize binary transaction so we can inspect it
    // >>> !!! TURN ME ON AFTER DESERIALIZE TX WORK AGAIN !!! <<<
    const txData = deserializeTx(tx);
    // console.log();
    // console.log('----> txData');
    // console.log(txData);

    // When someone wants to transfer a tokens we will receive
    // a sign request with `update_ack` tag
    if (tag === 'update_ack') {

        // console.log('==> txData');
        // console.log(txData);
        // console.log();

        // Check if update contains only one offchain transaction
        // and sender is initiator
        if (
            true 
            // txData.tag === 'CHANNEL_OFFCHAIN_TX' &&
            // txData.updates.length === 1 &&
            // txData.updates[0].from === initiatorAddress
        ) {
            return responderAccount.signTransaction(tx)
        }
    }
}

async function connectAsInitiator(params) {
    return Channel({
        ...params,
        url: STATE_CHANNEL_URL,
        role: 'initiator',
        sign: initiatorSign
    })
}

async function connectAsResponder(params) {
    return Channel({
        ...params,
        url: STATE_CHANNEL_URL,
        role: 'responder',
        sign: responderSign
    })
}

const params = {
    // Public key of initiator
    // (in this case `initiatorAddress` defined earlier)
    initiatorId: initiatorAddress,
    // Public key of responder
    // (in this case `responderAddress` defined earlier)
    responderId: responderAddress,
    // Initial deposit in favour of the responder by the initiator
    pushAmount: 0,
    // Amount of tokens initiator will deposit into state channel
    initiatorAmount: 50000,
    // Amount of tokens responder will deposit into state channel
    responderAmount: 50000,
    // Minimum amount both peers need to maintain
    channelReserve: 40000,
    // Minimum block height to include the channel_create_tx
    ttl: 1000,
    // Amount of blocks for disputing a solo close
    lockPeriod: 10,
    // Host of the responder's node
    host: RESPONDER_HOST,
    // Port of the responders node
    port: RESPONDER_PORT,
}

createAccounts().then(() => {

    // initiator connects to state channels endpoint
    connectAsInitiator(params).then(initiatorChannel => {

        initiatorChannel.on('statusChanged', (status) => {
            console.log(`[${status.toUpperCase()}]`);
        })

        initiatorChannel.on('onChainTx', (tx) => {
            //console.log('==> channel_create_tx:', tx)
        })

        // off chain balances
        getOffChainBalances1(initiatorChannel)
        
        if (false) {
            initiatorChannel.balances(
                [initiatorKeyPair.publicKey],
            ).then(function (balances) {
                console.log('-=-=>> off chain balance')
                console.log(balances[initiatorKeyPair.publicKey])
            }).catch(e => console.log(e))
        }


        getOffChainBalances1(initiatorChannel)
        //initiatorChannel.sendMessage('hello world', responderAddress)

        initiatorChannel.update(
            // Sender account
            initiatorAddress,
            // Recipient account
            responderAddress,
            // Amount
            10,
            // This function should verify offchain transaction
            // and sign it with initiator's private key
            async (tx) => initiatorAccount.signTransaction(tx)
        ).then((result) => {
            if (result.accepted) {
                console.log('==> Successfully transfered 10 tokens!', result)
            } else {
                //console.log('=====> Transfer has been rejected')
            }
        }).catch(e => {
            console.log('==> Error:', e);
        })

        initiatorChannel.on('error', err => console.log(err))

        // setTimeout(() => {
        //     // this work
        //     // initiatorChannel.leave().then(({channelId, state}) => {
        //     //     console.log('=*=> leaving the channel');
        //     //     console.log(channelId);
        //     //     console.log(state);
        //     // })
        // }, 15000)

    }).catch(err => {
        console.log('==> Initiator failed to connect')
        console.log(err)
    })

    // responder connects to state channels endpoint
    connectAsResponder(params).then(responderChannel => {
        responderChannel.on('message', (msg) => {
            console.log('==>Received message from:', msg)
        })

        // close channel after a minute
        setTimeout(() => {
            responderChannel.shutdown(
                // This function should verify shutdown transaction
                // and sign it with responder's secret key 
                async (tx) => responderAccount.signTransaction(tx)
            ).then((tx) => {
                console.log('==> State channel has been closed. You can track this transaction onchain', tx)
            }).catch(e => {
                console.log('==> Error:', e);
            })
        }, 30000)

        responderChannel.on('error', err => console.log(err))
    }).catch(err => {
        console.log('==> Responder failed to connect')
        console.log(err)
    });

    async function getOffChainBalances2(channel) {
        // off chain balances
       let balances = await channel.balances([ initiatorKeyPair.publicKey, responderKeyPair.publicKey]);
       console.log('-=-=>> off chain balance 2')
       console.log(balances[initiatorKeyPair.publicKey])
       console.log(balances[responderKeyPair.publicKey])
   }

    function getOffChainBalances1(channel) {
        // off chain balances
        channel.balances([
            initiatorKeyPair.publicKey, 
            responderKeyPair.publicKey])
            .then(function (balances) {
                console.log('-=-=>> off chain balance 1')
                console.log(balances[initiatorKeyPair.publicKey])
                    console.log(balances[responderKeyPair.publicKey])
            }).catch(e => console.log(e))
    }
})