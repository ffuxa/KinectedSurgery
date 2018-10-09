// Create a p5 canvas (learn more at p5js.org)
let myCanvas = null;

// Declare kinectron 
let kinectron = null;

// Store all images in array
let images = [];

// img Object - stores the image p5 object,
// its coordinates, width, and height
function Img(imgObj) {
  this.imgObj = imgObj;
  this.x = 0; 
  this.y = 0; 
  this.w = 0;
  this.h = 0;

  this.coordinates = function(x, y, width, height) {
    this.x = x; 
    this.y = y; 
    this.w = width;
    this.h = height; 
  }
}

// This function runs before any other one
function preload() {
  let i = 0;
  for (; i < 8; ++i) {
    let img = new Img(loadImage('images/danny.jpg'));
    images.push(img); 
  }
}

function setup() {
  // Create a p5 canvas
  myCanvas = createCanvas(windowWidth, windowHeight);
  
  // Set background color
  background(0);

  // Add images
  addImages();
  // displayImage(0);

  // Initialize Kinectron
  initKinectron();
}

function addImages() {
  fill('rgb(135, 206, 250)');   // light blue

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
        images[image_index].coordinates(x_coord, y_coord, file_width, file_height);
        image(images[image_index].imgObj, x_coord, y_coord, file_width, file_height);
        image_index += 1;
    }
  }
}

function displayImage(position) {
  background(0);

  // console.log(images[position]);

  const x = (windowWidth - images[position].width) / 2;
  const y = (windowHeight - images[position].height) / 2;
  let img = image(images[position].imgObj, x, y);
}

function initKinectron() {
  // Define and create an instance of kinectron
  kinectron = new Kinectron("10.236.171.126");

  // Connect with server over peer
  kinectron.makeConnection();

  // Request all tracked bodies and pass data to your callback
  kinectron.startTrackedJoint(kinectron.HANDRIGHT, drawRightHand);
}


function drawRightHand(hand) {

  var func = function logHandData(hands) {

    if (hands.rightHandState === 'closed') {
      /* Returns the index of image "clicked on" based on its index in the 
       * images array (in this example 0-7)
       *  TODO: 
       *    - Perhaps set timeout so it is not immediate - unsure
       */
       // var t1 = setTimeout(func,, 200); 

        let choosenIndex = -1; 
        let x_coord = hand.depthX * myCanvas.width;
        let y_coord = hand.depthY * myCanvas.height; 
        for (let index = 0; index < images.length; ++index) {
          if ((images[index].x <= x_coord) && x_coord <= (images[index].x + images[index].w) &&
              (images[index].y <= y_coord) && y_coord <= (images[index].y + images[index].h)) {
            choosenIndex = index; 
            break;
          }
        }
       console.log(choosenIndex);
        if (choosenIndex != -1) {
          displayImage(choosenIndex);
        }
        
    }
  } 

  background(0);
  addImages();

  kinectron.getHands(func);

  fill(255); 
  ellipse(hand.depthX * myCanvas.width, hand.depthY * myCanvas.height, 25, 25);

}
