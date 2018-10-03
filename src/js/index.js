// Create a p5 canvas (learn more at p5js.org)
let myCanvas = null;

// Declare kinectron 
let kinectron = null;

// Store all images in array
let images = [];

function preload() {
  let i = 0;
  for (; i < 8; ++i) {
    images.push(loadImage('images/danny.jpg'));
  }
}

function setup() {
  let width = window.innerWidth;
  let height = window.innerHeight;

  // Create a p5 canvas
  myCanvas = createCanvas(width, height);
  
  // Set background color
  background(0);

  // Add images
  addImages();

  // Initialize Kinectron
  initKinectron();
}

function addImages() {
  fill('rgb(135,206,250)');   // light blue

  const margin = 40;

  // This guarantees that exactly 8 images fit in screen (2 rows, 4 columns)
  const file_width = (window.innerWidth - (margin * 5)) / 4;
  const file_height = (window.innerHeight - (margin * 3)) / 2;

  let x_coord;
  let image_index = 0;

  // Display each image
  for (x_coord = margin; x_coord < window.innerWidth; x_coord += file_width + margin) { 
    let y_coord;

    for (y_coord = margin; y_coord < window.innerHeight; y_coord += file_height + margin) { 
        image(images[image_index], x_coord, y_coord, file_width, file_height);
        image_index += 1;
    }
  }
}

function initKinectron() {
  // Define and create an instance of kinectron
  kinectron = new Kinectron("35.1.106.115");

  // Connect with server over peer
  kinectron.makeConnection();

  // Request all tracked bodies and pass data to your callback
  kinectron.startTrackedJoint(kinectron.HANDRIGHT, drawRightHand);
}

function logHandData(hands) {
  console.log(hands.rightHandState);
}

function drawRightHand(hand) {
  // background(0);
  kinectron.getHands(logHandData);

  fill(255);

  ellipse(hand.depthX * myCanvas.width, hand.depthY * myCanvas.height, 50, 50);
}