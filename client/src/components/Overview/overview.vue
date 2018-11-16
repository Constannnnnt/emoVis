<template>
  <div id='overview'>
    <div id="overview-head">
      <h1 id="overview-head-title">Data View</h1>
    </div>
    <video ref="videoloader" width="100%" height="90%" preload="auto" loop playsinline autoplay="true"></video>
    <!-- <div v-show="data != null" style="height: 94%" id="overview-vis-container">
      <tsne-vis v-if="overview === 'tsne'" id="tsne-vis-container" :overview-data="tsneData"></tsne-vis>
    </div> -->
    <div class="row" style="border-bottom: none">
       <div style="margin-right: 15px;" v-if="video_stream === false">
          <button id="camstart" class="webcam_btn" @click="startWebCam">StartCam</button>
      </div>
      <div style="margin-right: 15px;" v-else-if="video_stream !== false">
          <button id="camstop" class="webcam_btn" @click="stopWebCam">StopCam</button>
      </div>
      <div style="margin-left: 50px;" v-if="audio_stream === false">
          <button id="micstrat" class="webcam_btn" @click="startMic">StartMic</button>
      </div>
      <div style="margin-left: 50px;" v-else-if="audio_stream != false">
          <button id="micstop" class="webcam_btn">StopMic</button>
      </div>
    </div>
  </div>
</template>

<script>
// import * as jQuery from 'jquery'
// import * as utils from '@/js/utils.js'
import EmotionClassifier from '@/js/emotion_classifier.js'
import EmotionModel from '@/js/emotionmodel.js'
import ModelSvm from '@/js/model_pca_20_svm.js'
import * as Clm from '@/js/clmtrackr.js'
import PipeService from '@/services/pipe-service.js'
// import SpeechToTextV1 from 'watson-developer-cloud/speech-to-text/v1'
import recognizeMic from 'watson-speech/speech-to-text/recognize-microphone'
// import MicService from '@/services/micService.js'
// import * as d3 from 'd3'

