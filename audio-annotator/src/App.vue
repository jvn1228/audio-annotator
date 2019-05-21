<template>
  <v-app id="inspire">
  <v-layout align-center>
    <v-flex sm6 offset-sm3>
      <v-card class="pa-3">
        <v-card-title><h2>Text: {{currMarkText}}</h2></v-card-title>
        <div class="mr-3 ml-3">
          <div style="position: relative;">
            <v-icon v-for="ts in sortedMarks" v-bind:key="ts" v-bind:style="{left: marks[ts].position, position: 'absolute', top: '-16px'}">arrow_drop_down</v-icon>
          </div>
          <v-progress-linear class="mt-0 notransition" v-model="progress" v-on:click="seek"></v-progress-linear>
        </div>
        <label>Time: {{time.toFixed(2)}} / {{song.duration}}</label>
        <v-divider class="mt-2 mb-2"></v-divider>
        <v-btn color="success" v-on:click="togglePlay()" >{{playing ? "Pause" : "Play"}}</v-btn>
        <v-btn v-on:click="restart()">Restart</v-btn>
        <v-btn v-on:click="saveMarks()">Save Marks</v-btn>
        <v-btn @click="pickFile">Load Marks</v-btn>
        <input
          type="file"
          style="display: none"
          ref="marksjson"
          accept="*.json"
          @change="onFilePicked"
        >
        <v-divider class="mt-2"></v-divider>
        <div style="max-height: 35em; overflow: auto">
          <v-list class="pt-4">
            <v-list-tile v-for="(ts, idx) in sortedMarks" v-bind:key="ts">
              <v-btn class= "mr-3" v-bind:class="{success: currMark - 1 == idx }" v-on:click="goToMark(idx)">{{ts}}</v-btn>
              <v-text-field v-model="marks[ts].text"></v-text-field>
              <v-icon @click="deleteMark(idx)">cancel</v-icon>
            </v-list-tile>
          </v-list>
        </div>
        <v-btn color="red" small dark size="small" @click="clear">Clear All Marks</v-btn>
      </v-card>
    </v-flex>
  </v-layout>
  </v-app>
</template>

<script>

var fname = 'song.mp3'

function downloadFile(data) {
    var filename = "marks.json";
    var blob = new Blob([JSON.stringify(data)], {type: 'text/plain'});
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(blob, filename);
    } else{
        var e = document.createEvent('MouseEvents'),
        a = document.createElement('a');
        a.download = filename;
        a.href = window.URL.createObjectURL(blob);
        a.dataset.downloadurl = ['text/plain', a.download, a.href].join(':');
        e.initEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        a.dispatchEvent(e);
    }
}

export default {
  name: 'App',
  data() { return {
    time: 0,
    fname: null,
    song: null,
    playing: false,
    marks: {},
    sortedMarks: [],
    currMark: 0,
    currMarkText: ""
  }},
  created: function() {
    document.addEventListener('keypress', this.keyPressed)
    this.fname = fname
    this.song = new Audio(fname)
  },
  methods: {
    clear(){
      this.marks = {}
      this.sortedMarks = []
      this.currMark = 0
      this.currMarkText = ""
    },
    deleteMark(idx) {
      delete this.marks[this.sortedMarks[idx]]
      this.sortedMarks.splice(idx, 1)
      if ( this.currMark >= idx ) {
        this.currMark--
      }
    },
    pickFile() {
      this.$refs.marksjson.click()
    },
    onFilePicked(e){
      const files = e.target.files
      if (files[0] !== undefined ) {
        const file = files[0]
        const fr = new FileReader()
        fr.readAsText(file)
        fr.addEventListener('load', () => {
          let data = JSON.parse(fr.result);
          this.fname = data.file
          this.song = new Audio(this.fname)
          this.marks = data.marks
          this.sortedMarks = Object.keys(this.marks).sort((a, b) => a - b)
          this.currMark = 0
          if (this.playing) {
            this.togglePlay()
          }})
      }
    },
    calcMarkPos(time){
      return "calc(" + (time / this.song.duration * 100 || 0) + "% - 14px)"
    },
    keyPressed(e) {
      if (e.which === 0) {
        this.marks[this.time] = {text: "Mark " + (Object.keys(this.marks).length),
                                 position: this.calcMarkPos(this.time),
                                 ts: this.time,}
        this.sortedMarks = Object.keys(this.marks).sort((a, b) => a - b)
      }
    },
    togglePlay(){
      if (this.playing){
        this.pause()
      } else {
        this.play()
      }
    },
    play() {
      this.song.play()
      this.playing = true
      this.interval = setInterval(() => { this.updateTime() }, 10)
    },
    pause() {
      this.song.pause()
      this.playing = false
      if (this.interval) {
        clearInterval(this.interval)
      }
    },
    restart() {
      this.song.currentTime = 0
      this.currMark = 0
      this.currMarkText = ""
      this.updateTime()
    },
    seek(e) {
      let el = document.querySelector(".v-progress-linear__bar"),
        mousePos = e.offsetX,
        elWidth = el.clientWidth,
        currentTime = mousePos / elWidth * this.song.duration,
        remMarks = this.sortedMarks.filter((ts) => ts >= currentTime)

      this.currMark = this.sortedMarks.length - remMarks.length - 1
      if ( this.currMark < 0 ) {
        this.currMarkText = ""
        this.currMark = 0
      }
      this.song.currentTime = currentTime
      this.updateTime()
    },
    saveMarks() {
      let data = {file: this.fname, marks: this.marks}
      downloadFile(data)
    },
    goToMark(idx) {
      this.currMark = idx
      this.song.currentTime = this.sortedMarks[this.currMark]
      this.updateTime()
    },
    updateTime() {
      this.time = this.song.currentTime
      if (this.time >= this.sortedMarks[this.currMark]) {
        this.currMarkText = this.marks[this.sortedMarks[this.currMark]].text
        this.currMark++
      }
    },
  },
  computed: {
    progress(){
      return this.time / this.song.duration * 100 || 0
    }
  }
}
</script>

<style>
  .notransition .v-progress-linear__bar__determinate {
    transition: none;
  }
</style>
