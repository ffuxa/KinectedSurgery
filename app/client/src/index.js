// Create a p5 canvas (learn more at p5js.org)
let myCanvas = null;

let ip_kinectron = "35.2.80.207"; 

// Declare kinectron 
let kinectron = null;

// Store all files in array
let files = [];

// Current page being displayed
let current_page = 0;

// Left hand tutorial image
let left_tutorial_img;

// Right hand tutorial image
let right_tutorial_img;

// Folder icon for FolderView
let folder_img;

// Used for tracking swipe motion
let swipeBuf = [];

// Used for jitter removal
let leftStateBuf = [];
let rightStateBuf = [];

// Current directory (starts off as root). TODO: Unhardcode!!!!!!
// let current_dir = "/Users/Fabian/Documents/College/Senior_2018/Semester_1/EECS_495/KinectedSurgery/app/client/src/sample_files/";
let current_dir = "/Users/User/Documents/KinectedSurgery/app/client/src/sample_files/";

// The different views for the application
let ScreenMode = Object.freeze({ "FolderView": 1, "FileView": 2 });
let currentScreen = ScreenMode.FolderView;

// The different supported file types. Might change in future versions
let FileType = Object.freeze({ "Image": 1, "Folder": 2 });

// Loading variable
let loading = false;

// File object
function File(name, icon, type) {
  this.name = name; // type: string
  this.icon = icon; // type: Img
  this.type = type; // type: FileType
}

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
  // Makes sure path ends with a backslash
  if (dir_path[dir_path.length - 1] !== '/') {
    dir_path += '/';
  }

  const response = await fetch('http://localhost:5000/fetch_files', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path: dir_path })
  });

  if (response.status !== 200) {
    displayError("Error: Not a valid path!");
    throw Error(response.message);
  }

  const body = await response.json();
  return body;
};

async function fetchAndUpdateCanvas(dir_path) {
  clear();
  let res = await fetchFiles(dir_path);
  server_files = res["files"];
  clearFileIcons();
  files = []; // Empty array
  current_page = 0;
  current_dir = dir_path;
  document.getElementById("dir_input").value = current_dir;

  for (let i = 0; i < server_files.length; ++i) {
    const path = 'http://localhost:5000/static/' + server_files[i].path;

    if (server_files[i].is_dir) {
      files.push(new File(server_files[i].path, folder_img, FileType.Folder));
    }
    else {
      // NOTE: This assumes all non-directory elements are images. 
      //  This is going to change if we add support to other file types,
      //  like PDFs and video
      const img = createImg(path);
      img.hide();
      const icon = new Img(img); 
      files.push(new File(server_files[i].path, icon, FileType.Image));
    }
  }

  // Add files
  addFileIconsToCanvas();
}

/*
 * This P5.js function runs before setup
 */
function preload() {
  // Left hand tutorial image
  let left = createImg('images/lefthand.jpg');
  left.hide();
  left_tutorial_img = new Img(left);

  // Right hand tutorial image
  let right = createImg('images/righthand.jpg');
  right.hide();
  right_tutorial_img = new Img(right);

  // Folder Icon
  let folder = createImg('images/folder-icon.png');
  folder.hide();
  folder_img = new Img(folder);
}

/*
 * First function to run after calling preload
 */
async function setup() {
  // Create a p5 canvas
  myCanvas = createCanvas(windowWidth, windowHeight);
  myCanvas.style('z-index', 100);
  myCanvas.style('position', 'fixed');
  
  // Set background color
  background(255, 255, 255, 0);

  // Initialize Kinectron
  initKinectron();

  // Helper function used for entering custom directory using keyboard
  listenForEnter();

  // Prompt user for directory
  fill('white');
  textFont('Helvetica');
  textSize(42);
  textAlign(CENTER);
  text("Enter starting directory above", windowWidth/2, windowHeight/2 - 45);
}

function showFile(imgObj, x, y, w, h) {
  imgObj.style('border-radius', '10px');
  imgObj.position(x, y);
  imgObj.size(w, h);
  imgObj.show();
}

function nextPage() {
  if ((current_page + 1) * 6 <= files.length) {
    current_page = current_page + 1;
    addFileIconsToCanvas();
  }
  else {
    displayError("Error: No more files to show!");
  }
}

