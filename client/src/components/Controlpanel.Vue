<template>
  <div id='controlpanel'>
    <div id="controlpanel-head">
      <h1 id="controlpanel-head-title">Control Panel</h1>
    </div>
    <div v-show="data !== null" style="height: 94%; width: 100%" id="controlpanel-vis-container">
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
  name: 'ControlPanel',
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

#controlpanel
    height: 100%
    width: 34%
    display: inline-block
    vertical-align: top
    padding: 0
    margin: 5px

#controlpanel-head
    vertical-align: top
    margin-bottom: 5px
    margin-left: 2px

#controlpanel-head-title
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
