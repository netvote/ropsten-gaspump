const NUMBER_OF_VOTES = 20;
const TARGET_ADDRESS = '0xb055de68519c500eb4855dfa928cec037f30e7d5';

const Web3 = require("web3")
const Accounts = require('web3-eth-accounts');
const account = new Accounts('ws://localhost:8546');

const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
const lambda = new AWS.Lambda({region: "us-east-1", apiversion: '2015-03-31'});

const admin = require('firebase-admin');
const serviceAccount = require('./.netvote.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});


let web3 = new Web3(new Web3.providers.HttpProvider('https://ropsten.infura.io/'));

let votes = [
    "9JO6k5pWGh5jHj/GhsaT3cpkk7lvWwDn2RzX8+3iS7I=", // john, yes, doug
    "EzWVsp2cqEg2SF92/Y6Jh6kXLLOlx+porQBPEc9Ihmg=", // sally, no, emily
    "qpB6mozQtgwqaktf+VbrYCAfSl2B95pojUjgKQHvBpI=", // tyrone, yes, emily
    "EzWVsp2cqEg2SF92/Y6Jh6kXLLOlx+porQBPEc9Ihmg=", // sally, no, emily
    "EzWVsp2cqEg2SF92/Y6Jh6kXLLOlx+porQBPEc9Ihmg="  // sally, no, emily
];

const gatewayNonce = () => {
    let db = admin.firestore();
    let counterRef = db.collection("nonceCounter").doc("gateway");

    return db.runTransaction((t) => {
        return t.get(counterRef).then((doc) => {
            if (!doc.exists) {
                throw "Counter does not exist!";
            }
            let newNonce = doc.data().nonce + 1;
            t.update(counterRef, { nonce: newNonce });
            return Promise.resolve(newNonce);
        });
    })
};

const sendVotes = async (max) => {
    for (let i = 0; i < max; i++) {
        let accts = [];
        let acct = account.create();
        accts.push(acct);

        let voteId = web3.sha3(acct.address);
        let nonce = await gatewayNonce();
        let votePayload = {
            "address": TARGET_ADDRESS,
            "encryptedVote": votes[Math.floor(Math.random() * votes.length)],
            "passphrase": "generated",
            "pushToken": "",
            "nonce": nonce,
            "timestamp": new Date().getTime(),
            "tokenId": voteId,
            "voteId": voteId
        };
        const lambdaParams = {
            FunctionName: 'netvote-cast-vote',
            InvocationType: 'Event',
            LogType: 'None',
            Payload: JSON.stringify({
                vote: votePayload
            })
        };

        lambda.invoke(lambdaParams, (error, data) => {
            if (error) {
                console.error(error)
            } else {
                console.log("invocation completed, data:" + JSON.stringify(data))
            }
        });
    }
};

sendVotes(NUMBER_OF_VOTES).then(()=>{
    console.log("complete!")
});
