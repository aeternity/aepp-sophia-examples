const config = require('./../config/stateChannelConfig');
const products = require('./../config/products');

async function getParams(req, res) {

    let params = config.params

    res.send(params);
}

function getProducts (req, res) {
    let productArr = [];
    for (productName in products) {
        productArr.push({
            name: productName,
            price: products[productName]
        });
    }

    res.send(productArr);
}

module.exports = {
    get: {
        getParams,
        getProducts
    }
}