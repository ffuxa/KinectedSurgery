// Create a p5 canvas (learn more at p5js.org)
let myCanvas = null;

let ip_kinectron = "35.2.68.53";

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
let folder_img_path = 'images/folder-icon.png';
let video_img_path = 'images/video.png'; 

// Used for multi-body tracking
let trackingId = null;
let lastTrackedTimes = {};

// Used for tracking swipe motion
let xSwipeBuf = [];
let ySwipeBuf = [];

// Used for jitter removal
let leftStateBuf = [];
let rightStateBuf = [];

// Used for displaying video
// Default value is there for a reason! Don't remove!!
let videoPlayer = {
  'elt': {
    'style': "display: none;"
  }
};

// Determines if the video is playing or not
let playing = false;

function isEmpty(obj) {
  for (var key in obj) {
      if (obj.hasOwnProperty(key))
          return false;
  }
  return true;
}

// let videoSource = {};

// Current directory (starts off as root). TODO: Unhardcode!!!!!!
// let current_dir = "/Users/Fabian/Documents/College/Senior_2018/Semester_1/EECS_495/KinectedSurgery/app/client/src/sample_files/";
let current_dir = "/Users/User/Documents/KinectedSurgery/app/client/src/sample_files/";

// The different views for the application
let ScreenMode = Object.freeze({ "FolderView": 1, "FileView": 2 });
let currentScreen = ScreenMode.FolderView;

