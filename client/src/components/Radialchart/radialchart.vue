<template>
  <div id='radialchart' ref='radialcanvas'>
    <div id='radialchart-head'>
      <h1 id='radialchart-head-title'>Radial View</h1>
    </div>
    <div v-show='emotionData !== null' style='height: 94%' id='radial-view-vis-container'>
      <!-- <tsne-vis v-if='overview === 'tsne'' id='tsne-vis-container' :overview-data='tsneData'></tsne-vis> -->
    </div>
    <div v-show='emotionData === null'>
      No data loaded.
    </div>
  </div>
</template>

<script>
// import * as jQuery from 'jquery'
import PipeService from '@/services/pipe-service.js'
import * as d3 from 'd3'
import d3Tip from 'd3-tip'

export default {
  name: 'RadialChart',
  mounted () {
    // this.data = null
    PipeService.$on(PipeService.EMOTION_DATA_CHANGE, (emotionData) => {
      this.emotionData = emotionData
      if (this.emotionData.length === 6) {
        let flag = false
        this.emotionData.forEach((el) => {
          if (el.value > 0.3) {
            flag = true
          }
        })
        if (flag) {
          this.emotionData.splice(3, 0, {'emotion': 'neural', 'value': 0.0})
        } else {
          this.emotionData.splice(3, 0, {'emotion': 'neural', 'value': 0.5000000001})
        }
      }
      this.initialzeCanvas()
      this.drawRadial()
    })
  },
  data () {
    return {
      emotionData: null,
      config: {
        radius: 140,
        levels: 5,
        margin: {
          top: 5,
          bottom: 5,
          right: 5,
          left: 10
        },
        maxValue: 1,
        labelFactor: 1.12,
        opacityArea: 0.35,
        dotRadius: 4,
        opacityCircles: 0.1,
        strokeWidth: 2,
        roundStrokes: false,
        wrapWidth: 40, // The number of pixels after which a label needs to be given a new line
        emotionColor: {
          angry: '#cf000f',
          disgusted: '#8c14fc',
          fear: '#ffcb05',
          neural: '#e4e9ed',
          sad: '#19b5fe',
          surprised: '#fef160',
          happy: '#2ecc71'
        }
      }
    }
  },
  methods: {
    initialzeCanvas () {
      d3.select('#radial-view-vis-container').selectAll('*').data([]).exit().remove()
      // const elements = document.getElementsByClassName('d3-tip')
      // while (elements.length > 0) elements[0].remove()
    },
    drawRadial () {
      const el = '#radial-view-vis-container'
      this.canvasWidth = document.querySelector('#radial-view-vis-container').clientWidth
      this.canvasHeight = document.querySelector('#radial-view-vis-container').clientHeight

      const allAxis = this.emotionData.map((d) => {
        return d.emotion
      }) // name of each axis

      const totalAxis = allAxis.length // total number of axis
      const angleSlice = Math.PI * 2 / totalAxis // The width in radians of each 'slice'
      const rScale = d3.scaleLinear().domain([0, this.config.maxValue]).range([0, this.config.radius])
      const svg = d3.select(el).append('svg')
        .attr('id', 'radar-chart')
        .attr('width', this.canvasWidth)
        .attr('height', this.canvasHeight)
      const g = svg.append('g')
        .attr('transform', 'translate(' + (this.canvasWidth / 2 + this.config.margin.left) + ',' + (this.canvasHeight / 2) + ')')
      const Format = d3.format('.2%')

      const tip = d3Tip().attr('class', 'd3-tip').html((nd) => {
        let str
        if (nd.emotion !== undefined) {
          str = `<div class="d3-tip">emotion: ${nd.emotion}`
        }
        str += `</br>score: ${Format(nd.value)}</div>`
        return str
      })

      let maxScoreEmotion
      let maxScore = -1
      this.emotionData.forEach((d) => {
        if (d.value > maxScore) {
          maxScoreEmotion = d.emotion
          maxScore = d.value
        }
      })

      /// /////////////////////////////////////////////////////
      /// //////////// Draw the Circular grid //////////////////
      /// //////////////////////////////////////////////////////

      // Wrapper for the grid & axes
      const axisGrid = g.append('g').attr('class', 'axisWrapper')

      d3.select('#radial-view-vis-container').select('svg').call(tip)

      // Draw the background circles
      axisGrid.selectAll('.levels')
        .data(d3.range(1, (this.config.levels + 1)).reverse())
        .enter()
        .append('circle')
        .attr('class', 'gridCircle')
        .attr('r', (d, i) => {
          return this.config.radius / this.config.levels * d
        })
        .style('fill', '#CDCDCD')
        .style('stroke', '#CDCDCD')
        .style('fill-opacity', this.config.opacityCircles)

      // Text indicating at what % each level is
      axisGrid.selectAll('.axisLabel')
        .data(d3.range(1, (this.config.levels + 1)).reverse())
        .enter().append('text')
        .attr('class', 'axisLabel')
        .attr('x', 4)
        .attr('y', (d) => {
          return -d * this.config.radius / this.config.levels
        })
        .attr('dy', '0.4em')
        .style('font-size', '10px')
        .attr('fill', '#737373')
        .text((d, i) => {
          return Format(this.config.maxValue * d / this.config.levels)
        })
      /// //////////////////////////////////////////////////////
      /// ///////////////// Draw the axes //////////////////////
      /// //////////////////////////////////////////////////////

      // Create the straight lines radiating outward from the center
      const axis = axisGrid.selectAll('.axis')
        .data(allAxis)
        .enter()
        .append('g')
        .attr('class', 'axis')
      // Append the lines
      axis.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', (d, i) => {
          return rScale(this.config.maxValue * 1.1) * Math.cos(angleSlice * i - Math.PI / 2)
        })
        .attr('y2', (d, i) => {
          return rScale(this.config.maxValue * 1.1) * Math.sin(angleSlice * i - Math.PI / 2)
        })
        .attr('class', 'line')
        .style('stroke', 'white')
        .style('stroke-width', '2px')

      // Append the labels at each axis
      axis.append('text')
        .attr('class', 'legend')
        .style('font-size', '13px')
        .attr('text-anchor', 'middle')
        .attr('x', (d, i) => {
          let value = rScale(this.config.maxValue * this.config.labelFactor) * Math.cos(angleSlice * i - Math.PI / 2)
          if (value < 0) {
            return value - 12
          } else {
            return value + 8
          }
        })
        .attr('y', (d, i) => {
          return rScale(this.config.maxValue * this.config.labelFactor) * Math.sin(angleSlice * i - Math.PI / 2)
        })
        .text((d) => {
          return d
        })

      /// //////////////////////////////////////////////////////
      /// ////////// Draw the radar chart blobs ////////////////
      /// //////////////////////////////////////////////////////

      // Create a wrapper for the blobs
      const blobWrapper = g.selectAll('.radarWrapper')
        .data([this.emotionData])
        .enter().append('g')
        .attr('class', 'radarWrapper')

      const radarLine = d3.lineRadial()
        .radius((d) => {
          return rScale(d.value)
        })
        .angle((d, i) => {
          return i * angleSlice
        })
        .curve(d3.curveCardinalClosed)

      // Append the backgrounds
      const self = this
      blobWrapper
        .append('path')
        .attr('class', 'radarArea')
        .attr('d', (d) => {
          return radarLine(d)
        })
        .style('fill', (d, i) => {
          return this.config.emotionColor[maxScoreEmotion]
        })
        .style('fill-opacity', this.config.opacityArea)
        .on('mouseover', (d, i) => {
          // Dim all blobs
          d3.selectAll('.radarArea')
            .transition().duration(200)
            .style('fill-opacity', 0.1)
          // Bring back the hovered over blob
          d3.select('.radarArea')
            .transition().duration(200)
            .style('fill-opacity', 0.7)
        })
        .on('mouseout', () => {
          // Bring back all blobs
          d3.selectAll('.radarArea')
            .transition().duration(200)
            .style('fill-opacity', self.config.opacityArea)
        })

      // Create the outlines
      blobWrapper.append('path')
        .attr('class', 'radarStroke')
        .attr('d', (d, i) => {
          return radarLine(d)
        })
        .style('stroke-width', this.config.strokeWidth + 'px')
        .style('stroke', (d, i) => {
          return this.config.emotionColor[maxScoreEmotion]
        })
        .style('fill', 'none')

      // Append the circle
      blobWrapper.selectAll('.radarCircle')
        .data((d, i) => {
          return d
        })
        .enter()
        .append('circle')
        .attr('class', 'radarCircle')
        .attr('r', this.config.dotRadius)
        .attr('cx', (d, i) => {
          return rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2)
        })
        .attr('cy', (d, i) => {
          return rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2)
        })
        .style('fill', (d, i, j) => {
          return this.config.emotionColor[d.emotion]
        })
        .style('fill-opacity', 0.8)
        // .on('mouseover', function (d) {
        //   tip.show(d, this)
        // })
        // .on('mouseout', function (d) {
        //   // tip.hide()
        //   console.log(d)
        //   console.log(document.getElementsByClassName('d3-tip'))
        //   console.log(document)
        //   const elements = document.getElementsByClassName('d3-tip')
        //   while (elements.length > 0) elements[0].remove()
        // })
    }
  },
  components: {
  }
}
</script>

<style lang='stylus' scoped>

#radialchart
    height: 100%
    width: 34%
    display: inline-block
    vertical-align: top
    padding: 0
    margin: 5px
    border-left: 1px solid rgba(0, 0, 0, 0.4)

#radialchart-head
    vertical-align: top
    margin-bottom: 5px
    margin-left: 2px

#radialchart-head-title
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
