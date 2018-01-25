const Web3 = require("web3")
const Accounts = require('web3-eth-accounts');
const account = new Accounts('ws://localhost:8546');
const http = require('http');

let web3 = new Web3(new Web3.providers.HttpProvider('https://ropsten.infura.io/'+process.env.INFURA_API_KEY));
const TARGET_ADDRESS = '0x8eedf056de8d0b0fd282cc0d7333488cc5b5d242';

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const waitForBalance = async(acct) => {
    return new Promise(async (resolve, reject) => {
        let done = false;
        for(let i=0; i<100; i++){
            if(done) return;
            try {
                web3.eth.getBalance(acct.address, (x, bal) => {
                    if (!done && bal.toNumber() > 0) {
                        resolve(bal.toNumber());
                        done = true;
                    }
                });
            }catch(e){
                console.log("ignoring error: "+e.message)
            }
            await sleep(3000);
        }
        reject();
    });
};

for(let a =0; a<10; a++) {
    let accts = [];
    let acct = account.create();
    accts.push(acct);

    console.log("generated: "+acct.address);
    http.get('http://faucet.ropsten.be:3001/donate/' + acct.address, (resp) => {
        let data = '';

        // A chunk of data has been recieved.
        resp.on('data', (chunk) => {
            data += chunk;
        });

        // The whole response has been received. Print out the result.
        resp.on('end', () => {
        });

    }).on("error", (err) => {
        console.log("Error: " + err.message);
    });

    waitForBalance(acct).then(async (bal) => {
        console.log(acct.address+" received "+bal+" wei");

	let valToSend = '' + (bal - 2640000000000000);
        let tx = acct.signTransaction({
            to: TARGET_ADDRESS,
            value: valToSend,
            gas: 22000,
            gasPrice: "120000000000",
            nonce: 0,
            chainId: 3
        });

        await sleep(2000);

        await web3.eth.sendRawTransaction(tx.rawTransaction, (err, result) => {
            if (err) {
                console.log('error');
                console.log(err);
            } else {
		console.log(acct.address+' sent '+valToSend+' to '+TARGET_ADDRESS);
            }
        });
    }).catch((e) => {
        console.log("failed to receive balance: " + e)
    });
}


