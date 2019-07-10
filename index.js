const { TransactionProcessor } = require('sawtooth-sdk/processor')
const Handler = require('./cert_issuer')

const transactionProcessor = new TransactionProcessor('tcp://192.168.99.100:4004')

// Add Transaction Processor Handler to TP
transactionProcessor.addHandler(new Handler())

// Start Transaction Processor
transactionProcessor.start()
console.log('Transaction Started index')

process.on('SIGUSR2', () => {
  transactionProcessor._handleShutdown()
})
