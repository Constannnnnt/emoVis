# EmoVIS

## Prerequisite

### IBM Waston IM Services

1. Create two services at IBM Waston: Speech-to-Text & Tone-Analyzer

2. Create `config.js` in the `server` directory and put credentials in the `config.js` as follows.

```js
const config = {
    'speech_to_text': [{
        'credentials': {
            'url': ''
            'iam_apikey': ''
        }]
    }],
    'tone_analyzer': [{
        'credentials': {
            'url': '',
            'iam_apikey': ''
        },]
    }]
}

module.exports = config;

```

3. Generate Your Own Trusted LocalHost Certificate and put them at `server/src/keys/` to enable https at the localhost

```bash
openssl req -x509 -out localhost.crt -keyout localhost.key \
  -newkey rsa:2048 -nodes -sha256 \
  -subj '/CN=localhost' -extensions EXT -config <( \
   printf "[dn]\nCN=localhost\n[req]\ndistinguished_name = dn\n[EXT]\nsubjectAltName=DNS:localhost\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth")
```

## Usage

### Client

```bash
cd client
npm install
npm start
```

### Server

```bash
cd server
npm install
npm start
```

## TODO
    - redesign the radial chart
    - redesign the text cloud
    - redesign the flow chart
    - implement the control panel

## Acknowledgement

I don't have enough time and computing resources to train models for the facial emotion prediction and speech emotion recognition so I borrowed existing services.

The emotion model and classifier, as well as the landmark tracker are from [auduno/clmtrackr](https://github.com/auduno/clmtrackr).
The [speech-to-text](https://cloud.ibm.com/apidocs/speech-to-text) & [tone analyzer](https://cloud.ibm.com/apidocs/tone-analyzer) are from IBM Waston.

## Contributing

Feel free to implement anything from the roadmap, submit pull requests, create issues, discuss ideas or spread the word.

## License

MIT &copy; [Yuan Chen](https://github.com/constannnnnt)