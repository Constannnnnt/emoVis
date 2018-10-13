<template>
  <div id='radialchart'>
    <div id="radialchart-head">
      <h1 id="radialchart-head-title">Radial View</h1>
    </div>
    <div v-show="data !== null" style="height: 94%" id="radial-vis-container">
      <!-- <tsne-vis v-if="overview === 'tsne'" id="tsne-vis-container" :overview-data="tsneData"></tsne-vis> -->
    </div>
    <div v-show="data === null">
      No data loaded.
    </div>
  </div>
</template>

<script>
// import * as jQuery from 'jquery'

export default {
  name: 'RadialChart',
  mounted () {
  },
  data () {
    return {
      data: null,
      skylineData: null,
      fullRelation: null,
      tsneData: null,
      overview: 'tsne'
    }
  },
  methods: {
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
