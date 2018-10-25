<template>
  <div id='overview'>
    <div id="overview-head">
      <h1 id="overview-head-title">Data View</h1>
    </div>
    <video ref="videoloader" width="100%" height="90%" preload="auto" loop playsinline autoplay="true"></video>
    <div v-show="data != null" style="height: 94%" id="overview-vis-container">
      <!-- <tsne-vis v-if="overview === 'tsne'" id="tsne-vis-container" :overview-data="tsneData"></tsne-vis> -->
    </div>
    <div v-show="video_stream != false" >
        <button class="webcam_btn" @click="stopWebCam">Stop</button>
    </div>
    <div v-show="video_stream === false">
        <button id="startbutton" class="webcam_btn" @click="startWebCam">Start</button>
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
// import * as d3 from 'd3'

export default {
  name: 'OverView',
  mounted () {
    this.$nextTick(() => {
      this.initialize()
      // console.log(clmtrackr)
    })
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
      data: null,
      emotionData: null,
      vid: null,
      video_stream: false,
      ec: null,
      emotionmodel: null,
      model_svm: null,
      clmtracker: null
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

      if (navigator.mediaDevices) {
        navigator.mediaDevices
          .getUserMedia({ audio: true, video: true })
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
          { audio: true, video: true },
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

      this.ec = EmotionClassifier
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
    startTracking () {
      window.requestAnimFrame(this.startTracking)
      var cp = this.clmtracker.clm.getCurrentParameters()
      var er = this.ec.meanPredict(cp)
      if (er) {
        this.emotionData = er
        console.log(er[0].value)
      }
      // requestAnimFrame(this.startTracking())
    },
    startWebCam () {
      // check for camerasupport

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
  width: 30%;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  color: #fff;
  border: none;
  border-radius: 50px;
  background-image: linear-gradient(to right, #30dd8a, #2bb673);
  box-shadow: 0 1px 3px 0 rgba(23, 168, 108, 0.75);
  position: relative;
  left: 35%;
  top: -35px;
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
