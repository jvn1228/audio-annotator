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

function loadFile(){

}

var app = new Vue({
	el: '#app',
	data: {
		time: 0,
		fname: null,
		song: null,
		playing: false,
		marks: {},
		sortedMarks: [],
		currMark: 0,
		currMarkText: ""
	},
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
					data = JSON.parse(fr.result);
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
			data = {file: this.fname, marks: this.marks}
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
})
