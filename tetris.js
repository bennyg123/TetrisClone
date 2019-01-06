const width = 12;
const height = 22;
const blockSize = 30;

//Global Variables
var board, colorValues, row, col, player, currentTime, down, endGame;

//JSON object used to store a string representation of the tetrominos
//Also stores the block size to avoid calculating square roots (which are quite expensive)
const tetrominos = {
    "I" : { 
        "value" : "0100010001000100",
        "block" : 4
    },
    "J" : {
        "value" : "020020220",
        "block" : 3
    },
    "L" : {
        "value" : "030030033",
        "block" : 3
    },
    "O" : {
        "value" : "4444",
        "block" : 2
    },
    "S" : {
        "value" : "055550000",
        "block" : 3
    },
    "Z" : {
        "value" : "660066000",
        "block" : 3
    },
    "T" : {
        "value" : "060666000",
        "block" : 3
    }
}

//This is a function used do an in place rotation of 1d array to a 2d array
//The reasoning behind using a string to represent the blocks was to use this function
//which was alot easier then rotating a matrix
function getRotateValue(rotation, x, y, n) {
    switch (rotation) {
        case 0:
            return (x*n+y);
        case 1:
            return (n*(n-1))+x-(n*y);
        case 2:
            return (((n*n)-1)-(n*x))-y;
        case 3:
        default:
            return (n-1)-x+(n*y);
            
    }
}

//Start
function setup() {
    //Start Board Setup

    board = new Array(height);
    for (row = 0; row < height; row++) {
        board[row] = new Array(8,0,0,0,0,0,0,0,0,0,0,8);
    }
    board[height-1] = new Array(width).fill(8);
    endGame = false;
    //End Board Setup

    //Color Values are constant but the actual color object isnt accessible until P5.js calls Setup
    //Thus we intialize it here
    colorValues =  [
        color(211, 211, 211), //Gray
        color(220, 20, 60), //Crimson
        color(255, 255, 0), //Yellow
        color(255, 0, 255), //Fuchsia
        color(65, 105, 225), //Royalblue 
        color(255, 140, 0), //Orange
        color(135, 206, 235), //Skyblue
        color(34, 139, 34), //Forestgreen
        color(0, 0, 0), //Black
    ]
    
    createCanvas((width-2)*blockSize, (height-1)*blockSize); //Takes away the border area
    frameRate(30); //Slows the framerate down to allow higher reaction time

    down = false;//In order for the game to know the button is continously being pressed we have a variable here
    
    //Initialize the player object
    player = new Player();
    player.drawOnBoard();

    //Timer to drop the piece every 500 ms
    currentTime = millis();
}

function draw() {

    for (row = 0; row < height-1; row++) {
        for (col = 1; col < width-1; col++) { 
            if (board[row][col] != 0) {
                stroke(0,0,0)
            }
            fill(colorValues[board[row][col]]);
            rect((col-1)*blockSize, row*blockSize, blockSize, blockSize);
            noStroke();
        }
    }
    
    if ((!endGame) && (down || millis() - currentTime > 500)) {
        player.drop();
        currentTime = millis();
    }
}

function keyPressed() {

    if(endGame) {
        return;
    }

    if (keyCode === LEFT_ARROW) {
        player.takeOffBoard();
        player.x -= 1;
        if (!player.detectCollision()) {
            player.drawOnBoard();
        }else {
            player.x += 1;
            player.drawOnBoard();
        }
        
    }else if (keyCode === RIGHT_ARROW) {
        player.takeOffBoard();
        player.x += 1;
        if (!player.detectCollision()) {
            player.drawOnBoard();
        }else {
            player.x -= 1;
            player.drawOnBoard();
        }
    }else if (keyCode === UP_ARROW) { 
        player.takeOffBoard();
        player.rotation = ((player.rotation + 1) % 4);
        if (!player.detectCollision()) {
            player.drawOnBoard();
        }else {
            player.rotation = ((player.rotation + 3) % 4);
            player.drawOnBoard();
        }
    }else if(keyCode === DOWN_ARROW) {
        player.takeOffBoard();
        player.rotation = ((player.rotation + 3) % 4);
        if (!player.detectCollision()) {
            player.drawOnBoard();
        }else {
            player.rotation = ((player.rotation + 1) % 4);
            player.drawOnBoard();
        }
    }else if(keyCode === 32) {
        down = true;
    }
}

