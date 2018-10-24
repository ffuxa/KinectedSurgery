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
  // for (; i < 8; ++i) {
  //   let img = new Img(loadImage('images/danny.jpg'));
  //   images.push(img);  
  // }
  let img = new Img(loadImage('images/danny.jpg'));
  images.push(img);  
  img = new Img(loadImage('images/lefthand.jpg'));
  images.push(img);  
  img = new Img(loadImage('images/danny_guy.jpg'));
  images.push(img);  
  img = new Img(loadImage('images/danny_laugh.jpg'));
  images.push(img);  
  img = new Img(loadImage('images/danny_mm.jpg'));
  images.push(img);  
  img = new Img(loadImage('images/danny_old.jpg'));
  images.push(img);  
  img = new Img(loadImage('images/danny_orange.jpg'));
  images.push(img);  
  img = new Img(loadImage('images/righthand.jpg'));
  images.push(img);  
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

function displayImage(position, zoom) {
  const x = (windowWidth - images[position].w * zoom) / 2;
  const y = (windowHeight - images[position].h * zoom) / 2;
  image(images[position].imgObj, x, y, images[position].w * zoom, images[position].h * zoom);
  // console.log(images[position]);
}

function initKinectron() {
  // Define and create an instance of kinectron
  kinectron = new Kinectron("35.2.11.55");

  // Connect with server over peer
  kinectron.makeConnection();

  // Request all tracked bodies and pass data to your callback
  kinectron.startTrackedJoint(kinectron.HANDRIGHT, drawRightHand);
}




var curIndex = -1; 
var zoom = 1; 

function drawRightHand(hand) {

  var func = function logHandData(hands) {

    console.log(hands.rightHandState); 

    if (hands.rightHandState === 'closed') {
      /* Returns the index of image "clicked on" based on its index in the 
       * images array (in this example 0-7)
       *  TODO: 
       *    - Perhaps set timeout so it is not immediate - unsure
       */
       // var t1 = setTimeout(func,, 200); 

      let chosenIndex = -1;
      let x_coord = hand.depthX * myCanvas.width;
      let y_coord = hand.depthY * myCanvas.height; 

      for (let index = 0; index < images.length; ++index) {
        if ((images[index].x <= x_coord) && x_coord <= (images[index].x + images[index].w) &&
            (images[index].y <= y_coord) && y_coord <= (images[index].y + images[index].h)) {
          chosenIndex = index; 
          break;
        }
      }
      console.log(chosenIndex);
      if (chosenIndex == -1 || chosenIndex == 1 || chosenIndex == 7) {
        chosenIndex = -1; 
      } else {
        curIndex = chosenIndex; 
      }
    } else if (hands.rightHandState === 'lasso') {
      curIndex = -1;
    }

    if (hands.leftHandState === 'closed') {
      zoom = 2; 
    } else if (hands.leftHandState === 'lasso') {
      zoom = 3; 
    } else {
      zoom = 1; 
    }
  } 

  background(0);

  kinectron.getHands(func);
  if (curIndex == -1) {
    addImages();
  } else {
    displayImage(curIndex, zoom);
  }



  fill(255); 
  ellipse(hand.depthX * myCanvas.width, hand.depthY * myCanvas.height, 25, 25);

}
