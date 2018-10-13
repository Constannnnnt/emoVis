<template>
  <div id='overview'>
    <div id="overview-head">
      <h1 id="overview-head-title">Camera View</h1>
    </div>
    <div v-show="data !== null" style="height: 94%" id="overview-vis-container">
      <!-- <tsne-vis v-if="overview === 'tsne'" id="tsne-vis-container" :overview-data="tsneData"></tsne-vis> -->
    </div>
    <div v-show="data != null" >
        <button id="webcam_btn" @click="stopWebCam">Stop</button>
    </div>
    <div v-show="data === null">
      No data loaded.
    </div>
    <div v-show="data === null">
        <button id="webcam_btn" @click="startWebCam">Start</button>
    </div>
  </div>
</template>

<script>
// import * as jQuery from 'jquery'

export default {
  name: 'OverView',
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
    startWebCam () {

    }
  },
  components: {
  }
}
</script>

<style lang='stylus' scoped>

#overview
    height: 100%
    width: 28%
    display: inline-block
    vertical-align: top
    padding: 0
    margin: 5px

#overview-head
    vertical-align: top
    margin-bottom: 5px
#overview-head-title
    display: inline-block
    font-size: 16px

#webcam_btn
    -webkit-box-sizing: border-box
    -moz-box-sizing: border-box
    box-sizing: border-box

    text-align: center
    width: 30%
    font-size: 12px
    font-weight: 600
    cursor: pointer
    color: #fff
    border: none

    border-radius: 50px
    background-image: linear-gradient(to right, #30dd8a, #2bb673)
    box-shadow: 0 1px 3px 0 rgba(23, 168, 108, 0.75)

    position: relative
    left: 35%
    top: 300px

.radio-group
    display: inline-block
    margin-left: 10px

label
    margin-bottom: 0
h1
    margin-bottom: 0

</style>
