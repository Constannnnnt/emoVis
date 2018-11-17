<template>
  <div id='textcloud' ref='cloudcanvas'>
    <div id='textcloud-head'>
      <h1 id='textcloud-head-title'>Text Cloud</h1>
    </div>
    <div v-if='data === null'>
      No data loaded.
    </div>
    <div v-else-if='data !== null' id='transcript'>
        <span id='transcript-head'>Text:</span> {{data}}
    </div>
    <div style='height: 90%;' id='textcloud-vis-container'>
      <!-- <tsne-vis v-if='overview === 'tsne'' id='tsne-vis-container' :overview-data='tsneData'></tsne-vis> -->
    </div>
  </div>
</template>

<script>
// import * as jQuery from 'jquery'
import PipeService from '@/services/pipe-service.js'
import * as d3 from 'd3'
import MicService from '@/services/mic-service.js'
import d3Tip from 'd3-tip'

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
      dbclicked: [],
      clicked: [],
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
        confident: '#e87e04',
        tentative: '#d2527f'
      },
      hoverViewLength: 150
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
        nodeinfo.sentences_tone.forEach((n, i) => {
          const childnode = {
            'id': n.text,
            'group': randomgroup, // n.tones[0].tone_id,
            'score': n.tones[0].score,
            'idx': (parentnode.idx).toString() + '-' + i.toString()
          }
          this.nodes.push(childnode)
          const link = {
            'source': parentnode.idx,
            'target': childnode.idx,
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

      const pnodes = this.nodes.filter((node) => typeof (node.idx) !== 'string')
      if (pnodes.length > 1) {
        if (this.groups[parentnode.group].length > 1) {
          if (pnodes[pnodes.length - 2].idx !== this.groups[parentnode.group][this.groups[parentnode.group].length - 2].idx) {
            const link1 = {
              'source': parentnode.idx,
              'target': pnodes[pnodes.length - 2].idx,
              'score': Math.abs(parentnode.score - pnodes[pnodes.length - 2].score)
            }
            const link2 = {
              'source': parentnode.idx,
              'target': this.groups[parentnode.group][this.groups[parentnode.group].length - 2].idx,
              'score': Math.abs(parentnode.score - this.groups[parentnode.group][this.groups[parentnode.group].length - 2].score)
            }

            this.links.push(link1)
            this.links.push(link2)
          } else {
            const link1 = {
              'source': parentnode.idx,
              'target': pnodes[pnodes.length - 2].idx,
              'score': Math.abs(parentnode.score - pnodes[pnodes.length - 2].score)
            }
            this.links.push(link1)
          }
        } else {
          const link1 = {
            'source': parentnode.idx,
            'target': pnodes[pnodes.length - 2].idx,
            'score': Math.abs(parentnode.score - pnodes[pnodes.length - 2].score)
          }
          this.links.push(link1)
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
        .attr('viewBox', `${0} ${0} ${this.canvasWidth} ${this.canvasHeight}`)
        .attr('width', this.canvasWidth)
        .attr('height', this.canvasHeight)
        // .style('border-right', '1px solid rgba(0, 0, 0, 0.4)')
        // .on('dblclick.zoom', null)
      const lineScale = d3.scaleLinear().domain([0, this.config.maxValueLength]).range([0, this.config.lineLength])
      const radiusScale = d3.scaleLinear().domain([0, this.config.maxValue]).range([0, this.config.radiusLength])
      const parentRadiusScale = d3.scaleLinear().domain([0, this.config.maxValue]).range([0, this.config.radiusLength * 1.5])
      const g = svg.append('g')
        .attr('transform', 'translate(' + (this.canvasWidth * 0.9 / 2 + this.config.margin.left) + ',' + (this.canvasHeight / 2) + ')')

      const Format = d3.format('.2%')

      const tip = d3Tip().attr('class', 'd3-tip').html((nd) => {
        let str
        if (nd.id !== undefined) {
          str = `<div class="d3-tip" style="text-align: left; min-width: 50px; padding-top: 2px; padding-bottom: 2px;
            padding-left: 4px; padding-right: 4px; background-color: #3a3a3c; color: #ffffff; border: 1px solid #3a3a3c; border-radius: 5px;
            font-size: 12px; z-index: 5; left: ${d3.event.x}px; top: ${d3.event.y}px">text: ${nd.id}`
        }
        str += `</br>group: ${(nd.group)}`
        str += `</br>score: ${Format(nd.score)}</div>`
        return str
      })

      d3.select(this.$refs.cloudcanvas).select('svg').call(tip)

      this.simulation = d3.forceSimulation(this.nodes)
        .force('link', d3.forceLink(this.links).id(d => d.idx).distance(d => lineScale(d.score)))
        .force('charge', d3.forceManyBody().distanceMax(200))
        .force('x', d3.forceX())
        .force('y', d3.forceY())
        // .force('center', d3.forceCenter())
        .on('tick', ticked)

      // add indicators
      const indicatorG = svg.append('g')
        .attr('transform', 'translate(' + (this.canvasWidth * 0.87 + this.config.margin.left) + ',' + (0) + ')')

      const emoColorArr = Object.keys(this.emotionColor).map((key) => {
        return [key, this.emotionColor[key]]
      })

      const indicatorGnum = svg.append('g')
        .attr('transform', 'translate(' + (this.canvasWidth * 0.87 + this.config.margin.left + 62) + ',' + (0) + ')')

      indicatorG.append('g')
        .selectAll('rect')
        .data(emoColorArr)
        .enter()
        .append('rect')
        .attr('y', (d, i) => (i + 1) * 40 - 12)
        .attr('width', 60)
        .attr('height', 15)
        .attr('fill', (d) => d[1])
        .attr('fill-opacity', 0.8)

      indicatorG.append('g')
        .selectAll('text')
        .data(emoColorArr)
        .enter()
        .append('text')
        .text((d) => d[0])
        // .attr('fill', 'white')
        .attr('x', 4)
        .attr('stroke-width', `2em`)
        .attr('fill', 'white')
        .attr('y', (d, i) => (i + 1) * 40)

      indicatorGnum.append('g')
        .selectAll('text')
        .data(emoColorArr)
        .enter()
        .append('text')
        .text((d) => this.groups[d[0]].length)
        // .attr('fill', 'white')
        .attr('x', 2)
        .attr('stroke-width', `2em`)
        .attr('fill', 'grey')
        .attr('y', (d, i) => (i + 1) * 40)

      // add nodes and links
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
        .attr('class', d => d.group)
        .attr('id', d => 'idx' + '-' + d.idx)
        .attr('r', (d) => {
          if (typeof (d.idx) === 'number') {
            return parentRadiusScale(d.score)
          } else {
            return radiusScale(d.score)
          }
        })
        .attr('fill', d => this.getGroupColor(d.group))
        .attr('fill-opacity', 0.8)
        .on('mouseover', function (d) {
          tip.show(d, this)
        })
        .on('mouseleave', () => {
          tip.hide()
        })
        .on('click', (d) => {
          if (self.clicked.length !== 0) {
            if (self.clicked[0].idx === d.idx) {
              d3.selectAll('circle').attr('fill-opacity', 0.8)
              self.clicked.splice(-1, 1)
            } else {
              d3.selectAll('circle').attr('fill-opacity', 0.2)
              d3.select(`#${'idx' + '-' + d.idx}`).attr('fill-opacity', 0.8)
              self.links.forEach((l) => {
                if (l.source.idx === d.idx && typeof (l.target.idx) === 'number') {
                  d3.select(`#${'idx' + '-' + l.target.idx}`).attr('fill-opacity', 0.8)
                }
                if (l.target.idx === d.dix && typeof (l.source.idx) === 'number') {
                  d3.select(`#${'idx' + '-' + l.source.idx}`).attr('fill-opacity', 0.8)
                }
              })
              self.clicked.splice(-1, 1)
              self.clicked.push(d)
            }
          } else {
            d3.selectAll('circle').attr('fill-opacity', 0.2)
            d3.select(`#${'idx' + '-' + d.idx}`).attr('fill-opacity', 0.8)
            self.links.forEach((l) => {
              if (l.source.idx === d.idx && typeof (l.target.idx) === 'number') {
                d3.select(`#${'idx' + '-' + l.target.idx}`).attr('fill-opacity', 0.8)
              }
              if (l.target.idx === d.idx && typeof (l.source.idx) === 'number') {
                d3.select(`#${'idx' + '-' + l.source.idx}`).attr('fill-opacity', 0.8)
              }
            })
            self.clicked.push(d)
          }
        })
        .on('dblclick', (d) => {
          if (self.dbclicked.length !== 0) {
            if (self.dbclicked[0].idx === d.idx) {
              d3.selectAll('circle').attr('fill-opacity', 0.8)
              self.dbclicked.splice(-1, 1)
            } else {
              d3.selectAll('circle').attr('fill-opacity', 0.2)
              d3.selectAll(`.${d.group}`).attr('class', d.group).attr('fill-opacity', 0.6)
              d3.select(`#${'idx' + '-' + d.idx}`).attr('fill-opacity', 0.8)
              self.dbclicked.splice(-1, 1)
              self.dbclicked.push(d)
            }
          } else {
            d3.selectAll('circle').attr('fill-opacity', 0.2)
            d3.selectAll(`.${d.group}`).attr('class', d.group).attr('fill-opacity', 0.6)
            d3.select(`#${'idx' + '-' + d.idx}`).attr('fill-opacity', 0.8)
            self.dbclicked.push(d)
          }
        })
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
          .attr('cx', (d) => {
            // return d.x
            if (self.canvasWidth * 0.85 / 2 - self.config.radiusLength < d.x) {
              d.x = self.canvasWidth * 0.85 / 2 - self.config.radiusLength * 2
            } else if (d.x < -self.canvasWidth * 0.85 / 2) {
              d.x = -self.canvasWidth * 0.85 / 2 + self.config.radiusLength * 2
            }

            return d.x
          })
          .attr('cy', (d) => {
            if (self.canvasHeight / 2 - self.config.radiusLength < d.y) {
              d.y = self.canvasHeight / 2 - self.config.radiusLength * 2
            } else if (d.y < -self.canvasHeight / 2) {
              d.y = -self.canvasHeight / 2 + self.config.radiusLength * 2
            }

            return d.y
          })
      }
    }
  }
}
</script>

<style lang='stylus' scoped>

#textcloud
    height: 100%
    width: 44%
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
