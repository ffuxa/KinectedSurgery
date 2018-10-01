// Create a p5 canvas (learn more at p5js.org)
var myCanvas = null;

// Declare kinectron 
var kinectron = null;

function setup() {
  // Create a p5 canvas
  myCanvas = createCanvas(500, 500);
  
  // Set background color
  background(0);

  // Initialize Kinectron
  initKinectron();
}


function initKinectron() {

  // Define and create an instance of kinectron
  kinectron = new Kinectron("35.3.55.163");

  // Connect with server over peer
  kinectron.makeConnection();

  // Request all tracked bodies and pass data to your callback
  kinectron.startTrackedBodies(drawSkeleton);
}

// The incoming "body" argument holds the Kinect skeleton data 
function drawSkeleton(body) {

  // Clear the background
  background(0, 20);

  // Draw a circle at the location of each joint
  for(var i = 0; i < body.joints.length; i++) {

    // Get the joint
    var joint = body.joints[i];

    // Set the drawing color
    fill(100);
    
    // Map Kinect joint data to canvas size; Draw the circle
    ellipse(joint.depthX * myCanvas.width, joint.depthY * myCanvas.height, 15, 15);
  }
}