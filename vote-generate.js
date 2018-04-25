const NUMBER_OF_VOTES = 20;
const TARGET_ADDRESS = '0xb055de68519c500eb4855dfa928cec037f30e7d5';

const Web3 = require("web3")
const Accounts = require('web3-eth-accounts');
const account = new Accounts('ws://localhost:8546');
const admin = require('firebase-admin');
const serviceAccount = require('./.netvote.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

let db = admin.firestore();
let batch = db.batch();

let web3 = new Web3(new Web3.providers.HttpProvider('https://ropsten.infura.io/'));

let votes = [
    "X8CdeKG0GxyYgP9qjlVOzdBDDucPw9fLsvATpmzTkfg=",
    "DG2rk8bmq/6+gKATMV5aMsCZlTWA0feHkemSSSX0bgc=",
    "VPqtXN/XdZaJvApFN/jCfKhlMp4h2w/Di0PBfbsncOo=",
    "2EacI2nOcIO37eemVL84XihAZqvXW7u8oaYpK5oNsD8=",
    "5RXnG9YUOCpGKOcSVq9mPVxApa8kGos/IP3AxALwKh8=",
    "sHgTPVB06HBwGexxskXDMoZVtKsCRs7uI6FvAotVgs8="
];

const sendVotes = async(max) => {
    for(let i =0; i<max; i++) {
        let accts = [];
        let acct = account.create();
        accts.push(acct);

        let voteId = web3.sha3(acct.address);

        let votePayload = {
            "address": TARGET_ADDRESS,
            "encryptedVote": votes[Math.floor(Math.random() * votes.length)],
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
        console.log("sent "+max+" "+votes);
    });
};

sendVotes(NUMBER_OF_VOTES);
