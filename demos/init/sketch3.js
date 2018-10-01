// declare IP address, fill in the IP address from your server
let kinectronIpAddress = "35.3.55.163";

// declare kinectron
let kinectron = null;

// hold beach image
let beach;

function preload() {
  beach = loadImage("./beach.jpg");
}

function setup() {
  createCanvas(640, 426);
  background(255);

  initKinectron();

}

function initKinectron() {
  // Define and create an instance of kinectron
  kinectron = new Kinectron(kinectronIpAddress);

  // Connect with application over peer
  kinectron.makeConnection();

  // Start the key camera and define a callback for when an image is received 
  kinectron.startKey(goToBeach);

}

function draw() {

}

function goToBeach(img) {
  // once a kinectron image is loaded
  loadImage(img.src, function(loadedImage) {

    //draw the beach image, then the kinectron key image
    image(beach, 0, 0);
    image(loadedImage, 0, 0);
  });
}
