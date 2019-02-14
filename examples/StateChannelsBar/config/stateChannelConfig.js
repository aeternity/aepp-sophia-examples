
const keyPair = require('./keyPair');
const nodeConfig = require('./nodeConfig');

const MINIMUM_DEPOSIT = 30000;
const channelReserve = parseInt(MINIMUM_DEPOSIT * 0.25);

module.exports = {
    params: {
        // Public key of initiator
        // (in this case `initiatorAddress` defined earlier)
        initiatorId: '',
        // Public key of responder
        // (in this case `responderAddress` defined earlier)
        responderId: keyPair.publicKey,
        // Initial deposit in favour of the responder by the initiator
        pushAmount: 0,
        // Amount of tokens initiator will deposit into state channel
        initiatorAmount: MINIMUM_DEPOSIT,
        // Amount of tokens responder will deposit into state channel
        responderAmount: MINIMUM_DEPOSIT,
        // Minimum amount both peers need to maintain
        channelReserve: channelReserve,
        // Minimum block height to include the channel_create_tx
        ttl: 1000,
        // Amount of blocks for disputing a solo close
        lockPeriod: 20,
        // Host of the responder's node
        host: nodeConfig.RESPONDER_HOST,
        // Port of the responders node
        port: nodeConfig.RESPONDER_PORT,
        fee: 1000
    }
}