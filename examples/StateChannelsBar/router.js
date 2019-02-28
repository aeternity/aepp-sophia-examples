
const stateController = require('./controllers/state-controller');
const configController = require('./controllers/config-controller');

const partials = {
    HOME: 'partials/home'
}

module.exports = app => {
    app.get('/', function (req, res) {
        res.render(partials.HOME);
    });
    app.post('/channel', stateController.post.createChannel);
    app.post('/buy', stateController.post.buyProduct);
    app.post('/stop', stateController.post.stopChannel);
    app.get('/config/params', configController.get.getParams);
    app.get('/products', configController.get.getProducts);
    app.get('/faucet', stateController.get.faucet);
}