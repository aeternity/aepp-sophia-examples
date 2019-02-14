
let useTestNetConfiguration = false;

const API_URL = useTestNetConfiguration ? 'https://sdk-testnet.aepps.com' : 'http://localhost:3001'
const INTERNAL_API_URL = useTestNetConfiguration ? 'https://sdk-testnet.aepps.com' : 'http://localhost:3113'
const STATE_CHANNEL_URL = useTestNetConfiguration ?  'https://sdk-testnet.aepps.com' : 'ws://localhost:3001'
const NETWORK_ID = useTestNetConfiguration ? 'ae_uat' : 'ae_devnet' // 'ae_uat'; //'ae_docker' , ae_devnet
const RESPONDER_HOST = useTestNetConfiguration ? 'https://sdk-testnet.aepps.com' : 'localhost'
const RESPONDER_PORT = 3333

module.exports = {
    API_URL,
    INTERNAL_API_URL,
    STATE_CHANNEL_URL,
    NETWORK_ID,
    RESPONDER_HOST,
    RESPONDER_PORT
}