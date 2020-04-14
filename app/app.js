const p5 = require("p5");
const Tone = require("tone");
const StartAudioContext = require("startaudiocontext");

const synth = new Tone.FMSynth().toMaster();
StartAudioContext(Tone.context);

let faceapi;
let detections;
let width = 800;
let height = 600;
//let mouthWasOpen = false;
let lWasRaised = false;
let rWasRaised = false;
let R = 0;
let G = 0;
let B = 0;
var randomWords = ["Dog", "Baby Yoda", "Remake Disney Channel Magic Wand", "Spongebob", "Shrek", "Your Sun, Moon, and Raising", "Billie's Eyelashes", "My Future", "Pikachu"]
let finalWord;

const detection_options = {
    withLandmarks: true,
    withDescriptors: false,
    Mobilenetv1Model: 'models',
    FaceLandmarkModel: 'models',
    FaceRecognitionModel: 'models',
    FaceExpressionModel: 'models',
};

const p5draw = (p) => {

    let p5video;
    let g;

    function drawBox(detections) {
        detections.forEach((detection) => {
            const alignedRect = detection.alignedRect;

            p.noFill();
            p.stroke(255, 255, 255);
            p.strokeWeight(2);
            // p.rect(
            //     alignedRect._box._x,
            //     alignedRect._box._y,
            //     alignedRect._box._width,
            //     alignedRect._box._height,
            // );
        });
    }

    function drawLandmarks(detections) {
        p.noFill();
        p.stroke(161, 95, 251)
        p.strokeWeight(2)

        for(let i = 0; i < detections.length; i++){
            const mouth = detections[i].parts.mouth; 
            const nose = detections[i].parts.nose;
            const leftEye = detections[i].parts.leftEye;
            const rightEye = detections[i].parts.rightEye;
            const rightEyeBrow = detections[i].parts.rightEyeBrow;
            const leftEyeBrow = detections[i].parts.leftEyeBrow;

            drawPart(mouth, true);
            drawPart(nose, false);
            drawPart(leftEye, true);
            drawPart(leftEyeBrow, false);
            drawPart(rightEye, true);
            drawPart(rightEyeBrow, false);
            //drawLabel(mouth);
            //drawLabel(nose);
            //drawLabel(leftEyeBrow);
            //drawLabel(rightEyeBrow);
            //drawLabel(rightEye);
            //drawLabel(leftEye);
        }
    }

    function drawPart(feature, closed) {
        p.beginShape();
        for(let i = 0; i < feature.length; i++){
            const x = feature[i]._x
            const y = feature[i]._y
            p.vertex(x, y)
        }
        
        if(closed === true){
            p.endShape(p.CLOSE);
        } else {
            p.endShape();
        }
    }

    function drawLabel(feature){
        for (let i = 0; i < feature.length; i++){
            const x = feature[i]._x;
            const y = feature[i]._y;

            p.textSize(9);
            p.strokeWeight(0);
            p.fill(0);
            p.text(`${i}`, x+3, y-3);

            //p.ellipse(x+3, x-3, 20);
        }
    }

    function distance(p1,p2){
        const dx = p1._x - p2._x;
        const dy = p1._y - p2._y;
        return Math.sqrt(dx * dx + dy*dy);
    }

    p.setup = () => {
        p.createCanvas(width, height);
        p.background(255);

        p5video = p.createCapture(p.VIDEO);
        p5video.size(width, height);
        p5video.hide();

        resetSketch();
        g.frameRate(120);
        //p.image(p5video, 0, 0, p.width, p.height);

        faceapi = ml5.faceApi(p5video, detection_options, modelReady);

        var randomIndex = Math.floor(Math.random()*randomWords.length);
        finalWord = randomWords[randomIndex];

        var button = p.createButton("reset");
        button.mousePressed(resetSketch);
    }

    function resetSketch(){
        g = p.createGraphics(p.width,p.height);
    }

    p.draw = () => {
        p.translate(p5video.width, 0);
        p.scale(-1.0,1.0);
        p.image(p5video, 0, 0, p.width, p.height);//figure this out
        p.image(g, 0, 0, p.width, p.height);

        if (detections) {
            drawBox(detections);
            drawLandmarks(detections);

            // Get the mouth feature
            // get points 14 and 18
            // see how far apart they are

            if (detections.length > 0){
                const detection = detections[0];
                //const mouth = detection.parts.mouth;
                //const topLip = mouth[14];
                //const bottomLip = mouth[18];
                //const d = distance(topLip, bottomLip);
                const headWidth = detection.alignedRect._box.width;
                //const normalizedDistance = d/headWidth;
                //const threshold = 0.021;
                //const isOpen = normalizedDistance > threshold;

                //Detecting Eyebrows
                const lEyebrow = detection.parts.leftEyeBrow;
                const rEyebrow = detection.parts.rightEyeBrow;
                const lEye = detection.parts.leftEye;
                const rEye = detection.parts.rightEye;

                const lEyebrowCheck = lEyebrow[2];
                const rEyebrowCheck = rEyebrow[2];
                const lEyeCheck = lEye[2];
                const rEyeCheck = rEye[2];
                const dis1 = distance(lEyebrowCheck, lEyeCheck);
                const dis2 = distance(rEyebrowCheck, rEyeCheck);
                const normalDis1 = dis1/headWidth;
                const normalDis2 = dis2/headWidth;
                const eyebrowThreshold = 0.17;
                const lIsRaised = normalDis1 > eyebrowThreshold;
                const rIsRaised = normalDis2 > eyebrowThreshold;

                if (lIsRaised !== lWasRaised && rIsRaised !== rWasRaised){

                    if (lIsRaised && rIsRaised){
                        R = Math.floor(Math.random() * 256);
                        G = Math.floor(Math.random() * 256);
                        B = Math.floor(Math.random() * 256);
                    }
                    lWasRaised = lIsRaised;
                    rWasRaised = rIsRaised;
                }

                //Drawing
                const nose = detection.parts.nose;
                g.fill(R, G, B);
                g.noStroke();
                g.ellipse(nose[3].x, nose[3].y, 20);

                //If the mouth was closed and is open, ply a note
                //If the mouth was open and is closed, stop
                //if (isOpen !== mouthWasOpen){
                //    if (isOpen){
                        // play a notes
                        //synth.triggerAttack("C4");
                    //}else{
                        //stop
                        //synth.triggerRelease();
                    //}

                    //mouthWasOpen = isOpen;
                //}

                //const mouthLeft = mouth[0];
                //const mouthRight = mouth[6];
                //const mouthWidth = distance(mouthLeft,mouthRight);

                // Mouth goes from 36 to 55
                //const normalizedMouthWidth = p.map(
                    //mouthWidth,
                    //36,55,0,1);
                //synth.modulationIndex.rampTo(normalizedMouthWidth *15);
                
                p.translate(p5video.width, 0);
                p.scale(-1.0,1.0);

                p.textSize(30);
                p.strokeWeight(0);
                p.fill(0);
                p.textAlign(p.CENTER);
                p.text(`Draw: ${finalWord}.`, p.width/2, 30);

                p.textSize(14);
                p.fill(255);
                //p.text(`The mouth is ${mouthWidth}${isOpen? "open" : "closed"}`, p.width/2, p.height-10);
                p.text(`The left: ${lIsRaised? "raised":"normal"}, the right: ${rIsRaised? "raised":"normal"}, color: ${R}, ${G}, ${B}`, p.width/2, p.height-10);
            }
        }
    }
}

function setup() {
    const myp5 = new p5(p5draw, "main");
    
}

function modelReady() {
    console.log("model ready!");
    faceapi.detect(gotResults);
}

function gotResults(err, results) {
    if (err) {
        console.log(err);
        return;
    }

    detections = results;
    faceapi.detect(gotResults);
}

// Calls the setup function when the page is loaded
window.addEventListener("DOMContentLoaded", setup);
