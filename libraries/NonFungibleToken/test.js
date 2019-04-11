// let union = require('./utils/library-resolver');
// let contractPath = './contracts/non-fungible-burnable-token.aes';
// let contractSource = union.resolveLibraries(contractPath);
// console.log(contractSource);

let input = `etherlime ganache --mnemonic "radar blur cabbage chef fix engine embark joy scheme fiction master release" --test "test edno dve tri"`;
let rgx = /(?:\"[a-zA-Z\d\-\s]+")|(?:[a-zA-Z\d\-]+)/gm
let args = [];

let match;
while(match = rgx.exec(input)){
    let temp = match[0].replace('"','').replace('"','');
    args.push(temp);
}

console.log(args);