function prevPage() {
  if ((current_page - 1) * 6 >= 0) {
    current_page = current_page - 1;
    addFileIconsToCanvas();
  }
  else {
    displayError("Error: No more files to show!");
  }
}

function goToParentDir() {
  if (current_dir === "/") {
    displayError("Error: Parent directory doesn't exist!");
  }
  else {
    let path = current_dir.slice(0, -1) // Remove the last '/' char
    path = path.substring(0, path.lastIndexOf('/')) + '/'; // Remove current dir name
    fetchAndUpdateCanvas(path);
  }
}

function addFileIconsToCanvas() {
  clearFileIcons();
  const margin = 80;

  // This guarantees that exactly 8 icons fit in screen (2 rows, 4 columns)
  const file_width = (window.innerWidth - (margin * 5)) / 4;
  const file_height = (window.innerHeight - (margin * 3)) / 2;

  let x_coord;
  let file_index = 0;
  let i = 0;

  // This grabs 6 images at a time
  files_to_display = files.slice(current_page * 6, current_page * 6 + 7);

  // Display each image
  for (x_coord = margin; x_coord < window.innerWidth; x_coord += file_width + margin) { 
    let y_coord;

    for (y_coord = margin; y_coord < window.innerHeight; y_coord += file_height + margin) {
        if (i == 1) {
          showFile(left_tutorial_img.imgObj, x_coord, y_coord, file_width, file_height);
        }
        else if (i == 7) {
          showFile(right_tutorial_img.imgObj, x_coord, y_coord, file_width, file_height);
        }
        else if (file_index < files_to_display.length) {
          // Show icon
          files_to_display[file_index].icon.coordinates(x_coord, y_coord, file_width, file_height);
          showFile(files_to_display[file_index].icon.imgObj, x_coord, y_coord, file_width, file_height);

          // Show filename
          fill('white');
          // strokeWeight(0);
          textSize(12);
          textFont('Helvetica');
          textAlign(LEFT);
          text(files_to_display[file_index].name, x_coord + 65, y_coord + file_height - 40);

          // TODO: Add box or something to make filenames look better? Dunno
          // fill('black');
          // rect(x_coord + 65, y_coord + file_height - 40);

          file_index += 1;
        }

        ++i;
    }
  }
}

function displayFileFullScreen(position, zoom) {
  clearFileIcons();

  const x = (windowWidth - files_to_display[position].icon.w * zoom) / 2;
  const y = (windowHeight - files_to_display[position].icon.h * zoom) / 2;

  showFile(files_to_display[position].icon.imgObj, x, y, files_to_display[position].icon.w * zoom, files_to_display[position].icon.h * zoom);
}

function clearFileIcons() {
  files.forEach(function(file) {
    file.icon.imgObj.hide();
  });

  left_tutorial_img.imgObj.hide();
  right_tutorial_img.imgObj.hide();
}

function initKinectron() {
  // Define and create an instance of kinectron
  kinectron = new Kinectron(ip_kinectron);

  // Connect with server over peer
  kinectron.makeConnection();

  // Request all tracked bodies and pass data to your callback
  kinectron.startTrackedJoint(kinectron.HANDRIGHT, drawRightHand);
}

var curIndex = -1; 
var zoom = 1;

function fileIndexAtHandCoords(x_coord, y_coord) {
  for (let index = 0; index < files.length; ++index) {
    if ((files[index].icon.x <= x_coord) && x_coord <= (files[index].icon.x + files[index].icon.w) &&
        (files[index].icon.y <= y_coord) && y_coord <= (files[index].icon.y + files[index].icon.h)) {
      return index; 
    }
  }

  return -1;
}

