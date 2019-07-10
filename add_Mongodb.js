var mongoose = require('mongoose')

function isEmpty(obj) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      return false
    }
  }
  return true
}

mongoose.Promise = global.Promise
mongoose.connect('mongodb://localhost:27017/Certificate')
var db = mongoose.connection
db.on('error', console.error.bind(console, 'MongoDB connection error:'))

var nameSchema = new mongoose.Schema({
  txnid: String,
  data: {
    owner_name: String,
    property: String,
    property_name: String,
    stake: Number,
    date: Date,
    expired: Boolean,
    message: String,
    buyer_name: String,
    sold_on: Date
  }
})
var User = mongoose.model('issued_data', nameSchema)

module.exports = {
  addData: async function(data) {
    var myData = new User(data)
    var query = await User.find({
      data: data
    }, function(err, verify) {
      if (err) {
        // return handleError(err)
        return err
      }
      return verify
    })
    console.log('Query' + query[0])
    if (isEmpty(query)) {
      console.log(myData['expires'])
      myData.save()
        .then(item => {
          console.log('Certificate data saved to database')
        })
        .catch(err => {
          console.log('Unable to save to  database \n' + err)
        })
    } else {
      console.log('Duplicate certificate is not added to database')
      console.log(typeof query)
    }
    return 'success'
  },

  revokeCert: async function(txnid,message) {
    var query = await User.find({
      txnid: txnid
    }, function (err, verify) {
      if (err) {
        // return handleError(err
        return err
      }
      return verify
    })
    // console.log('Query orig ' + query)
    if (isEmpty(query)) {
      console.log('No Certificate with that Transaction ID')
      return 0
    } else {
      var revoke = query[0]
      revoke = revoke["data"]
      revoke["expired"] = true
      revoke["message"] = message
    await User.findOneAndUpdate({ "txnid": txnid }, { "data" : revoke}, {new: true }, function(err, records) {
      if (err) return 0
      console.log("DATABASE RESPONSE AFTER REVOCATION" + records);
    })
    return 1
  }
    // console.log('hi')
    // var query = await User.find({
    //   txnid: txnid
    // }, function (err, verify) {
    //   if (err) {
    //     // return handleError(err
    //     return err
    //   }
    //   return verify
    // })
    // // console.log('Query orig ' + query)
    // if (isEmpty(query)) {
    //   console.log('No Certificate with that Transaction ID')
    //   return 0
    // } else {
    //   // console.log('Revoking the certificate \n')
    //   var revoke = query[0]
    //   // console.log('QUERY O/P:  ' + revoke)
    //   revoke["data"]['expired'] = false
    //   // console.log(revoke)
    //   User.replaceOne({query[0]["txnid"] : txnid}, {revoke["data"]['expired'] : false})
    //   return 1

  // }
}
}

// // Start
// 'use strict'
// const {
//   TransactionHandler
// } = require('sawtooth-sdk/processor/handler')
// const crypto = require('crypto')
// const {
//   InternalError,
//   InvalidTransaction
// } = require('sawtooth-sdk/processor/exceptions')
// const {
//   TextEncoder,
//   TextDecoder
// } = require('text-encoding/lib/encoding')
// var encoder = new TextEncoder('utf8')
// var decoder = new TextDecoder('utf8')
// const _hash = (x) =>
//   crypto.createHash('sha512').update(x).digest('hex').toLowerCase().substring(0, 64)
// var db = require('./add_Mongodb')
//
// const FAMILY_NAME = 'cert_issuer'
// const VERSION = '1.0'
// const NAMESPACE = _hash(FAMILY_NAME).substr(0, 6)
//
// const _decodeRequest = (payload) =>
//   new Promise((resolve, reject) => {
//     payload = payload.toString().split(',')
//
//     if (payload) {
//       resolve({
//         names: payload[0],
//         id: payload[1],
//         date: payload[2]
//       })
//     } else {
//       let reason = new InvalidTransaction('Invalid payload serialization')
//       reject(reason)
//     }
//   })
//
// const _toInternalError = (err) => {
//   console.log('in error message block')
//   let message = err.message ? err.message : err
//   throw new InternalError(message)
// }
//
// const createCert = (context, address, cert_data, txnid) => (possibleAddressValues) => {
//   let stateValueRep = possibleAddressValues[address]
//   let newData = {}
//   let data
//   var flag = 0
//
//   newData[txnid] = cert_data
//
//   if (stateValueRep === null || stateValueRep === '') {
//     console.log('Creating your first certificate')
//     console.log(newData)
//   } else {
//     data = decoder.decode(stateValueRep)
//     data = JSON.parse(data)
//     // console.log("Data " + data)
//     Object.keys(data).forEach(function (key) {
//       if (JSON.stringify(data[key]) === JSON.stringify(cert_data)) {
//         console.log('This certificate is already generated and will not be generated again')
//         flag = 1
//       }
//     })
//
//     if (flag === 0) {
//       data[txnid] = cert_data
//       // delete data[txnid]
//     }
//     newData = data
//     // console.log('All your certificates: ' + JSON.stringify(newData))
//     console.log('Your certificate is added to your namespace')
//   }
//
//   // Adding the certificate to database
//   if (flag === 0) {
//     var op = db.addData({
//       txnid: txnid,
//       data: cert_data,
//       expires: 'working'
//     })
//     console.log('op' + op)
//   }
//   return _setEntry(context, address, newData)
// }
//
// const _setEntry = (context, address, stateValue) => {
//   let entries = {
//     [address]: encoder.encode(JSON.stringify(stateValue))
//   }
//   return context.setState(entries)
// }
//
// class cert_issuer extends TransactionHandler {
//   constructor () {
//     super(FAMILY_NAME, [VERSION], NAMESPACE)
//   }
//
//   apply (transactionRequest, context) {
//     return _decodeRequest(transactionRequest.payload)
//       .catch(_toInternalError)
//       .then((update) => {
//         console.log('Transaction is processing')
//
//         let header = transactionRequest.header
//         let userPublicKey = header.signerPublicKey
//         let txnid = transactionRequest.signature
//
//         let cert_data = {
//           names: update.names,
//           id: update.id,
//           date: update.date
//         }
//
//         if (!update.names) {
//           throw new InvalidTransaction('There is no name')
//         }
//
//         let actionFn = createCert
//         let senderAddress = NAMESPACE + _hash(userPublicKey).slice(-64)
//
//         let getPromise = context.getState([senderAddress])
//         // Apply the action to the promise's result:
//         let actionPromise = getPromise.then(
//           // console.log("Calling the function")
//           actionFn(context, senderAddress, cert_data, txnid)
//         )
//
//         // Validate that the action promise results in the correctly set address:
//         // return
//         return actionPromise.then(addresses => {
//           if (addresses.length === 0) {
//             throw new InternalError('State Error!')
//           }
//           console.log(`Certificate is at the address: ${JSON.stringify(addresses)}`)
//         })
//       })
//   }
// }
// module.exports = cert_issuer
//
// // end
