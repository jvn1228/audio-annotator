<template>
  <v-app id="inspire">
  <v-layout align-center>
    <v-flex sm6 offset-sm3>
      <v-card class="pa-3">
        <div>
          <v-btn @click="$refs.audiofile.click()">Load Audio</v-btn>
          <input
            type="file"
            style="display: none"
            ref="audiofile"
            accept="audio/*"
            @change="onAudioPicked"
          >
          <v-progress-circular class="notransition" v-if="loadprogress" v-model="loadprogress" color="primary"></v-progress-circular>
          <p>{{fname}}</p>
        </div>
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
import * as io from "./utils/io.js"
let AudioContext = window.AudioContext || window.webkitAudioContext

export default {
  name: 'App',
  data() { return {
    time: 0,
    fname: null,
    song: new Audio(),
    playing: false,
    marks: {},
    sortedMarks: [],
    currMark: 0,
    currMarkText: "",
    loadprogress: 0,
  }},
  created: function() {
    document.addEventListener('keypress', this.keyPressed)
  },
  mounted: function() {

  },
  methods: {
    onAudioPicked(e){
      if (e.target.files){
        let reader = new FileReader()
        this.fname = e.target.files[0].name
        reader.onprogress = (e) => {
          let prog = e.loaded/e.total*100
          this.loadprogress = prog
        }
        reader.onload = (e) => {
          this.song.src = e.target.result

          this.loadprogress = 0
        }
        reader.readAsDataURL(e.target.files[0])
      }
    },
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
      return "calc(" + (time / (this.song.duration || 1) * 100 || 0) + "% - 14px)"
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
      if (this.song.duration){
        if (this.playing){
          this.pause()
        } else {
          this.play()
        }
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
        currentTime = mousePos / elWidth * (this.song.duration || 1),
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
      io.downloadFile(data)
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
      return this.time / (this.song.duration || 1) * 100 || 0
    }
  }
}
</script>

<style>
  .notransition .v-progress-linear__bar__determinate, .v-progress-circular__overlay {
    transition: none;
  }
</style>
