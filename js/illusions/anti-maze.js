define(
/* */ 
["jquery"], 
function($) {
  
  var canvas = null;
  var ctx = null;
  var keysPressed = {};
  var options = {
    tileSize: 32
  };
  
  var gameOver = false;
  var currentPuzzle = null;
  var currentPuzzleVerticalWalls = [];
  var currentPuzzleHorizontalWalls = [];
  var currentTargets = [];
  var playerMovingThruWalls = true;

  var playerPos = {x:0,y:0};
  var playerPadding = -1;
  var playerSize = -1;
  var targetPadding = -1;
  var targetRadius = -1;

  var ArrowKeys = {Left:"37",Up:"38",Right:"39",Down:"40"};
  var wallRegex = /[w]/;
  
  var adjustPlayerPos = function(x, y) {
    playerPos.x += x;
    playerPos.y += y;
    
    if (playerPos.x < 0) {
      playerPos.x = currentPuzzle.width - 1;
    }
    if (playerPos.y < 0) {
      playerPos.y = currentPuzzle.height - 1;
    }
    if (playerPos.x >= currentPuzzle.width) {
      playerPos.x = 0;
    }
    if (playerPos.y >= currentPuzzle.height) {
      playerPis.y = 0;
    }
  };
  
  var clearPlayer = function() { ctx.clearRect(playerX(), playerY(), playerSize, playerSize); };
  var clearTarget = function(index) { 
    /*ctx.clearRect(playerX() - 2, playerY() - 2, playerSize + 4, playerSize) + 4;*/
    currentTargets.splice(index, 1);
  };
  var drawPlayer = function() { ctx.fillRect(playerX(), playerY(), playerSize, playerSize); };

  var drawHorizontalWalls = function() {
    var walls = currentPuzzle.horizontal;
    for (var i = 0; i < walls.length; i++) {
      var line = parseLineData(walls[i].split(""));
      //console.log("drawing a horizontal line at (" + line.x + "," + line.y + ") for " + line.len + " tiles");
      storeHorizontalWalls(line);
      ctx.beginPath();
      ctx.moveTo(line.x - 1, line.y);
      ctx.lineTo(line.x + (options.tileSize * line.len) + 1, line.y);
      ctx.stroke();
    }
  };
  
  var drawTargets = function() {
    var targetEndArc = 2 * Math.PI; // 360 degress
    for (var t = 0; t < currentPuzzle.targets.length; t++) {
      var target =  currentPuzzle.targets[t];
      var targetX = target.x * options.tileSize + (options.tileSize / 2);
      var targetY = target.y * options.tileSize + (options.tileSize / 2);
      
      ctx.beginPath();
      ctx.arc(targetX, targetY, targetRadius, 0, targetEndArc);
      ctx.fill();
    }
  };
  
  var drawVerticalWalls = function() {
    var walls = currentPuzzle.vertical;
    for (var i = 0; i < walls.length; i++) {
      var line = parseLineData(walls[i].split(""));
      //console.log("drawing a vertical line at (" + line.x + "," + line.y + ") for " + line.len + " tiles");
      storeVerticalWalls(line);
      ctx.beginPath();
      ctx.moveTo(line.x, line.y - 1);
      ctx.lineTo(line.x, line.y + (options.tileSize * line.len) + 1);
      ctx.stroke();
    }
  };
  
  var init = function(opt) {
    options = $.extend(options, opt);
    canvas = document.getElementById("anti-maze"); 
    ctx = canvas.getContext("2d");
    
    playerPadding = options.tileSize * 0.125;
    playerSize = options.tileSize - (playerPadding * 2);
    targetPadding = options.tileSize * 0.125;
    targetRadius = Math.floor((options.tileSize - (targetPadding * 2)) / 2);
    
    $(window).keydown(function(event) {
      var key = event.keyCode + "";
      keysPressed[key] = true;
      return !isArrowKey[key];
    });
  
    $(window).keyup(function(event) {
      var key = event.keyCode + "";
      refreshSingleKey(key);
      return !isArrowKey[key];
    });
  };
  
  var isArrowKey = function(key) {
    for (var k in ArrowKeys) {
      if (key == ArrowKeys[k]) {
        return true;
      }
    }
    return false;
  };
  
  var isCrossingBoundary = function(x, y) {
    if (x) {
      return playerPos.x + x < 0 || playerPos.x + x >= currentPuzzle.width;
    } else if (y) {
      return playerPos.y + y < 0 || playerPos.y + y >= currentPuzzle.height;
    }
  };
  
  var isPlayerOnTarget = function() {
    for (var t in currentTargets) {
      var target = currentTargets[t];
      if (playerPos.x == target.x && playerPos.y == target.y) {
        return t;
      }
    }
    return -1;
  };
  
  var isWallHere = function(walls, x, y) {
    return !!walls[x] && !!walls[x][y];
  };
  
  var load = function(puzzle) {
    resizeCanvas(canvas, puzzle.width, puzzle.height, options.tileSize, options.tileSize);
    reset();
    currentPuzzle = $.extend(true, {}, puzzle);
    currentTargets = $.merge([], currentPuzzle.targets);
    
    drawVerticalWalls();
    drawHorizontalWalls();

    //wallsToString(currentPuzzleVerticalWalls);
    //wallsToString(currentPuzzleHorizontalWalls);
    
    adjustPlayerPos(currentPuzzle.player.x, currentPuzzle.player.y);
    drawPlayer();
    drawTargets();
  };
  
  var move = function(x, y) {
    //console.log("attempting to move from (" + playerPos.x + "," + playerPos.y + ") to (" + (playerPos.x + x) + "," + (playerPos.y + y) + ")");
    
    if (isCrossingBoundary(x, y) && !currentPuzzle.allowsWrapping) {
      //console.log("crossing boundary, wrapping allowed = " + currentPuzzle.allowsWrapping);
      return false;
    }

    var wallX = Math.max(playerPos.x, playerPos.x + x) - 0.5;
    var wallY = playerPos.y;
    var isWallThere = isWallHere(currentPuzzleVerticalWalls, wallX, wallY);
    var isAllowed = false; 
    if (x) {
      wallX = Math.max(playerPos.x, playerPos.x + x) - 0.5;
      wallY = playerPos.y;
      isWallThere = isWallHere(currentPuzzleVerticalWalls, wallX, wallY);
    } else if (y) {
      wallX = playerPos.x;
      wallY = Math.max(playerPos.y, playerPos.y + y) - 0.5;
      isWallThere = isWallHere(currentPuzzleHorizontalWalls, wallX, wallY);
    }

    isAllowed = !(playerMovingThruWalls ^ isWallThere);
    //console.log("wall at (" + wallX + "," + wallY + ")=" + isWallThere + ", allowed=" + isAllowed);

    if (isAllowed) {
      clearPlayer();
      adjustPlayerPos(x, y);
      
      var targetIndex = isPlayerOnTarget(); 
      if (targetIndex >= 0) {
        clearTarget(targetIndex);
        
        if (currentTargets.length == 0) {
          playerWins();
        }
      }
      
      drawPlayer();
    }
  };
  
  var parseLineData = function(lineData) {
    var tileX = parseInt(lineData[0], 36);
    var tileY = parseInt(lineData[1], 36);
    return {
      x: options.tileSize * tileX,
      y: options.tileSize * tileY,
      tileX: tileX,
      tileY: tileY,
      len : parseInt(lineData[2], 36)
    };
  };
  
  var playerWins = function() {
    gameOver = true;
    console.log("YOU WIN");
  }
  
  var playerX = function() { return playerPos.x * options.tileSize + playerPadding; };
  var playerY = function() { return playerPos.y * options.tileSize + playerPadding; };
  
  var refresh = function() {
    for (var k in keysPressed) {
      if (keysPressed[k]) {
        refreshSingleKey(k);
      }
    }
  };
  
  var refreshSingleKey = function(key) {
    if (gameOver) {
      return false;
    }
    switch (key) {
      case ArrowKeys.Left: move(-1, 0); return false;
      case ArrowKeys.Down: move(0, 1); return false;
      case ArrowKeys.Right: move(1, 0); return false;
      case ArrowKeys.Up: move(0, -1); return false;
    }
  };
  
  var reset = function() {
    playerPos.x = 0;
    playerPos.y = 0;
    playerMovingThruWalls = true;
    currentPuzzleVerticalWalls = [];
    currentPuzzleHorizontalWalls = [];
  };
  
  var resizeCanvas = function(canvas, width, height, tileWidth, tileHeight) {
    var w = width * tileWidth - 1;
    var h = height * tileHeight;
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    setCanvasOptions();
  };
  
  var setCanvasOptions = function() {
    ctx.lineWidth = 2;
  };
  
  var storeHorizontalWalls = function(line) {
    var wallY = line.tileY - 0.5;
    for (var i = line.tileX, n = line.tileX + line.len; i < n; i++) {
      var walls = currentPuzzleHorizontalWalls[i];
      if (!walls) {
        walls = [];
        currentPuzzleHorizontalWalls[i] = walls;
      }
      walls[wallY] = true;
    }
  };
  
  var storeVerticalWalls = function(line) {
    var wallX = line.tileX - 0.5;
    for (var i = line.tileY, n = line.tileY + line.len; i < n; i++) {
      var walls = currentPuzzleVerticalWalls[wallX];
      if (!walls) {
        walls = [];
        currentPuzzleVerticalWalls[wallX] = walls;
      }
      walls[i] = true;
    }
  };
  
  var wallsToString = function(walls) {
    for (var x in walls) {
      if (walls[x]) {
        for (var y in walls[x]) {
          if (walls[x][y]) {
            console.log("wall at (" + x + ", " + y + ")");
          }
        }
      }
    }
  };
  
  return {
    init: init,
    load: load,
    refresh: refresh
  }
});