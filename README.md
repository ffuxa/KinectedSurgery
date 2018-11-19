# KinectedSurgery
EECS495 Senior Project

# Steps to run:

1. Download the project by running the command: git clone https://github.com/eyile/KinectedSurgery.git
2. Download the kinectron server (https://kinectron.github.io/docs/server.html)
3. Open and run the kinectron-server application. 
4. Go to the app folder in the project directory.
5. [Make sure node and npm and yarn are installed.](https://nodejs.org/en/download/)
6. Go to KinectedSurgery/app/client/src/index.js and change the variable "ip_kinectron" to the ip displayed in the kinectron-server app. Save the document.  
7. Run `npm i` to install the node modules.
8. Run `npm run start` to run the program.
9. Open browser at localhost:3000

# Features and How to Use

* Use hand motions described below to navigate through your file tree. Folder and images are supported in Beta. Other types will be blank. 
* Type the file path into the text box and press enter. Navigation in the file tree starts here. 
* The home window displays 8 images. Bottom right and bottom left are fixed instruction panels. 
* A cursor on screen will help guide the right hand movement. 
* Swipe up quickly with right hand to go up to the parent directory.
* Swipe down quickly with right hand to disable tracking. Do the same motion to re-enable. 
* Swipe right/left quickly with right hand to scroll through the objects in a folder.  
* Close right hand in a fist while hovering on an image to select it and open it.
* Once an image is opened, lift your left hand and close it in a fist to zoom in. Do a lasso (index and middle finger extended) to zoom further. 
* Do a right hand lasso to go back to the folder.
