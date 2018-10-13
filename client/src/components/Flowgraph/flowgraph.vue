<template>
  <div id='flowgraph'>
    <div id="flowgraph-head">
      <h1 id="flowgraph-head-title">Flow View</h1>
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
  name: 'FlowGraph',
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
