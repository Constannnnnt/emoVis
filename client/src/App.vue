<template>
  <div id="app">
    <NavBar></NavBar>
    <div class="row" :style="{width: setting.width + 'px', height: setting.height * 0.5 + 'px'}" style="margin: 0">
      <div class="col-9" style="height: 99%; padding: 0">
        <div id="main-view">
          <OverView></OverView>
          <RadialChart></RadialChart>
          <TextCloud></TextCloud>
        </div>
      </div>
      <div class="col-3" style="height: 99%; padding: 0">
        <div id="main-view">
          <ControlPanel></ControlPanel>
        </div>
      </div>
    </div>
    <div class="row" :style="{width: setting.width + 'px', height: setting.height * 0.5 + 'px'}" style="margin: 0">
      <div class="col-12" style="height: 99%; padding: 0">
        <FlowGraph></FlowGraph>
      </div>
    </div>
  </div>
</template>

<script>
import 'bootstrap/dist/css/bootstrap.min.css'
import 'keen-ui/dist/keen-ui.min.css'
import NavBar from '@/components/nav-bar'
import FlowGraph from '@/components/Flowgraph/flowgraph'
import RadialChart from '@/components/Radialchart/radialchart'
import TextCloud from '@/components/Textcloud/textcloud'
import OverView from '@/components/Overview/overview'
import ControlPanel from '@/components/Controlpanel'

export default {
  name: 'App',
  components: {
    NavBar,
    OverView,
    FlowGraph,
    RadialChart,
    TextCloud,
    ControlPanel
  },
  data () {
    return {
      setting: {
        width: 0,
        height: 0
      }
    }
  },
  mounted () {
    this.$nextTick(function foo () {
      this.initialize()
    })
  },
  methods: {
    initialize () {
      this.setting.height = window.innerHeight - document.querySelector('.navbar').clientHeight
      this.setting.width = window.innerWidth
      window.addEventListener('resize', () => {
        this.setting.height = window.innerHeight - document.querySelector('.navbar').clientHeight
        this.setting.width = window.innerWidth
      })
    }
  }
}
</script>

<style>
html {
  font-size: small;
  overflow-y: hidden;
}

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-size: 1em;
  color: #2c3e50;
}

.selected {
  background-color: rgba(0, 0, 0, 0.1);
}

#main-view {
  height: 100%;
}

.row{
  border-bottom: 1px solid rgba(0, 0, 0, 0.4);
}
button {
  cursor: pointer;
}
</style>
