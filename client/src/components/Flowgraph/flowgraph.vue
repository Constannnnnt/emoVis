<template>
  <div id='flowgraph'>
    <div id='flowgraph-head'>
      <h1 id='flowgraph-head-title'>Flow View</h1>
    </div>
    <div v-if='data.speech.length === 0 && data.emotion.length === 0'>
      No data loaded.
    </div>
    <div style='height: 96%' id='flowgraph-vis-container'>
    </div>
  </div>
</template>

<script>
// import * as jQuery from 'jquery'
import PipeService from '@/services/pipe-service.js'
import * as d3 from 'd3'

export default {
  name: 'FlowGraph',
  mounted () {
    // this.$nextTick(() => {
    //   this.initializeCanvas()
    // })
    PipeService.$on(PipeService.EMOTION_DATA_CHANGE, (emotiondata) => {
      this.emotionData = emotiondata
    })
    PipeService.$on(PipeService.SPEECH_CHANGE, (speechdata) => {
      this.speechData = speechdata
      // console.log(this.speechData)
      // this.addData()
      // this.drawTrend()
      if (!this.initial) this.initializeCanvas()
      if (this.emotionData !== null) this.addData()
      if (this.emotionData !== null) this.drawTrend()
    })
  },
  data () {
    return {
      data: {
        emotion: [],
        speech: []
      },
      initial: false,
      emotionData: null,
      speechData: null,
      config: {
        margin: {
          left: 2,
          top: 2,
          bottom: 2
        },
        maxScore: 1
      },
      ceiling: 220,
      ceilingS: 220,
      SpeechPropertyNames: ['angry', 'fear', 'joy', 'sadness', 'analytical', 'confident', 'tentative'],
      EmotionPropertyNames: ['angry', 'disgusted', 'fear', 'neural', 'sad', 'surprised', 'joy'],
      emotionColor: {
        angry: '#cf000f',
        disgusted: '#8c14fc',
        fear: '#ffcb05',
        neural: '#e4e9ed',
        sad: '#19b5fe',
        surprised: '#fef160',
        joy: '#2ecc71'
      },
      speechColor: {
        angry: '#cf000f',
        fear: '#ffcb05',
        joy: '#2ecc71',
        sadness: '#19b5fe',
        analytical: '#3a539b',
        confident: '#e87e04',
        tentative: '#d2527f'
      }
    }
  },
  methods: {
    initializeCanvas () {
      d3.select('#flowgraph-vis-container').selectAll('*').data([]).exit().remove()
      const el = '#flowgraph-vis-container'
      this.canvasWidth = document.querySelector('#flowgraph-vis-container').clientWidth
      this.canvasHeight = document.querySelector('#flowgraph-vis-container').clientHeight
      this.ceiling = Math.floor(this.canvasHeight / 3)
      this.ceilingS = Math.floor(this.canvasHeight / 7)

      const svg = d3.select(el).append('svg')
        .attr('id', 'flow-graph')
        // .attr('viewBox', `${0} ${0} ${this.canvasWidth} ${this.canvasHeight}`)
        .attr('width', this.canvasWidth)
        .attr('height', this.canvasHeight)

      // top stacked chart for emotion
      svg.append('g')
        .attr('id', 'topG')
        .attr('class', 'ebarChart')
        .attr('transform', 'translate(' + (0) + ',' + (this.canvasHeight / 2 - this.config.margin.bottom) + ')')

      // bottom stacked chart for speech
      svg.append('g')
        .attr('id', 'botG')
        .attr('class', 'sbarChart')
        .attr('transform', 'translate(' + (0) + ',' + (this.canvasHeight / 2 + this.config.margin.top) + ')')

      this.initial = true
    },
    sumSpeechData (sd) {
      let sobj = {'angry': {'cnt': 0, 'val': 0.0},
        'fear': {'cnt': 0, 'val': 0.0},
        'joy': {'cnt': 0, 'val': 0.0},
        'sadness': {'cnt': 0, 'val': 0.0},
        'analytical': {'cnt': 0, 'val': 0.0},
        'confident': {'cnt': 0, 'val': 0.0},
        'tentative': {'cnt': 0, 'val': 0.0}}
      console.log(sd)
      if (sd.sentences_tone !== undefined) {
        sd.sentences_tone.forEach((tone) => {
          sobj[tone.tones[0].tone_id].val += tone.tones[0].score
          sobj[tone.tones[0].tone_id].cnt += 1
        })
      } else {
        sd.document_tone.tones.forEach((tone) => {
          sobj[tone.tone_id].val += tone.score
          sobj[tone.tone_id].cnt += 1
        })
      }

      return sobj
    },
    addData () {
      const s = JSON.parse(JSON.stringify(this.speechData))
      const e = JSON.parse(JSON.stringify(this.emotionData))
      const ed = {
        idx: s.idx,
        value: e
      }
      const sobj = this.sumSpeechData(s)
      console.log(sobj)
      let sv = []
      for (let index in this.SpeechPropertyNames) {
        const d = {
          'emotion': this.SpeechPropertyNames[index],
          'value': sobj[this.SpeechPropertyNames[index]].val / sobj[this.SpeechPropertyNames[index]].cnt
        }
        sv.push(d)
      }
      const sd = {
        idx: s.idx,
        value: sv
      }
      // ed['idx'] = this.data.emotion.length
      this.data.speech.push(sd)
      this.data.emotion.push(ed)
      this.emotionData = ed
      this.speechData = sd
    },
    computeBarHeight (score) {
      // Y scale will fit values from 0-1 within pixels 0 - height
      const y = d3.scaleLinear().domain([0, this.config.maxScore]).range([0, this.ceiling])
      return y(score)
    },
    computeBarHeightS (score) {
      const y = d3.scaleLinear().domain([0, this.config.maxScore]).range([0, this.ceilingS])
      return y(score)
    },

    /*
    * Function to calculate the Y position of a bar
    */
    barY (index) {
      /*
      * Determine the baseline by summing the previous values in the data array.
      * There may be a cleaner way of doing this with d3.layout.stack() but it
      * wasn't obvious how to do so while playing with it.
      */
      let baseline = 0
      const ed = JSON.parse(JSON.stringify(this.emotionData.value))
      for (let j = 0; j < index; j++) {
        baseline = baseline + ed[j].value
      }
      // make the y value negative 'height' instead of 0 due to origin moved to bottom-left
      return -this.computeBarHeight(baseline + ed[index].value)
    },
    barYS (index) {
      /*
      * Determine the baseline by summing the previous values in the data array.
      * There may be a cleaner way of doing this with d3.layout.stack() but it
      * wasn't obvious how to do so while playing with it.
      */
      let baseline = 0
      const sd = JSON.parse(JSON.stringify(this.speechData.value))
      for (let j = 0; j < index; j++) {
        baseline = baseline + sd[j].value
      }
      // make the y value negative 'height' instead of 0 due to origin moved to bottom-left
      return this.computeBarHeightS(baseline + sd[index].value)
    },
    barHeight (ele) {
      return this.computeBarHeight(ele.value)
    },
    barHeightS (ele) {
      return this.computeBarHeightS(ele.value)
    },
    updateBarWidthsAndPlacement (chartId) {
      /**
      * Since we dynamically add/remove bars we can't use data indexes but must determine how
      * many bars we have already in the graph to calculate x-axis placement
      */
      const numBars = d3.selectAll('.ebar').size() + 1

      // determine what the width of all bars should be
      let barWidth = this.canvasWidth / numBars
      if (barWidth > 25) {
        barWidth = 25
      }

      // reset the width and x position of each bar to fit
      const barNodes = document.querySelectorAll(('.ebar'))
      for (let i = 0; i < barNodes.length; i++) {
        d3.select(barNodes.item(i)).selectAll('rect')
          // .transition().duration(10) // animation makes the display choppy, so leaving it out
          .attr('x', i * barWidth)
          .attr('width', (barWidth - 1))
      }

      return {'barWidth': barWidth, 'numBars': numBars}
    },
    drawTrend () {
      const existingBarNode = document.querySelectorAll('#topG_' + JSON.parse(JSON.stringify(this.emotionData.idx)))
      const existingBarNodeS = document.querySelectorAll('#botG_' + JSON.parse(JSON.stringify(this.speechData.idx)))

      // the barnode already exists
      if (existingBarNode.length > 0 || existingBarNodeS.length > 0) {
        const existingBar = d3.select('#topG_' + JSON.parse(JSON.stringify(this.emotionData.idx)))
        const existingBarS = d3.select('#botG_' + JSON.parse(JSON.stringify(this.speechData.idx)))

        // reset the decay since we received an update
        existingBar.transition().duration(100)
          .attr('style', 'opacity:1.0')
        existingBarS.transition().duration(100)
          .attr('style', 'opacity:1.0')

        // update the data on each data point defined by 'propertyNames'
        const ed = JSON.parse(JSON.stringify(this.emotionData.value))
        ed.forEach((ele, index) => {
          existingBar.select('rect.' + ele.emotion)
            // .transition().ease('linear'.duration(300))
            .attr('y', this.barY(index))
            .attr('height', this.barHeight(ele))
        })

        const sd = JSON.parse(JSON.stringify(this.speechData.value))
        sd.forEach((ele, index) => {
          existingBarS.select('rect.' + ele.emotion)
            // .transition().ease('linear'.duration(300))
            .attr('y', this.barYS(index))
            .attr('height', this.barHeightS(ele))
        })
      } else {
        // it's new data so add a bar
        const barDimensions = this.updateBarWidthsAndPlacement('topG')
        const barDimensionsS = this.updateBarWidthsAndPlacement('botG')

        // select the chart and add the new bar
        const barGroup = d3.select('#topG')
          .append('g')
          .attr('class', 'ebar')
          .attr('id', 'topG_' + JSON.parse(JSON.stringify(this.emotionData.idx)))
          .attr('style', 'opacity:1.0')

        const barGroupS = d3.select('#botG')
          .append('g')
          .attr('class', 'sbar')
          .attr('id', 'botG_' + JSON.parse(JSON.stringify(this.speechData.idx)))
          .attr('style', 'opacity:1.0')

        // now add each data point to the stack of this bar
        // for (const index in this.EmotionPropertyNames) {
        const ed = JSON.parse(JSON.stringify(this.emotionData.value))
        ed.forEach((ele, index) => {
          barGroup.append('rect')
            .attr('class', ele.emotion)
            .attr('width', (barDimensions.barWidth - 1))
            .attr('x', (barDimensions.numBars - 1) * barDimensions.barWidth)
            .attr('y', this.barY(index))
            .attr('height', this.barHeight(ele))
            .attr('fill', this.emotionColor[ele.emotion])
        })

        const sd = JSON.parse(JSON.stringify(this.speechData.value))
        sd.forEach((ele, index) => {
          barGroupS.append('rect')
            .attr('class', ele.emotion)
            .attr('width', (barDimensionsS.barWidth - 1))
            .attr('x', (barDimensionsS.numBars - 1) * barDimensionsS.barWidth)
            .attr('y', this.barYS(index) - this.barHeightS(ele))
            .attr('height', this.barHeightS(ele))
            .attr('fill', this.speechColor[ele.emotion])
        })
        // }
      }
    }
  },
  components: {
  }
}
</script>

<style lang='stylus' scoped>

#flowgraph
    height: 100%
    width: 100%
    display: inline-block
    vertical-align: top
    padding: 0
    margin: 5px

#flowgraph-head
    vertical-align: top
    margin-bottom: 5px
#flowgraph-head-title
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