export default {
  name: 'OverView',
  mounted () {
    this.$nextTick(() => {
      this.initialize()
      // console.log(clmtrackr)
    })
    const self = this
    window.setInterval(function () {
      self.checkText()
    }, 2000)
    window.requestAnimFrame = (function () {
      return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
      function (/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
        return window.setTimeout(callback, 1000 / 60)
      }
    })()
    window.cancelRequestAnimFrame = (function () {
      return window.cancelAnimationFrame ||
        window.webkitCancelRequestAnimationFrame ||
        window.mozCancelRequestAnimationFrame ||
        window.oCancelRequestAnimationFrame ||
        window.msCancelRequestAnimationFrame ||
        window.clearTimeout
    })()
  },
  data () {
    return {
      vid: null,
      video_stream: false,
      audio_stream: false,
      mic_stream: false,
      ec: null,
      text: 'Team, I know that times are tough! Product',
      prev_text: 'no I dont think so',
      emotionmodel: null,
      model_svm: null,
      clmtracker: null,
      config: {
        defaultEmotion: {
          angry: 0.08397069950229145,
          disgusted: 0.09125459367999424,
          fear: 0.0318136816810977,
          sad: 0.061685934012758334,
          surprised: 0.054805339314313764,
          happy: 0.18574235649383983
        }
      }
    }
  },
  methods: {
    legacyGetUserMediaSupport () {
      return constraints => {
        // First get ahold of the legacy getUserMedia, if present
        let getUserMedia =
          navigator.getUserMedia ||
          navigator.webkitGetUserMedia ||
          navigator.mozGetUserMedia ||
          navigator.msGetUserMedia ||
          navigator.oGetUserMedia
        // Some browsers just don't implement it - return a rejected promise with an error
        // to keep a consistent interface
        if (!getUserMedia) {
          return Promise.reject(
            new Error('getUserMedia is not implemented in this browser')
          )
        }
        // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
        return new Promise(function (resolve, reject) {
          getUserMedia.call(navigator, constraints, resolve, reject)
        })
      }
    },
    initialize () {
      navigator.getUserMedia =
        navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia
      window.URL =
        window.URL || window.webkitURL || window.msURL || window.mozURL

      // this.vid.addEventListener("canplay", this.enableStart(), false);
      if (navigator.mediaDevices === undefined) {
        navigator.mediaDevices = {}
      }
      if (navigator.mediaDevices.getUserMedia === undefined) {
        navigator.mediaDevices.getUserMedia = this.legacyGetUserMediaSupport()
      }

      this.ec = EmotionClassifier
      // delete EmotionModel['disgusted']
      // delete EmotionModel['fear']
      this.ec.emotionClassifier()
      this.emotionmodel = EmotionModel
      this.model_svm = ModelSvm
      this.clmtracker = Clm

      this.model_svm.pModel.shapeModel.nonRegularizedVectors.push(9)
      this.model_svm.pModel.shapeModel.nonRegularizedVectors.push(11)

      this.clmtracker.clm.tracker({useWebGL: true})
      this.clmtracker.clm.init(this.model_svm.pModel)
      this.ec.emotionClassifier()
      this.ec.init(this.emotionmodel.emotionModel)
      this.emotionData = this.ec.getBlank()
    },
    checkDefaultEmotions (er) {
      let erflag = false
      er.forEach((e) => {
        if (Math.abs(this.config.defaultEmotion[e.emotion] - e.value) < 0.01) {
          erflag = true
        }
      })
      return erflag
    },
    startTracking () {
      if (this.video_stream) window.requestAnimFrame(this.startTracking)
      var cp = this.clmtracker.clm.getCurrentParameters()
      var er = this.ec.meanPredict(cp)
      if (er) {
        PipeService.$emit(PipeService.EMOTION_DATA_CHANGE, er)
      }
    },
    checkText () {
      // if (this.prev_text !== this.text) {
      this.prev_text = this.text
      const text = this.text
      PipeService.$emit(PipeService.SPEECH_DATA_CHANGE, text)
      // }
    },
    stopMic () {
      this.audio_stream = false
    },
    startMic () {
      fetch('http://localhost:8081/api/token')
        .then((response) => {
          return response.text()
        }).then((token) => {
          const stream = recognizeMic({
            access_token: token,
            objectMode: true, // send objects instead of text
            extractResults: true, // convert {results: [{alternatives:[...]}], result_index: 0} to {alternatives: [...], index: 0}
            format: false // optional - performs basic formatting on the results such as capitals an periods
          })

          /**
           * Prints the users speech to the console
           * and assigns the text to the state.
           */
          this.audio_stream = true
          stream.on('data', (data) => {
            // this.setState({
            //   text: data.alternatives[0].transcript
            // })
            this.text = data.alternatives[0].transcript
          })
          stream.on('error', (err) => {
            console.log(err)
          })

          const self = this
          console.log(self)
          document.querySelector('#micstop').onclick = function () {
            self.audio_stream = false
            return stream.stop.bind(stream)
          }
        }).catch((err) => {
          console.log(err)
        })
    },
    startWebCam () {
      // check for camerasupport
      if (navigator.mediaDevices) {
        navigator.mediaDevices
          .getUserMedia({ video: true })
          .then(stream => {
            if ('srcObject' in this.$refs.videoloader) {
              this.$refs.videoloader.srcObject = stream
            } else {
              this.$refs.videoloader.src =
                window.URL && window.URL.createObjectURL(stream)
            }
          })
          .catch(err => {
            alert(
              'There was some problem trying to fetch video from your webcam. If you have a webcam, please make sure to accept when the browser asks for access to your webcam.' + err
            )
          })
      } else if (navigator.getUserMedia) {
        navigator.getUserMedia(
          { video: true },
          stream => {
            if ('srcObject' in this.$refs.videoloader) {
              this.$refs.videoloader.srcObject = stream
            } else {
              this.$refs.videoloader.src =
                window.URL && window.URL.createObjectURL(stream)
            }
          },
          err => {
            alert(
              'There was some problem trying to fetch video from your webcam. If you have a webcam, please make sure to accept when the browser asks for access to your webcam.' + err
            )
          }
        )
      } else {
        alert(
          'This demo depends on getUserMedia, which your browser does not seem to support. :('
        )
      }

      this.clmtracker.clm.start(this.$refs.videoloader)

      this.video_stream = true

      this.startTracking()
    },
    stopWebCam () {
      if (this.$refs.videoloader != null && this.$refs.videoloader.srcObject) {
        let stream = this.$refs.videoloader.srcObject
        let tracks = stream.getTracks()

        tracks.forEach(track => {
          track.stop()
          this.$refs.videoloader.srcObject = null
        })
        this.video_stream = false
      }
      this.clmtracker.clm.stop()
      this.clmtracker.clm.reset()
    }
  },
  components: {}
}
</script>

<style lang='stylus' scoped>
#overview {
  height: 100%;
  width: 28%;
  display: inline-block;
  vertical-align: top;
  padding: 0;
  margin: 5px;
}

#overview-head {
  vertical-align: top;
  margin-bottom: 5px;
}

#overview-head-title {
  display: inline-block;
  font-size: 16px;
}

.webcam_btn {
  -webkit-box-sizing: border-box;
  -moz-box-sizing: border-box;
  box-sizing: border-box;
  text-align: center;
  width: 100%;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  color: #fff;
  border: none;
  border-radius: 50px;
  background-image: linear-gradient(to right, #30dd8a, #2bb673);
  box-shadow: 0 1px 3px 0 rgba(23, 168, 108, 0.75);
  position: relative;
  top: -35px;
  left: 72px;
}

#video-loader {
  -o-transform: scaleX(-1);
  -webkit-transform: scaleX(-1);
  transform: scaleX(-1);
  -ms-filter: fliph; /* IE */
  filter: fliph; /* IE */
}

.radio-group {
  display: inline-block;
  margin-left: 10px;
}

label {
  margin-bottom: 0;
}

h1 {
  margin-bottom: 0;
}
</style>
