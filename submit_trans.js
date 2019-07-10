const cbor = require('cbor');
const {createContext, CryptoFactory} = require('sawtooth-sdk/signing');
const {createHash} = require('crypto');
const {protobuf} = require('sawtooth-sdk');
const crypto = require('crypto');

const context = createContext('secp256k1');
const privateKey = context.newRandomPrivateKey();
const signer = new CryptoFactory(context).newSigner(privateKey);


const payload = {
  names: 'set',
  id: 'foo',
  date: "42"
};

// Here's how you can generate the input output address
const FAMILY_NAMESPACE = crypto.createHash('sha512').update('cert_issuer').digest('hex').toLowerCase().substr(0, 6);
const address = FAMILY_NAMESPACE + crypto.createHash('sha512').update('id').digest('hex').toLowerCase().substr(0, 64);



const payloadBytes = cbor.encode(payload);

const transactionHeaderBytes = protobuf.TransactionHeader.encode({
  familyName: 'cert_issuer',
  familyVersion: '1.0',
  inputs: [address],
  outputs: [address],
  signerPublicKey: signer.getPublicKey().asHex(),
  batcherPublicKey: signer.getPublicKey().asHex(),
  dependencies: [],
  payloadSha512: createHash('sha512').update(payloadBytes).digest('hex')
}).finish();

const transactionHeaderSignature = signer.sign(transactionHeaderBytes);

const transaction = protobuf.Transaction.create({
  header: transactionHeaderBytes,
  headerSignature: transactionHeaderSignature,
  payload: payloadBytes
});

const transactions = [transaction]

const batchHeaderBytes = protobuf.BatchHeader.encode({
  signerPublicKey: signer.getPublicKey().asHex(),
  transactionIds: transactions.map((txn) => txn.headerSignature),
}).finish();

const batchHeaderSignature = signer.sign(batchHeaderBytes)

const batch = protobuf.Batch.create({
  header: batchHeaderBytes,
  headerSignature: batchHeaderSignature,
  transactions: transactions
});

const batchListBytes = protobuf.BatchList.encode({
  batches: [batch]}).finish();


const request = require('request');

request.post({
  url: 'http://192.168.99.100:8008/batches',
  body: payload,
  headers: {'Content-Type': 'application/octet-stream'}
}, (err, response) => {
  if(err) {
    return console.log(err);
  }

  console.log(response.body);
});
