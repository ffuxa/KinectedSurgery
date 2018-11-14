// Create a p5 canvas (learn more at p5js.org)
let myCanvas = null;

// Declare kinectron 
let kinectron = null;

// Store all images in array
let images = [];

// Current page being displayed
let current_page = 0;

// Left hand tutorial image
let left_tutorial_img;

// Right hand tutorial image
let right_tutorial_img;

// Used for tracking swipe motion
let swipeBuf = [];

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

function preload() {
  // Left hand tutorial image
  left = createImg('images/lefthand.jpg');
  left.hide();
  left_tutorial_img = new Img(left);

  // Right hand tutorial image
  right = createImg('images/righthand.jpg');
  right.hide();
  right_tutorial_img = new Img(right);
}

async function setup() {
  // const dir_path = "/Users/e/Pictures/";
  const dir_path = "/Users/Fabian/Documents/College/Senior_2018/Semester_1/EECS_495/KinectedSurgery/app/client/src/sample_files/";
  let res = await fetchFiles(dir_path);
  files = res["files"].filter(file => !file.is_dir).map(x => x.path);
  folders = res["files"].filter(file => file.is_dir).map(x => x.path);

  let i, img;
  for (i = 0; i < files.length; ++i) {
    img = createImg('http://localhost:5000/static/' + files[i]);
    img.hide();
    images.push(new Img(img));
  }

  // Create a p5 canvas
  myCanvas = createCanvas(windowWidth, windowHeight);
  myCanvas.style('z-index', 100);
  myCanvas.style('position', 'fixed');
  
  // Set background color
  background(0, 0, 0, 0);

  // Add images
  addImages();

  // Initialize Kinectron
  initKinectron();
}

function showImage(imgObj, x, y, w, h) {
  imgObj.position(x, y);
  imgObj.size(w, h);
  imgObj.show();
}

function nextPage() {
  current_page = current_page + 1;
  addImages();
}

function addImages() {
  const margin = 40;

  // This guarantees that exactly 8 images fit in screen (2 rows, 4 columns)
  const file_width = (window.innerWidth - (margin * 5)) / 4;
  const file_height = (window.innerHeight - (margin * 3)) / 2;

  let x_coord;
  let image_index = 0;

  images_to_display = images.slice(current_page * 6, current_page * 6 + 7);
  // console.log(images_to_display);

  // Display each image
  for (x_coord = margin; x_coord < window.innerWidth; x_coord += file_width + margin) { 
    let y_coord;

    for (y_coord = margin; y_coord < window.innerHeight; y_coord += file_height + margin) {
        if (image_index == 1) {
          showImage(left_tutorial_img.imgObj, x_coord, y_coord, file_width, file_height);
        }
        else if (image_index == 7) {
          showImage(right_tutorial_img.imgObj, x_coord, y_coord, file_width, file_height);
        }
        else if (image_index < images_to_display.length) {
          images_to_display[image_index].coordinates(x_coord, y_coord, file_width, file_height);
          showImage(images_to_display[image_index].imgObj, x_coord, y_coord, file_width, file_height);
        }

        image_index += 1;
    }
  }
}

function displayImage(position, zoom) {
  images.forEach(function(img) {
    img.imgObj.hide();
  });
  const x = (windowWidth - images[position].w * zoom) / 2;
  const y = (windowHeight - images[position].h * zoom) / 2;
  // image(images[position].imgObj, x, y, images[position].w * zoom, images[position].h * zoom);
  images[position].imgObj.position(x, y);
  images[position].imgObj.size(images[position].w * zoom, images[position].h * zoom);
  images[position].imgObj.show();
}

function initKinectron() {
  // Define and create an instance of kinectron
  kinectron = new Kinectron("35.1.72.242");

  // Connect with server over peer
  kinectron.makeConnection();

  // Request all tracked bodies and pass data to your callback
  kinectron.startTrackedJoint(kinectron.HANDRIGHT, drawRightHand);
}

var curIndex = -1; 
var zoom = 1;

function imageIndexAtHandCoords(x_coord, y_coord) {
  for (let index = 0; index < images.length; ++index) {
    if ((images[index].x <= x_coord) && x_coord <= (images[index].x + images[index].w) &&
        (images[index].y <= y_coord) && y_coord <= (images[index].y + images[index].h)) {
      return index; 
    }
  }

  return -1;
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

      let chosenIndex = -1;
      let x_coord = hand.depthX * myCanvas.width;
      let y_coord = hand.depthY * myCanvas.height; 

      chosenIndex = imageIndexAtHandCoords(x_coord, y_coord);

      if (chosenIndex == -1 || chosenIndex == 1 || chosenIndex == 7) {
        chosenIndex = -1; 
      } else {
        curIndex = chosenIndex; 
      }
    } 
    else if (hands.rightHandState === 'lasso') {
      curIndex = -1;
    }
    else {
      let index = imageIndexAtHandCoords(hand.depthX * myCanvas.width, hand.depthY * myCanvas.height);

      if (index !== -1) {
        // TODO: Add a "border" around the image I am over;
        // noFill();
        // fill('red');
        // rect(images[index].x, images[index].y, images[index].w, images[index].h);
      }
    }

    if (hands.leftHandState === 'closed') {
      zoom = 2; 
    } 
    else if (hands.leftHandState === 'lasso') {
      zoom = 3; 
    } 
    else {
      zoom = 1; 
    }
  } 

  clear(); 

  kinectron.getHands(func);
  if (curIndex == -1) {
    addImages();
  } else {
    displayImage(curIndex, zoom);
  }

  fill(255); 
  ellipse(hand.depthX * myCanvas.width, hand.depthY * myCanvas.height, 25, 25);

  swipeBuf.push(hand.depthX);
  if (swipeBuf.length > 40) {
    swipeBuf.shift();
  }  
  if (Math.max(...swipeBuf) - hand.depthX > 0.5) {
    console.log('swipe right');
    nextPage();
    swipeBuf = [];
  }
}