function drawRightHand(hand) {
  var func = function logHandData(hands) {
    const stateBufSize = 3;
    if (leftStateBuf.length > 0 && leftStateBuf[leftStateBuf.length - 1] != hands.leftHandState) {
      leftStateBuf = [];
    } else {
      leftStateBuf.push(hands.leftHandState);
    }
    if (leftStateBuf.length > stateBufSize) {
      leftStateBuf.shift();
    }
    if (rightStateBuf.length > 0 && rightStateBuf[rightStateBuf.length - 1] != hands.rightHandState) {
      rightStateBuf = [];
    } else {
      rightStateBuf.push(hands.rightHandState);
    }
    if (rightStateBuf.length > stateBufSize) {
      rightStateBuf.shift();
    }

    if (!loading) {
      if (currentScreen === ScreenMode.FolderView) {
        if (rightStateBuf.length == stateBufSize && rightStateBuf[0] === 'closed') {
          /* Returns the index of file "clicked on" based on its index in the 
          * files array (in this example 0-7)
          *  TODO: 
          *    - Perhaps set timeout so it is not immediate - unsure
          */
          // var t1 = setTimeout(func,, 200); 

          let chosenIndex = -1;
          let x_coord = hand.depthX * myCanvas.width;
          let y_coord = hand.depthY * myCanvas.height; 

          chosenIndex = fileIndexAtHandCoords(x_coord, y_coord);
          console.log("chosenIndex: ", chosenIndex);

          if (chosenIndex == -1) {
            chosenIndex = -1; 
          } else {
            curIndex = chosenIndex; 
          }
        } 
        else if (rightStateBuf.length == stateBufSize && rightStateBuf[0] === 'lasso') {
          // goToParentDir();
        }
        else {
          let index = fileIndexAtHandCoords(hand.depthX * myCanvas.width, hand.depthY * myCanvas.height);

          if (index !== -1) {
            // Display border around file which the cursor is on top of
            stroke(135, 206, 250); // sets light-blue border around rect
            strokeWeight(6);
            noFill();
            rect(files_to_display[index].icon.x - 9, files_to_display[index].icon.y - 59, files_to_display[index].icon.w, files_to_display[index].icon.h);
          }
        }
      }
      // If in FileView
      else {
        if (rightStateBuf.length == stateBufSize && rightStateBuf[0] === 'lasso') {
          // This goes back to FolderView
          curIndex = -1;
        }

        if (leftStateBuf.length == stateBufSize && leftStateBuf[0] === 'closed') {
          zoom = 2; 
        } 
        else if (leftStateBuf.length == stateBufSize && leftStateBuf[0] === 'lasso') {
          zoom = 3; 
        }
        else if (leftStateBuf.length == stateBufSize && leftStateBuf[0] === 'open') {
          zoom = 1; 
        }
      }
    }
  }

  clear();

  kinectron.getHands(func);

  if (curIndex === -1) {
    addFileIconsToCanvas();
    currentScreen = ScreenMode.FolderView;
  }
  else if (files_to_display[curIndex].type === FileType.Folder) {
    let newPath = current_dir + files_to_display[curIndex].name + '/';
    curIndex = -1;
    loading = true;
    fetchAndUpdateCanvas(newPath);
    currentScreen = ScreenMode.FolderView;
    setTimeout(() => {
      loading = false;
    }, 2000);
  }
  else {
    displayFileFullScreen(curIndex, zoom);
    currentScreen = ScreenMode.FileView;
  }

  fill(255);
  ellipse(hand.depthX * myCanvas.width, hand.depthY * myCanvas.height, 25, 25);

  swipeBuf.push(hand.depthX);
  if (swipeBuf.length > 15) {
    swipeBuf.shift();
  }  
  if (Math.max(...swipeBuf) - hand.depthX > 0.4) {
    console.log('swipe right');
    nextPage();
    swipeBuf = [];
  }
  if (hand.depthX - Math.min(...swipeBuf) > 0.4) {
    console.log('swipe left');
    prevPage();
    swipeBuf = [];
  }
}

function displayError(errorMsg) {
  fill('red');
  textFont('Helvetica');
  textSize(32);
  textAlign(CENTER);
  let t = text(errorMsg, windowWidth/2, windowHeight/2 - 45);

  setTimeout(() => {
    addFileIconsToCanvas();
  }, 2000);
}

function listenForEnter() {
  document.getElementById("dir_input").addEventListener("keyup", function(event) {
    // Cancel the default action, if needed
    event.preventDefault();
    // Number 13 is the "Enter" key on the keyboard
    if (event.keyCode === 13) {
      // Trigger
      fetchAndUpdateCanvas(document.getElementById('dir_input').value);
    }
  });
}
