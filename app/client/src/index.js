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

/*
 * Calls fetch_files GET api endpoint from file_system_server, which
 *  returns a list of the filenames (NOT full path) in the given directory  
 */
async function fetchFiles(dir_path) {
  const response = await fetch('http://localhost:5000/fetch_files', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path: dir_path })
  });

  const body = await response.json();
  if (response.status !== 200) throw Error(body.message);
  return body;
};

/*
 * P5.js function (see documentation)
 * Runs before any other function  
 */
async function preload() {
  // TODO: Update this to not be hardcoded
//   const dir_path = "/Users/Fabian/Documents/College/Senior_2018/Semester_1/EECS_495/KinectedSurgery/third-try/client/src/sample_files/";
//   let files = await fetchFiles(dir_path);
//   files = files["files"];

//   let i, img;
//   for (i = 0; i < files.length; ++i) {
//     img = new Img(loadImage('sample_files/' + files[i]));
//     images.push(img);
//   }

//   myCanvas = createCanvas(windowWidth, windowHeight);
//   background(0);
//   addImages();
}

async function setup() {
  const dir_path = "/Users/Fabian/Documents/College/Senior_2018/Semester_1/EECS_495/KinectedSurgery/third-try/client/src/sample_files/";
  let files = await fetchFiles(dir_path);
  files = files["files"];

  let i, img;
  for (i = 0; i < files.length; ++i) {
    img = new Img(loadImage('sample_files/' + files[i]));
    images.push(img);
  }

  // Create a p5 canvas
  myCanvas = createCanvas(windowWidth, windowHeight);
  
  // Set background color
  background(0);

  // Add images
  addImages();

  // Initialize Kinectron
//   initKinectron();
}

function addImages() {
  fill('rgb(135, 206, 250)');   // light blue

  const margin = 40;

  // This guarantees that exactly 8 images fit in screen (2 rows, 4 columns)
  const file_width = (window.innerWidth - (margin * 5)) / 4;
  const file_height = (window.innerHeight - (margin * 3)) / 2;

  let x_coord;
  let image_index = 0;
  console.log(images);

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
