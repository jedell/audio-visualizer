import React, { useRef, useEffect, useState } from 'react'
import * as color from "../utils/color";

let initArr = new Array(1024).fill(128)

const width = window.innerWidth;
const height = window.innerHeight;

let lighterHue = "#00fafa"
let darkerHue = "#00c2c2"

let song;
let blob;

let colors = ["#5e4fa2", "#f79459", "#fff56b"]

let colorList = color.produceColorList(colors, 11)
let colorIndx = 0
let currColor = colorList[0]
let darkerColor = color.makeDarker(currColor, 20)
let l = colorList.length
let steps = 0

const Canvas = props => {
    const [audio, setAudio] = useState(null)
    const [audioContext, setAudioContext] = useState(null);
    const [audioSource, setAudioSource] = useState(null);
    const [analyser, setAnalyser] = useState(null);

    const [ctx, setCtx] = useState(null)
    const [sphere, setSphere] = useState(null)

    const [freqArray, setFreqArray] = useState(new Uint8Array(initArr))
    const [rafID, setRafID] = useState(null)

    const [initizlizedAudio, setInitizlizedAudio] = useState(false)

    const [isDisabled, setIsDisabled] = useState(true)


    const canvasRef = useRef(null)
    const audioRef = useRef(null)
    const playButtonRef = useRef(null)
    const inputRef = useRef(null)

    //point constructor
    class Point {
        constructor(x, y, z) {
            this.x = x
            this.y = y
            this.z = z
        }

        rotateX(amount) {
            let y = this.y
            this.y = (y * Math.cos(amount)) + (this.z * Math.sin(amount) * -1.0)
            this.z = (y * Math.sin(amount)) + (this.z * Math.cos(amount))
        }

        rotateY(amount) {
            let x = this.x
            this.x = (x * Math.cos(amount)) + (this.z * Math.sin(amount) * -1.0)
            this.z = (x * Math.sin(amount)) + (this.z * Math.cos(amount))
        }

        rotateZ(amount) {
            let x = this.x
            this.x = (x * Math.cos(amount)) + (this.y * Math.sin(amount) * -1.0)
            this.y = (x * Math.sin(amount)) + (this.y * Math.cos(amount))
        }

        getProjection(distance, xy, offSet, offSetZ) {
            return ((distance * xy) / (this.z - offSetZ)) + offSet
        }

        draw(x, y, size, color) {
            ctx.save()
            ctx.beginPath()
            ctx.fillStyle = color
            ctx.arc(x, y, size, 0, 2 * Math.PI, true)
            ctx.fill()
            ctx.restore()
        }
    }

    // sphere consturctor
    class Sphere {
        constructor(radius = 20.0) {
            this.point = []
            this.color = "rgb(100,0,255)"
            this.radius = radius
            this.numberOfVertexes = 0

            this.rotation = 0
            this.distance = 0

            this.init()
        }

        init() {
            for (let alpha = 0; alpha <= 6.28; alpha += 0.17) {
                let p = this.point[this.numberOfVertexes] = new Point()

                p.x = Math.cos(alpha) * this.radius
                p.y = 0
                p.z = Math.sin(alpha) * this.radius

                this.numberOfVertexes++
            }

            for (let direction = 1; direction >= -1; direction -= 2) {
                for (let beta = 0.17; beta < Math.PI; beta += 0.17) {
                    let radius = Math.cos(beta) * this.radius
                    let fixedY = Math.sin(beta) * this.radius * direction

                    for (let alpha = 0; alpha < 6.28; alpha += 0.17) {
                        let p = this.point[this.numberOfVertexes] = new Point()

                        p.x = Math.cos(alpha) * radius
                        p.y = fixedY
                        p.z = Math.sin(alpha) * radius

                        this.numberOfVertexes++
                    }
                }
            }
        }

        draw(arr) {
            let x, y
            let p = new Point()

            for (let i = 0; i < this.numberOfVertexes / 2; i++) {
                const factor = arr[i] / 256
                const size = 1//1.5/(factor + 0.2)           
                //one half of sphere
                p.x = this.point[Math.floor(this.numberOfVertexes / 2) + i].x * factor
                p.y = this.point[Math.floor(this.numberOfVertexes / 2) + i].y * factor
                p.z = this.point[Math.floor(this.numberOfVertexes / 2) + i].z * factor

                p.rotateX(this.rotation)
                p.rotateY(this.rotation)
                p.rotateZ(this.rotation)

                x = p.getProjection(this.distance, p.x, canvasRef.current.width / 2.0, 100.0)
                y = p.getProjection(this.distance, p.y, canvasRef.current.height / 2.0, 100.0)


                if ((x >= 0) && (x < canvasRef.current.width)) {
                    if ((y >= 0) && (y < canvasRef.current.height)) {
                        if (p.z < 0) {
                            p.draw(x, y, size, darkerColor) //darker
                        } else {
                            p.draw(x, y, size, currColor)
                        }
                    }
                }
                // other half of sphere
                p.x = this.point[Math.floor(this.numberOfVertexes / 2) - i].x * factor
                p.y = this.point[Math.floor(this.numberOfVertexes / 2) - i].y * factor
                p.z = this.point[Math.floor(this.numberOfVertexes / 2) - i].z * factor

                p.rotateX(this.rotation)
                p.rotateY(this.rotation)
                p.rotateZ(this.rotation)

                x = p.getProjection(this.distance, p.x, canvasRef.current.width / 2.0, 100.0)
                y = p.getProjection(this.distance, p.y, canvasRef.current.height / 2.0, 100.0)


                if ((x >= 0) && (x < canvasRef.current.width)) {
                    if ((y >= 0) && (y < canvasRef.current.height)) {
                        if (p.z < 0) {
                            p.draw(x, y, size, darkerColor) //darker
                        } else {
                            p.draw(x, y, size, currColor)
                        }
                    }
                }
            }
        }

        update() {
            this.rotation += Math.PI / 360.0

            if (this.distance < 1000) {
                this.distance += 10
            }
        }
    }

    const togglePlay = () => {
        if (audio.paused) {
            console.log("playing")
            audio.play();
            setRafID(requestAnimationFrame(tick));
        } else {
            console.log("pausing")
            audio.pause();
            cancelAnimationFrame(rafID);
        }
    }

    const initAudioContext = () => {
        if (initizlizedAudio === false) {
            let actx = new (window.AudioContext || window.webkitAudioContext)();

            let source = actx.createMediaElementSource(audio);

            let analy = actx.createAnalyser()
            setAnalyser(analy);

            let delay = actx.createDelay()
            delay.delayTime.value = 0.16;

            source.connect(analy);
            analy.connect(delay);
            delay.connect(actx.destination);

            analy.fftSize = 8192;
            analy.smoothingTimeConstant = 0.8;

            setFreqArray(new Uint8Array(analy.frequencyBinCount))

            setInitizlizedAudio(true);

            // init a sphere
            const s = new Sphere()
            setSphere(s)

            let p = new Point()
            p.draw(canvasRef.current.width / 2.0, canvasRef.current.height / 2.0, 1, currColor, 0.1)

            setIsDisabled(false)

        }
    }

    const uploadFile = () => {
        if (audio) {
            audio.pause()
            console.log("pausing")
        } 
        if (!initizlizedAudio) {
            initAudioContext()
        }
        song = blob.createObjectURL(inputRef.current.files[0])
        //handle upload to backend an analysis via promise/get to flask app

        audioRef.current.src = song
        audioRef.current.load()

        // if (isDisabled[0] !== false) {
        //     console.log('here')
        //     setIsDisabled([true, false])

        // }
    }

    const tick = () => {
        // animationLoop(canvasRef.current);

        ctx.save()
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        sphere.draw(freqArray)
        ctx.restore()
        sphere.update()

        // darkerHue = color.changeHue(darkerHue, 1)
        // lighterHue = color.changeHue(lighterHue, 1)
        steps++;
        if (steps % 15 == 0) {
            if (colorIndx >= l - 1) {
                colorIndx = 0
            } else {
                colorIndx++
            }
        }
        currColor = colorList[colorIndx]
        darkerColor = color.makeDarker(currColor, 30)


        analyser.getByteFrequencyData(freqArray);
        setRafID(requestAnimationFrame(tick));
    }

    useEffect(() => {
        // grab audio element
        let audio2 = audioRef.current;
        setAudio(audio2)

        setCtx(canvasRef.current.getContext('2d'))

        canvasRef.current.width = width
        canvasRef.current.height = height

        blob = window.URL || window.webkitURL;
        if (!blob) {
            console.log('Your browser does not support Blob URLs :(');
            return;
        }

    }, [])

    return (
        <div>
            <audio ref={audioRef}></audio>
            <canvas height={"100%"} width={"100%"} ref={canvasRef} {...props} />
            <button disabled={isDisabled} onClick={togglePlay} ref={playButtonRef}>Play</button>
            <input type={"file"} accept='.mp3' ref={inputRef} onChange={uploadFile}></input>
        </div>
    )
}

export default Canvas