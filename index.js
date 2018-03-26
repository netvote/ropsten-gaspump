const Web3 = require("web3")
const Accounts = require('web3-eth-accounts');
const account = new Accounts('ws://localhost:8546');
const https = require('https');
const http = require('http');

let web3 = new Web3(new Web3.providers.HttpProvider('https://ropsten.infura.io/'));
const TARGET_ADDRESS = '0x8eedf056de8d0b0fd282cc0d7333488cc5b5d242';
//const TARGET_ADDRESS = '0x74ecf4529b8d0fb84dbcf512b6f4cbc0ffadd690';
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

const getGasFromRopstenFauct = (acct) => {
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
}

const getGasFromMetamaskFaucet = (acct) => {
    let postData = acct.address;

    let options = {
        ":authority": 'faucet.metamask.io',
        hostname: 'faucet.metamask.io',
        port: 443,
        path: '/',
        method: 'POST',
        headers: {
            'Content-Type': 'application/rawdata',
            'Content-Length': postData.length,
            'origin': 'https://faucet.metamask.io',
            'referer': 'https://faucet.metamask.io/',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36'
        }
    };

    let req = https.request(options, (res) => {
        console.log('statusCode:', res.statusCode);
        console.log('headers:', res.headers);

        res.on('data', (d) => {
            console.log('done');
        });
    });

    req.on('error', (e) => {
        console.error(e);
    });

    req.write(postData);
    req.end();
}

for(let a =0; a<20; a++) {
    let accts = [];
    let acct = account.create();
    accts.push(acct);

    console.log("generated: "+acct.address);

    getGasFromMetamaskFaucet(acct);
    //getGasFromRopstenFauct(acct);

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


