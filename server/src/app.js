const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const morgan = require('morgan')
const ToneAnalyzerV3 = require('watson-developer-cloud/tone-analyzer/v3')
const IamTokenManagerV1 = require('watson-developer-cloud/iam-token-manager/v1')

const app = express()
app.use(morgan('combined'))
app.use(bodyParser.json())

// Set up environment variables
let config = null
try {
  config = require("../config")
} catch (e) {}

// on bluemix, enable rate-limiting and force https
if (process.env.VCAP_SERVICES) {
  // enable rate-limiting
  const RateLimit = require('express-rate-limit')
  app.enable('trust proxy') // required to work properly behind Bluemix's reverse proxy

  const limiter = new RateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    delayMs: 0 // disable delaying - full speed until the max limit is reached
  })

  //  apply to /api/*
  app.use('/api/', limiter)

  // force https - microphone access requires https in Chrome and possibly other browsers
  // (*.mybluemix.net domains all have built-in https support)
  const secure = require('express-secure-only')
  app.use(secure())
}

app.use(express.static(__dirname + '/static'))
app.use(cors())

// console.log(express.static(__dirname + '/public'))

// Configure Watson Speech to Text service
var speechCreds = getServiceCreds(config, 'moods-stt')

// // Configure Watson Speech to Text service
var toneCreds = getServiceCreds(config, 'tone-analyzer-moods')


// Create the token manager
let tokenManager
const serviceUrl = process.env.SPEECH_TO_TEXT_URL || speechCreds[0].credentials.url


tokenManager = new IamTokenManagerV1.IamTokenManagerV1({
  iamApikey: process.env.SPEECH_TO_TEXT_IAM_APIKEY || speechCreds[0].credentials.iam_apikey,
  iamUrl: process.env.SPEECH_TO_TEXT_IAM_URL || 'https://iam.bluemix.net/identity/token',
})

// Create the service wrapper
const toneAnalyzer = new ToneAnalyzerV3({
  version: '2017-09-21',
  iam_apikey: toneCreds[0].credentials.iam_apikey,
  url: toneCreds[0].credentials.url
})


// Get credentials using your credentials
app.use('/api/token', (req, res, next) => {
  tokenManager.getToken((err, token) => {
    if (err) {
      next(err)
    } else {
      let credentials = token
      res.send(credentials)
    }
  })
})

app.post('/api/tone', (req, res, next) => {
  toneAnalyzer.tone(req.body, (err, data) => {
    if (err) {
      return next(err)
    }
    return res.json(data)
  })
})

require('./error-handler')(app)

const port = process.env.PORT || process.env.VCAP_APP_PORT || 8081

app.listen(port, function () {
  console.log('Client App & Token server lives at http://localhost:%s/', port)
})

function getServiceCreds(config, serviceName) {
  var serviceCreds = null
  Object.keys(config).forEach((key) => {
    if (config[key][0].name == serviceName) {
      serviceCreds = config[key]
    }
  })
  if (!serviceCreds) {
    console.log("service " + serviceName + " not bound to this application")
    return null
  }
  return serviceCreds
}

if (!process.env.VCAP_SERVICES) {
  const fs = require('fs')
  const https = require('https')
  const HTTPS_PORT = 8082

  const options = {
    key: fs.readFileSync(__dirname + '/keys/localhost.key'),
    cert: fs.readFileSync(__dirname + '/keys/localhost.crt')
  }
  https.createServer(options, app).listen(HTTPS_PORT, function () {
    console.log('Secure server live at https://localhost:%s/', HTTPS_PORT)
  })
}