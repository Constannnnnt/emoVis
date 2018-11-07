<template>
  <div id='textcloud'>
    <div id='textcloud-head'>
      <h1 id='textcloud-head-title'>Text Cloud</h1>
    </div>
    <div v-show='data !== null' style='height: 94%' id='textcloud-vis-container'>
      <!-- <tsne-vis v-if='overview === 'tsne'' id='tsne-vis-container' :overview-data='tsneData'></tsne-vis> -->
    </div>
    <div v-show='data === null'>
      No data loaded.
    </div>
  </div>
</template>

<script>
// import * as jQuery from 'jquery'
import PipeService from '@/services/pipe-service.js'
import * as d3 from 'd3'
import MicService from '@/services/mic-service.js'
// import d3Tip from 'd3-tip'

export default {
  name: 'TextCloud',
  mounted () {
    PipeService.$on(PipeService.SPEECH_DATA_CHANGE, (speechdata) => {
      this.initialzeCanvas()
      this.predictScore(speechdata).then((data) => {
        this.speechTone.push(data)
      })
      this.speechTone.push(this.configData)
      this.drawGraph()
    })
  },
  data () {
    return {
      data: null,
      configData: {
        'document_tone': {
          'tones': [{
            'score': 0.98445,
            'tone_id': 'analytical',
            'tone_name': 'Analytical'
          }]
        },
        'sentences_tone': [{
          'sentence_id': 0,
          'text': 'Team, I know that times are tough!',
          'tones': [{
            'score': 0.801827,
            'tone_id': 'analytical',
            'tone_name': 'Analytical'
          }]
        },
        {
          'sentence_id': 1,
          'text': 'Product',
          'tones': [{
            'score': 0.997482,
            'tone_id': 'analytical',
            'tone_name': 'Analytical'
          }]
        }]
      },
      speechTone: []
    }
  },
  methods: {
    initialzeCanvas () {
      d3.select('#textcloud-vis-container').selectAll('*').data([]).exit().remove()
    },
    async predictScore (text) {
      const response = await MicService.toneAnalyze({
        'tone_input': {'text': text},
        'content_type': 'application/json'
      })
      return response
    },
    drawGraph () {
      console.log(this.speechTone)
    }
  },
  components: {
  }
}
</script>

<style lang='stylus' scoped>

#textcloud
    height: 100%
    width: 34%
    display: inline-block
    vertical-align: top
    padding: 0
    margin: 5px
    border-left: 1px solid rgba(0, 0, 0, 0.4)

#textcloud-head
    vertical-align: top
    margin-bottom: 5px
    margin-left: 2px

#textcloud-head-title
    display: inline-block
    font-size: 16px

.radio-group
    display: inline-block
    margin-left: 10px

label
    margin-bottom: 0
h1
    margin-bottom: 0

</style>
