<template>
  <div id='textcloud'>
    <div id='textcloud-head'>
      <h1 id='textcloud-head-title'>Text Cloud</h1>
    </div>
    <div v-if='data === null'>
      No data loaded.
    </div>
    <div v-else-if='data !== null' id='transcript'>
        <span id='transcript-head'>Text:</span> {{data}}
    </div>
    <div style='height: 94%' id='textcloud-vis-container'>
      <!-- <tsne-vis v-if='overview === 'tsne'' id='tsne-vis-container' :overview-data='tsneData'></tsne-vis> -->
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
      this.data = speechdata
      // this.predictScore(speechdata).then((data) => {
      //   this.speechTone.push(data)
      // })
      this.speechTone.push(this.configData)
      this.generatePointLinks()
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
      speechTone: [],
      simulation: null,
      nodes: [],
      links: [],
      groups: {
        angry: [],
        fear: [],
        joy: [],
        sadness: [],
        analytical: [],
        confident: [],
        tentative: []
      },
      config: {
        margin: {
          left: 2
        },
        maxValue: 1,
        maxValueLength: 1,
        lineLength: 15,
        radiusLength: 5
      },
      emotionColor: {
        angry: '#cf000f',
        fear: '#ffcb05',
        joy: '#2ecc71',
        sadness: '#19b5fe',
        analytical: '#3a539b',
        confident: '#fad859',
        tentative: '#d2527f'
      }
    }
  },
  methods: {
    initialzeCanvas () {
      d3.select('#textcloud-vis-container').selectAll('*').data([]).exit().remove()
      if (this.simulation !== null) {
        this.simulation.stop()
      }
    },
    async predictScore (text) {
      const response = await MicService.toneAnalyze({
        'tone_input': {'text': text},
        'content_type': 'application/json'
      })
      return response
    },
    generatePointLinks () {
      const nodeinfo = this.speechTone[this.speechTone.length - 1]
      const id = this.data
      const keys = Object.keys(this.emotionColor)
      const randomgroup = keys[keys.length * Math.random() << 0]
      const parentnode = {
        'id': id,
        'group': randomgroup, // nodeinfo.document_tone.tones[0].tone_id,
        'score': nodeinfo.document_tone.tones[0].score,
        'idx': this.speechTone.length - 1
      }
      this.nodes.push(parentnode)
      this.groups[parentnode.group].push(parentnode)
      if (nodeinfo.sentences_tone.length !== 1) {
        nodeinfo.sentences_tone.forEach((n) => {
          const childnode = {
            'id': n.text,
            'group': randomgroup, // n.tones[0].tone_id,
            'score': n.tones[0].score,
            'idx': str(parentnode.idx) + '-' + n.text
          }
          this.nodes.push(childnode)
          const link = {
            'source': parentnode.id,
            'target': childnode.id,
            'score': 0
          }
          if (parentnode.group !== childnode.group) {
            link.score = Math.abs(parentnode.score - childnode.score)
          } else {
            link.score = Math.abs(parentnode.score + childnode.score)
          }
          this.links.push(link)
        })
      }
      const pnodes = this.nodes.filter((node) => instanceOf(node.idx) === Int)
      if (pnodes.length > 1 && this.groups[parentnode.group].length > 1) {
        if (pnodes[pnodes.length - 2].idx !== this.groups[parentnode.group][this.groups[parentnode.group].length - 2].idx) {
          const link1 = {
            'source': pnodes[pnodes.length - 2].id,
            'target': parentnode.id,
            'score': Math.abs(parentnode.score - pnodes[pnodes.length - 2].score)
          }
          const link2 = {
            'source': this.groups[parentnode.group][this.groups[parentnode.group].length - 2].id,
            'target': parentnode.id,
            'score': Math.abs(parentnode.score - this.groups[parentnode.group][this.groups[parentnode.group].length - 2].score)
          }

          this.links.push(link1)
          this.links.push(link2)
          console.log('1')
        } else {
          const link1 = {
            'source': pnodes[pnodes.length - 2].id,
            'target': parentnode.id,
            'score': Math.abs(parentnode.score - pnodes[pnodes.length - 2].score)
          }
          this.links.push(link1)
          console.log('2')
        }
      }
    },
    getGroupColor (group) {
      return this.emotionColor[group]
    },
    drawGraph () {
      const self = this
      const el = '#textcloud-vis-container'
      this.canvasWidth = document.querySelector('#textcloud-vis-container').clientWidth
      this.canvasHeight = document.querySelector('#textcloud-vis-container').clientHeight

      const svg = d3.select(el).append('svg')
        .attr('id', 'text-graph')
        .attr('viewBox', `0 0 ${this.canvasWidth * 0.95} ${this.canvasHeight * 0.95}`)
        .attr('width', this.canvasWidth)
        .attr('height', this.canvasHeight)
        // .on('dblclick.zoom', null)
      const lineScale = d3.scaleLinear().domain([0, this.config.maxValueLength]).range([0, this.config.lineLength])
      const radiusScale = d3.scaleLinear().domain([0, this.config.maxValue]).range([0, this.config.radiusLength])
      const g = svg.append('g')
        .attr('transform', 'translate(' + (this.canvasWidth / 2 + this.config.margin.left) + ',' + (this.canvasHeight / 2) + ')')

      this.simulation = d3.forceSimulation(this.nodes)
        .force('link', d3.forceLink(this.links).id(d => d.id).distance(d => lineScale(d.score)))
        .force('charge', d3.forceManyBody())
        .force('x', d3.forceX())
        .force('y', d3.forceY())
        // .force("center", d3.forceCenter())
        .on('tick', ticked)

      const link = g.append('g')
        .attr('stroke', '#999')
        .attr('stroke-opacity', 0.6)
        .selectAll('line')
        .data(this.links)
        .enter()
        .append('line')
        .attr('stroke-width', 0.6)

      const node = g.append('g')
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5)
        .selectAll('circle')
        .data(this.nodes)
        .enter()
        .append('circle')
        .attr('id', d => d.id)
        .attr('r', d => radiusScale(d.score))
        .attr('fill', d => this.getGroupColor(d.group))
        .call(d3.drag()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended))

      // node.append('title')
      //   .text(d => d.id)

      function dragstarted (d) {
        if (!d3.event.active) self.simulation.alphaTarget(0.3).restart()
        d.fx = d.x
        d.fy = d.y
      }

      function dragged (d) {
        d.fx = d3.event.x
        d.fy = d3.event.y
      }

      function dragended (d) {
        if (!d3.event.active) self.simulation.alphaTarget(0)
        d.fx = null
        d.fy = null
      }

      function ticked () {
        link
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y)

        node
          .attr('cx', d => d.x)
          .attr('cy', d => d.y)
      }
    }
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
    margin-left: 2px
    margin-bottom: 5px

#transcript
    margin-left: 4px

#transcript-head
    font-size: 14px

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
