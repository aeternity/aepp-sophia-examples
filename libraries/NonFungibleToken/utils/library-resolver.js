const fs = require('fs');
const path = require('path');

function resolveLibraries (filePath) {
    
    let map = new Map();

    return processFile(filePath, map)
    
    function processFile(contractPath, map) {
    
        if(map.has(contractPath)) {
            return;
        }

        let contractDirectory = contractPath.substr(0, contractPath.lastIndexOf('/'));
    
        let contract = fs.readFileSync(contractPath, 'utf-8');
        let rgx = /^include\s+\"([a-zA-Z\/\.\-\_]+)\"$/gmi;
    
        ///
        //let rgxContent = /^contract\s+(\w+)(\s+is\s+[\w\,\s]+)*\s+{/gm;
        let contentStartIndex =  contract.indexOf('contract ');
        let content = contract.substr(contentStartIndex);
        
        class Data {
            constructor(content){
                this.index = 0;
                this.content = [];
                this.content.push(content);
            }

            addDependency(content){
                this.content.unshift(content);
            }

            unionContent(){
                let unionContract = '';

                for(let c in this.content) {
                    unionContract += this.content[c] + '\n\n';
                }

                return unionContract;
            }
        }

        let contact = new Data(content);
        ///
    
    
        let match;
        while (match = rgx.exec(contract)) {
          //console.log('==>', path.resolve(contractDirectory, match[1]));
          let dependency = fs.readFileSync(path.resolve(contractDirectory, match[1]), 'utf-8');

          contact.addDependency(dependency);
        }
    
        // for (const dependency of data.dependencies) {
        //     processFile(dependency, map);
        // }

        return contact.unionContent();
    }
    
    // sort map by dependencies
}

module.exports = {
    resolveLibraries
};