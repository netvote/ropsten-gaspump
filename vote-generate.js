const Web3 = require("web3")
const Accounts = require('web3-eth-accounts');
const account = new Accounts('ws://localhost:8546');
const fs = require('fs');

const admin = require('firebase-admin');
const serviceAccount = require('./.netvote.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

let web3 = new Web3(new Web3.providers.HttpProvider('https://ropsten.infura.io/'));
const TARGET_ADDRESS = '0xa71cfeb932ec407304032600f91c796394465bb9';

let votes = [
    "X8CdeKG0GxyYgP9qjlVOzdBDDucPw9fLsvATpmzTkfg=",
    "DG2rk8bmq/6+gKATMV5aMsCZlTWA0feHkemSSSX0bgc=",
    "VPqtXN/XdZaJvApFN/jCfKhlMp4h2w/Di0PBfbsncOo=",
    "2EacI2nOcIO37eemVL84XihAZqvXW7u8oaYpK5oNsD8=",
    "5RXnG9YUOCpGKOcSVq9mPVxApa8kGos/IP3AxALwKh8=",
    "sHgTPVB06HBwGexxskXDMoZVtKsCRs7uI6FvAotVgs8="
];

let db = admin.firestore();
let batch = db.batch();

for(let i =0; i<20; i++) {
    let accts = [];
    let acct = account.create();
    accts.push(acct);

    let voteId = web3.sha3(acct.address);

    let votePayload = {
        "address": TARGET_ADDRESS,
        "encryptedVote":  votes[Math.floor(Math.random()*votes.length)],
        "passphrase": "generated",
        "pushToken": "",
        "timestamp": new Date().getTime(),
        "tokenId": voteId,
        "voteId": voteId
    };

    let voteRef = db.collection('transactionCastVote').doc(acct.address);
    batch.set(voteRef, votePayload);
}

return batch.commit().then(function () {
    console.log("done")
});