// The different supported file types. Might change in future versions
let FileType = Object.freeze({ "Image": 1, "Folder": 2, "Video": 3 });

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
      const img = createImg(folder_img_path);
      img.hide();
      const icon = new Img(img); 
      files.push(new File(server_files[i].path, icon, FileType.Folder));
    }
    else if (path.substr(-4) === '.mp4') {
      const img = createImg(video_img_path);
      img.hide();
      const icon = new Img(img); 
      files.push(new File(server_files[i].path, icon, FileType.Video));
    }
    // NOTE: This assumes all non-directory, non-mp4 elements are images. 
    //  This is going to change if we add support to other file types,
    //  like PDFs
    else {
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

  // setTimeout(() => displayVideoFullScreen(0), 4000);
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
  files_to_display = files.slice(current_page * 6, current_page * 6 + 6);

  // Display each image
  for (x_coord = margin; x_coord < window.innerWidth; x_coord += file_width + margin) { 
    let y_coord;

    for (y_coord = margin; y_coord < window.innerHeight; y_coord += file_height + margin) {
        if (i == 1) {
          left_tutorial_img.coordinates(x_coord, y_coord, file_width, file_height);
          showFile(left_tutorial_img.imgObj, x_coord, y_coord, file_width, file_height);
        }
        else if (i == 7) {
          right_tutorial_img.coordinates(x_coord, y_coord, file_width, file_height);
          showFile(right_tutorial_img.imgObj, x_coord, y_coord, file_width, file_height);
        }
        else if (file_index < files_to_display.length) {
          // Show icon
          files_to_display[file_index].icon.coordinates(x_coord, y_coord, file_width, file_height);
          showFile(files_to_display[file_index].icon.imgObj, x_coord, y_coord, file_width, file_height);

          // Show filename
          fill('white');
          // strokeWeight(0);
          noStroke(); 
          textSize(22);
          textFont('Helvetica');
          textAlign(LEFT);
          text(files_to_display[file_index].name, x_coord + 62, y_coord + file_height - 40);

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

  let file_to_display;
  if (position === 6) {
    file_to_display = left_tutorial_img;
  } else if (position === 7) {
    file_to_display = right_tutorial_img;
  } else {
    file_to_display = files_to_display[position].icon;
  }
  const x = (windowWidth - file_to_display.w * zoom) / 2;
  const y = (windowHeight - file_to_display.h * zoom) / 2;

  showFile(file_to_display.imgObj, x, y, file_to_display.w * zoom, file_to_display.h * zoom);
}

function displayVideoFullScreen(index) {
  clearFileIcons();
  clear();

  videoPlayer = createVideo(['http://localhost:5000/static/' + files_to_display[index].name]);
  videoPlayer.elt.style = "position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 75%; height: 75%; overflow: hidden; z-index: 9999;";
  videoPlayer.play();
  playing = true;

  // setTimeout(() => videoPlayer.pause(), 2000);
  // setTimeout(() => {
  //   addFileIconsToCanvas();
  //   currentScreen = ScreenMode.FolderView;
  // }, 6000);

  // videoPlayer = document.getElementById("video");
  // videoSource = document.getElementById("source");

  // videoSource.src = 'http://localhost:5000/static/' + files_to_display[index].name;
  // videoSource.type = 'video/mp4';
  // videoPlayer.style = "display: initial;";

  // videoPlayer.load();
  // videoPlayer.play();
}

function clearFileIcons() {
  if (videoPlayer.elt.style !== "display: none;") {
    videoPlayer.pause();
    videoPlayer.elt.style = "display: none;";
    playing = false;
  }

  files.forEach(function(file) {
    file.icon.imgObj.hide();
  });

  left_tutorial_img.imgObj.hide();
  right_tutorial_img.imgObj.hide();
}

function initKinectron() {
  // Define and create an instance of kinectron
  kinectron = new Kinectron(ip_kinectron);

  GLOBAL_KINECTRON = kinectron;

  // Connect with server over peer
  kinectron.makeConnection();

  $('input[name=hand_choice]:radio').on('change', function(event, ui) {
    if ($(this).val() == 'left') {
      kinectron.startTrackedJoint(kinectron.HANDLEFT, drawLeftHand);
    }
    if ($(this).val() == 'right') {
      kinectron.startTrackedJoint(kinectron.HANDRIGHT, drawRightHand);
    }
  });

  // Request all tracked bodies and pass data to your callback
  // kinectron.startTrackedJoint(kinectron.HANDLEFT, drawLeftHand);
  //kinectron.startTrackedJoint(kinectron.HANDRIGHT, drawRightHand);

  document.getElementById("disable").style.display = "none";
  document.getElementById("enable").style.display = "block";
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

  if ((left_tutorial_img.x <= x_coord) && x_coord <= (left_tutorial_img.x + left_tutorial_img.w) &&
      (left_tutorial_img.y <= y_coord) && y_coord <= (left_tutorial_img.y + left_tutorial_img.h)) {
    console.log('left tutorial');
    return 6; 
  } 
  if ((right_tutorial_img.x <= x_coord) && x_coord <= (right_tutorial_img.x + right_tutorial_img.w) &&
     (right_tutorial_img.y <= y_coord) && y_coord <= (right_tutorial_img.y + right_tutorial_img.h)) {
    console.log('right tutorial');
    return 7; 
  } 

  return -1;
}

let ABLE_STATE = "enabled"

function drawLeftHand(hand) {
  drawHand(hand, true);
}

function drawRightHand(hand) {
  drawHand(hand);
}

function insideVideo(hand) {
  let x_coord = hand.depthX * myCanvas.width;
  let y_coord = hand.depthY * myCanvas.height;

  const x_lower = myCanvas.width * .125;
  const x_higher = myCanvas.width * .875
  const y_lower = myCanvas.height * .125;
  const y_higher = myCanvas.height * .875;

  if ((x_coord >= x_lower && x_coord <= x_higher) ||
      (y_coord >= y_lower && y_coord <= y_higher)) {
    return true;
  }
  return false;
}

function drawHand(hand, flip=false) {
  var current = Date.now();
  if (trackingId != null && lastTrackedTimes[trackingId] != undefined && current - lastTrackedTimes[trackingId] > 1000) {
    trackingId = hand.trackingId;
  }
  lastTrackedTimes[hand.trackingId] = current;
  if (trackingId === null) {
    trackingId = hand.trackingId;
  } else if (trackingId != hand.trackingId) {
    return;
  }
  let x_coord = Math.min(myCanvas.width, 3 * (hand.depthX - 0.5) * myCanvas.width / 2 + myCanvas.width / 2);
  let y_coord = Math.min(myCanvas.height, 3 * (hand.depthY - 0.5) * myCanvas.height / 2 + myCanvas.height / 2);
  x_coord = Math.max(0, x_coord);
  y_coord = Math.max(0, y_coord); 
  var func = function logHandData(hands) {
    if (flip) {
      hands.leftHandState = [hands.rightHandState, hands.rightHandState = hands.leftHandState][0];
    }
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
      if (ABLE_STATE != "disabled" && currentScreen === ScreenMode.FolderView) {
        if (rightStateBuf.length == stateBufSize && rightStateBuf[0] === 'closed') {
          let chosenIndex = -1;

          chosenIndex = fileIndexAtHandCoords(x_coord, y_coord);

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
          let index = fileIndexAtHandCoords(x_coord, y_coord);

          if (index !== -1) {
            // Display border around file which the cursor is on top of
            stroke(135, 206, 250); // sets light-blue border around rect
            strokeWeight(6);
            noFill();
            if (index == 6) {
              rect(left_tutorial_img.x - 9, left_tutorial_img.y - 59, left_tutorial_img.w, left_tutorial_img.h);
            } else if (index == 7) {
              rect(right_tutorial_img.x - 9, right_tutorial_img.y - 59, right_tutorial_img.w, right_tutorial_img.h);
            } else {
              rect(files_to_display[index].icon.x - 9, files_to_display[index].icon.y - 59, files_to_display[index].icon.w, files_to_display[index].icon.h);
            }
          }
        }
      }
      // If in FileView
      else if (ABLE_STATE != "disabled") {
        if (rightStateBuf.length == stateBufSize && rightStateBuf[0] === 'lasso') {
          // This goes back to FolderView
          curIndex = -1;
        }
        
        if (curIndex !== -1 && files_to_display[curIndex].type === FileType.Video) {
          if (leftStateBuf.length == stateBufSize && leftStateBuf[0] === 'closed') {
            if (playing) {
              videoPlayer.pause();
              playing = false;
            }
          }
          else if (leftStateBuf.length == stateBufSize && leftStateBuf[0] === 'lasso') {
            if (!playing) {
              videoPlayer.play();
              playing = true;
            }
          }
        }
        else if (curIndex !== -1 && files_to_display[curIndex].type === FileType.Image) {
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
  }

  clear();

  kinectron.getHands(func);
  if (ABLE_STATE != "disabled") {
    if (curIndex === -1) {
      addFileIconsToCanvas();
      currentScreen = ScreenMode.FolderView;
    }
    else if (currentScreen === ScreenMode.FolderView) {
      if (curIndex < 6 && files_to_display[curIndex].type === FileType.Folder) {
        let newPath = current_dir + files_to_display[curIndex].name + '/';
        curIndex = -1;
        loading = true;
        fetchAndUpdateCanvas(newPath);
        currentScreen = ScreenMode.FolderView;
        setTimeout(() => {
          loading = false;
        }, 2000);
      }
      else if (curIndex < 6 && files_to_display[curIndex].type === FileType.Video) {
        displayVideoFullScreen(curIndex);
        currentScreen = ScreenMode.FileView;
      }
      else {
        displayFileFullScreen(curIndex, zoom);
        currentScreen = ScreenMode.FileView;
      }
    }
    // Triggers if currentScreen === ScreenMode.FileView
    else {
      if (files_to_display[curIndex].type === FileType.Image) {
        displayFileFullScreen(curIndex, zoom);
        currentScreen = ScreenMode.FileView;
      }
    }
  }

  fill(255);
  ellipse(x_coord, y_coord, 25, 25);


  xSwipeBuf.push(hand.depthX);
  if (xSwipeBuf.length > 6) {
    xSwipeBuf.shift();
  }  
  if (ABLE_STATE != "disabled" && Math.max(...xSwipeBuf) - hand.depthX > 0.32) {
    if (currentScreen === ScreenMode.FolderView) {
      nextPage();
    }
    else {
      do {
        curIndex += 1;
        curIndex %= files_to_display.length;
      } while(files_to_display[curIndex].type == ScreenMode.FileView);
      displayFileFullScreen(curIndex, zoom);
    }
    xSwipeBuf = [];
  }
  if (ABLE_STATE != "disabled" && hand.depthX - Math.min(...xSwipeBuf) > 0.32) {
    if (currentScreen === ScreenMode.FolderView) {
      prevPage();
    }
    else {
      do {
        curIndex -= 1;
        if(curIndex == -1) curIndex = files_to_display.length - 1;
      }
      while(files_to_display[curIndex].type == ScreenMode.FileView);
      displayFileFullScreen(curIndex, zoom);
    }
    xSwipeBuf = [];
  }

  ySwipeBuf.push(hand.depthY);
  if (ySwipeBuf.length > 6) {
    ySwipeBuf.shift();
  }  
  if (ABLE_STATE != "disabled" && Math.max(...ySwipeBuf) - hand.depthY > 0.32) {
    if (currentScreen === ScreenMode.FolderView) {
      goToParentDir();
    }
    ySwipeBuf = [];
  }
  if (hand.depthY - Math.min(...ySwipeBuf) > 0.32) {
    if (ABLE_STATE == "enabled") {
      document.getElementById("disable").style.display = "block";
      document.getElementById("enable").style.display = "none";
      ABLE_STATE = "buffer";
      setTimeout(function () {
        ABLE_STATE = "disabled";
      }, 1000);
    }
    else if (ABLE_STATE == "disabled") {
      document.getElementById("disable").style.display = "none";
      document.getElementById("enable").style.display = "block";
      ABLE_STATE = "buffer";
      setTimeout(function () {
        ABLE_STATE = "enabled";
      }, 1000);
    }
  }
}

function displayError(errorMsg) {
  // fill('red');
  // textFont('Helvetica');
  // textSize(32);
  // textAlign(CENTER);
  document.getElementById("errorMsg").innerHTML = errorMsg;
  // let t = text(errorMsg, windowWidth/2, windowHeight/2 - 45);

  setTimeout(() => {
    // addFileIconsToCanvas();
    document.getElementById("errorMsg").innerHTML = "";
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
