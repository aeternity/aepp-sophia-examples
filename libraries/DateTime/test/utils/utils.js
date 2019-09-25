const path = require('path');
const utils = require('forgae-utils');
const fs = require('fs-extra');


//TODO to be implemented recursive flattener
function createActualContract(contract, contractDirectory, appendedContractPath) {
    var data = getFilePaths(contract)
    
    for (let index = 0; index < data.dependencies.length; index++) {
        let dependencyPath = path.resolve(`${contractDirectory}${data.dependencies[index]}`);
        let dependencyContent = utils.readFileRelative(dependencyPath, 'utf-8')
        
        fs.appendFileSync(appendedContractPath, dependencyContent + "\r\n\n")
    }
    fs.appendFileSync(appendedContractPath, data.content)
}

function removeFiles(appendedContractPath) {
    fs.removeSync(appendedContractPath)
}

function getFilePaths(contract) {
    let rgx = /^include\s+\"([a-zA-Z\/\.\-\_]+)\"/gmi;
    let contentStartIndex = contract.indexOf('contract ');
    let content = contract.substr(contentStartIndex);
    let data = {
        dependencies: [],
        content
    }
    let match;

    while (match = rgx.exec(contract)) {
        data.dependencies.push(match[1])
    }
    return data
}

module.exports = {
    createActualContract,
    removeFiles
}