const gnosis = require("gnosisjs");
const configObject = require("./config.js");
const BigNumber = require('bignumber.js');
const QRProvider = require('./uportQRProvider.js');
const ProviderEngine = require('web3-provider-engine');
const RpcSubprovider = require('web3-provider-engine/subproviders/rpc.js')
const Web3 = require('web3');
const engine = new ProviderEngine();
const web3 = new Web3(engine);
const qrImage = require('qr-image');

if (process.argv.length != 5) {
  process.exit();
}

// Set web3
web3.eth.defaultAccount = '0xB42E70a3c6dd57003f4bFe7B06E370d21CDA8087'
engine.addProvider(new QRProvider());
engine.addProvider(new RpcSubprovider({
 rpcUrl: configObject.ethereumNodeURL,
}));
configObject.web3 = web3;
engine.start();

let marketAddress = process.argv[4];
let marketHash = process.argv[2];
let outcomeIndex = new BigNumber(process.argv[3]);
let numberOfShares = new BigNumber(1).mul(new BigNumber('1e18'));

gnosis.contracts.marketFactory.getMarketsProcessed(
  [marketHash],
  configObject,
  marketAddress
).then((response) => {
  let globalResponse = {};
  let market = response[marketHash];
  let shares = market.shares;
  let initialFunding = market.initialFunding;

  // get QR transaction string
  gnosis.contracts.marketFactory.buyShares(
    marketHash,
    outcomeIndex,
    new BigNumber("1e18"),
    new BigNumber("1e23"),
    configObject,
    marketAddress
  ).then(
    (tx) => {
      let uportTx = tx.txhash;
      let pngBuffer = qrImage.imageSync(uportTx, {type: 'png'});
      globalResponse.imageString = pngBuffer.toString('base64');
      globalResponse.priceAfterBuying = gnosis.marketMaker.calcPrice(shares, outcomeIndex, initialFunding).toNumber();
      globalResponse.priceAfterBuying = globalResponse.priceAfterBuying.toPrecision(Math.ceil(Math.log(globalResponse.priceAfterBuying)/Math.log(10))+3)
      console.log(JSON.stringify(globalResponse));
    }
  );


});
