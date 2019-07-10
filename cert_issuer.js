const {
  TransactionHandler
} = require('sawtooth-sdk/processor/handler')
const crypto = require('crypto')
const {
  InternalError,
  InvalidTransaction
} = require('sawtooth-sdk/processor/exceptions')
const {
  TextEncoder,
  TextDecoder
} = require('text-encoding/lib/encoding')
var encoder = new TextEncoder('utf8')
var decoder = new TextDecoder('utf8')
var db = require('./add_Mongodb')

const _hash = (x) =>
  crypto.createHash('sha512').update(x).digest('hex').toLowerCase().substring(0, 64)

const FAMILY_NAME = 'cert_issuer'
const VERSION = '1.0'
const NAMESPACE = _hash(FAMILY_NAME).substr(0, 6)

const _decodeRequest = (payload) =>
  new Promise((resolve, reject) => {
    payload = payload.toString().split(',')
    console.log('PAYLOAD LENGTH ' + payload.length)
    if (payload.length == 5) {
      resolve({
        owner_name: payload[0],
        property: payload[1],
        property_name: payload[2],
        stake: parseInt(payload[3]),
        date: new Date(payload[4])
      })
    } else if (payload) {
      resolve({
        action: 'revoke',
        message: payload[0],
        txn_id: payload[1],
        buyer_name: payload[2],
        sold_on : new Date(payload[3])
      })
    } else {
      let reason = new InvalidTransaction('Invalid payload serialization')
      reject(reason)
    }
  })

const _toInternalError = (err) => {
  console.log('in error message block')
  let message = err.message ? err.message : err
  throw new InternalError(message)
}

const createCert = (context, address, certData, txnid) => (possibleAddressValues) => {
  let stateValueRep = possibleAddressValues[address]
  let newData = {}
  let data
  var flag = 0
  newData[txnid] = certData
  if (stateValueRep == null || stateValueRep == '') {
    console.log('Creating your first certificate')
    console.log(newData)
  } else {
    data = decoder.decode(stateValueRep)
    data = JSON.parse(data)
    Object.keys(data).forEach(function (key) {
      if (JSON.stringify(data[key]) === JSON.stringify(certData)) {
        console.log('This certificate is already generated and will not be generated again')
        flag = 1
      }
    })
    if (flag === 0) {
      data[txnid] = certData
    }
    newData = data
    console.log('Your certificate is added to your namespace')
  }
  // Adding the certificate to database
  if (flag === 0) {
    var op = db.addData({
      txnid: txnid,
      data: certData,
      expires: 'working'
    })
    console.log('op' + op)
  }
  return _setEntry(context, address, newData)
}

const revokeCert = (context, address, message, txnid, buyer_name, sold_on) => (possibleAddressValues) => {
  let stateValueRep = possibleAddressValues[address]
  let data

  data = decoder.decode(stateValueRep)
  data = JSON.parse(data)
  // console.log("Data " + data)
  data[txnid]['expired'] = true
  data[txnid]['message'] = message
  data[txnid]['buyer_name'] = buyer_name
  data[txnid]['sold_on'] = sold_on
  db.revokeCert(txnid,message)
  console.log('New Certificate: ' + JSON.stringify(data[txnid]))
  var newData = data
  // console.log('All your certificates: ' + JSON.stringify(newData))
  console.log('The certificate is revoked due to ' + message)
  return _setEntry(context, address, newData)
}

const _setEntry = (context, address, stateValue) => {
  let entries = {
    [address]: encoder.encode(JSON.stringify(stateValue))
  }
  return context.setState(entries)
}

class cert_issuer extends TransactionHandler {
  constructor () {
    super(FAMILY_NAME, [VERSION], NAMESPACE)
  }

  apply (transactionRequest, context) {
    return _decodeRequest(transactionRequest.payload)
      .catch(_toInternalError)
      .then((update) => {
        console.log('Transaction is processing')

        let header = transactionRequest.header
        let userPublicKey = header.signerPublicKey
        let txnid = transactionRequest.signature

        if (!update.owner_name && !update.action) {
          throw new InvalidTransaction('Payload is empty')
        }

        let certData = {}
        let actionFn = createCert
        console.log("USER PUBLIC KEY " + userPublicKey)
        let senderAddress = NAMESPACE + _hash(userPublicKey).slice(-64)
        let getPromise = context.getState([senderAddress])

        if (update.action) {
          console.log(update + ' update')
          let txnUpdate = update.txn_id
          let message = update.message
          let buyer_name = update.buyer_name
          let sold_on = update.sold_on
          actionFn = revokeCert

          let actionPromise = getPromise.then(
            // console.log("Calling the function")
            actionFn(context, senderAddress, message, txnUpdate, buyer_name, sold_on)
          )
          return actionPromise.then(addresses => {
            if (addresses.length === 0) {
              throw new InternalError('State Error!')
            }
            console.log(`Certificate is revoked for transaction id: ${txnUpdate}`)
          })
        } else {
          certData = {
            owner_name: update.owner_name,
            property: update.property,
            property_name: update.property_name,
            stake: update.stake,
            date: update.date,
            expired: false,
            message: null,
            buyer_name: null,
            sold_on: null
          }
          let actionPromise = getPromise.then(
            // console.log("Calling the function")
            actionFn(context, senderAddress, certData, txnid)
          )
          return actionPromise.then(addresses => {
            if (addresses.length === 0) {
              throw new InternalError('State Error!')
            }
            console.log(`Certificate is at the address: ${JSON.stringify(addresses)}`)
          })
        }
      })
  }
}
module.exports = cert_issuer