function keyReleased() {
    if (keyCode === 32) {
        down = false;
    }
}

class Player {
    constructor() {
        this.bagOfPieces = [];
        this.currentPiece = this.getRandomPiece();
        this.x = 4;
        this.y = 0;
        this.rotation = 0;
        this.end = false;
    }

    //Detects if we are colling with the wall or another piece
    detectCollision() {
        //console.log(this.x, this.y);
        for(row = 0; row < tetrominos[this.currentPiece]["block"] && row+this.y < height;row++) {
            for(col = 0; col < tetrominos[this.currentPiece]["block"] && col+this.x < width; col++) {
                if (board[row+this.y][col+this.x] != 0 && tetrominos[this.currentPiece].value[getRotateValue(this.rotation, row, col, tetrominos[this.currentPiece]["block"])] != 0) {
                    return true; //Detected collision
                }
            }
        }
        return false;
    }

    //Checks if there are cleared rows
    clear() {
        let fullRow = true;
        let rowsClear = Array();

        for (row = 0; row < height-1; row++) {
            //console.log(fullRow);

            for (col = 1; col < width-1; col++) { 
                //console.log(board[row][col]);
                if (board[row][col] == 0) { 
                    fullRow = false;
                }
            }

            //console.log(fullRow);

            if (fullRow) {
                rowsClear.push(row);
            }
            fullRow = true;
        }

        //Find the cleared rows take them out of the array and adds the same number of blank rows to the top of the board
        if (rowsClear.length > 0) {
            board.splice(rowsClear[0], rowsClear.length);
            for (row = 0; row < rowsClear.length; row++) {
                board.unshift((new Array(8,0,0,0,0,0,0,0,0,0,0,8)));
            }
        }
        //console.log(board);
    }

    //Gets a random piece from the bag, this was apparently a more fair way of choosing the pieces
    //As truely random is too random and difficult
    getRandomPiece() {
        if (this.bagOfPieces.length == 0) {
            this.bagOfPieces = [
                "I", "I",
                "J", "J",
                "L", "L",
                "O", "O",
                "S", "S",
                "Z", "Z",
                "T", "T"
            ];
        }
        return this.bagOfPieces.splice(int(random(0, this.bagOfPieces.length)), 1)
    }

    //Draws the piece onto the board
    drawOnBoard() {
        for(row = 0; row < tetrominos[this.currentPiece]["block"] && row+this.y < height; row++) { //width aka row
            for(col = 0; col < tetrominos[this.currentPiece]["block"] && col+this.x < width; col++) { //height aka col
                if (board[row+this.y][col+this.x] == 0 ) {
                    board[row+this.y][col+this.x] = tetrominos[this.currentPiece].value[getRotateValue(this.rotation, row, col, tetrominos[this.currentPiece]["block"])];
                }
            }
        }
    }

    //Takes the piece off the board
    takeOffBoard() {
        for(row = 0; row < tetrominos[this.currentPiece]["block"] && row+this.y < height;row++) { //width
            for(col = 0; col < tetrominos[this.currentPiece]["block"] && col+this.x < width; col++) { //height
                if (tetrominos[this.currentPiece].value[getRotateValue(this.rotation, row, col, tetrominos[this.currentPiece]["block"])] != 0) {
                    board[row+this.y][col+this.x] = 0;
                }
            }
        }
    }

    //Drops the piece one space
    drop() {
        this.takeOffBoard();
        this.y += 1;
        if (!this.detectCollision()) {
            this.drawOnBoard();
        }else {
            //The reason for this boolean is to allow the player 500ms to make another move at the end, ie: T-spin
            if (!this.end) {
                this.end = true;
            }else {
                //Draws the last piece on the board
                this.y -= 1;
                this.drawOnBoard();

                //Checks for cleared lines
                this.clear();
                
                //Reset the pieces
                this.end = false;
                this.y = 0;
                this.x = 4;
                this.rotation = 0;
                this.currentPiece = this.getRandomPiece();

                //If we have a collision this means the game has ended
                //Due to the way detectCollision works we have to have 
                //drawOnBoard in the if statments
                if(!this.detectCollision()) {
                    this.drawOnBoard();
                }else {
                    this.drawOnBoard();
                    endGame = true;
                }
                return;
            }
            this.y -= 1;
            this.drawOnBoard();
        }
    }
}