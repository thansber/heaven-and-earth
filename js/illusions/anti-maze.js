define(
/* */ 
["jquery", "./data/anti-maze", "./constants"], 
function($, AntiMazeData, Constants) {
  
  var canvas = null;
  var ctx = null;
  var $board = null;
  var $menu = null;
  
  var keysPressed = {};
  var images = {};
  images[Constants.Types.Ocean] = {
    player: {
      name: "player-ocean.png",
      numAnimations:6
    }, 
    target: {
      name: "target-ocean.png",
      numAnimations: 5
    }
  };
  images[Constants.Types.Desert] = {player:{name:"player-desert.png"}, target:{name:"target-desert.png"}};
  var expectedImages = 4;
  var imagesLoaded = 0;
  var options = {
    tileSize: 34,
    playerSize: 27,
    targetSize: 23
  };
  
  var gameOver = false;
  var playerMovingThruWalls = true;
  var currentPuzzle = null;
  var currentPuzzleVerticalWalls = [];
  var currentPuzzleHorizontalWalls = [];
  var currentTargets = [];
  var currentPlayerFrame = 0;
  var currentTargetFrame = 0;

  var playerPos = {x:0,y:0};
  
  var animationCount = 0;

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
  
  var animate = function() {
    if (gameOver) {
      return;
    }
    requestAnimFrame(animate);
    animationCount++;
    if (animationCount % 10 == 0) {
      drawPlayer();
      drawTargets();
    }
  };
  
  var clearPlayer = function() { ctx.clearRect(playerX(), playerY(), options.playerSize, options.playerSize); };
  var clearTarget = function(index) { 
    var target = currentTargets[index];
    ctx.clearRect(targetX(target), targetY(target), options.targetSize, options.targetSize);
    currentTargets.splice(index, 1);
  };
  var drawHorizontalWalls = function(isShadow) {
    var walls = currentPuzzle.horizontal;
    for (var i = 0; i < walls.length; i++) {
      var line = parseLineData(walls[i].split(""));
      var wallStart = {x:line.x, y:line.y + 1.5};
      var wallEnd = {x:line.x + ctx.lineWidth + (options.tileSize * line.len), y:wallStart.y};
      
      //console.log("drawing a horizontal wall " + (iShadow ? "shadow " : " ") + "at (" + line.x + "," + line.y + ") for " + line.len + " tiles");
      storeHorizontalWalls(line);
      drawWall(isShadow ? currentPuzzle.wallShadowColor : "#000000",
               {x:wallStart.x + (isShadow ? ctx.lineWidth : 0), y:wallStart.y + (isShadow ? ctx.lineWidth : 0)},
               {x:wallEnd.x + (isShadow ? ctx.lineWidth : 0), y:wallEnd.y + (isShadow ? ctx.lineWidth : 0)});
    }
  };
  var drawPlayer = function() {
    var puzzlePlayerImage = images[currentPuzzle.type].player;
    var img = puzzlePlayerImage.img;
    var x = playerX();
    var y = playerY();
    ctx.drawImage(img, currentPlayerFrame * options.playerSize, 0, options.playerSize, options.playerSize, x, y, options.playerSize, options.playerSize);
    currentPlayerFrame++;
    if (currentPlayerFrame >= puzzlePlayerImage.numAnimations) {
      currentPlayerFrame = 0;
    }
  };  
  var drawTargets = function() {
    var puzzleTargetImage = images[currentPuzzle.type].target;
    var img = puzzleTargetImage.img;
    var targetEndArc = 2 * Math.PI; // 360 degress
    for (var t = 0; t < currentPuzzle.targets.length; t++) {
      var target =  currentPuzzle.targets[t];
      var x = targetX(target);
      var y = targetY(target);
      ctx.drawImage(img, currentTargetFrame * options.targetSize, 0, options.targetSize, options.targetSize, x, y, options.targetSize, options.targetSize);
      currentTargetFrame++;
      if (currentTargetFrame >= puzzleTargetImage.numAnimations) {
        currentTargetFrame = 0;
      }
    }
  };
  
  var drawVerticalWalls = function(isShadow) {
    var walls = currentPuzzle.vertical;
    for (var i = 0; i < walls.length; i++) {
      var line = parseLineData(walls[i].split(""));
      var wallStart = {x:line.x + 1.5, y:line.y};
      var wallEnd = {x:wallStart.x, y:line.y + ctx.lineWidth + (options.tileSize * line.len)};
      //console.log("drawing a vertical line at (" + line.x + "," + line.y + ") for " + line.len + " tiles");
      storeVerticalWalls(line);
      drawWall(isShadow ? currentPuzzle.wallShadowColor : "#000000",
               {x:wallStart.x + (isShadow ? ctx.lineWidth : 0), y:wallStart.y + (isShadow ? ctx.lineWidth : 0)},
               {x:wallEnd.x + (isShadow ? ctx.lineWidth : 0), y:wallEnd.y + (isShadow ? ctx.lineWidth : 0)});
    }
  };
  
  var drawWall = function(color, start, end) {
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  };
  
  var init = function(opt) {
    loadImages();
    options = $.extend(options, opt);
    canvas = document.getElementById("anti-maze"); 
    ctx = canvas.getContext("2d");
    $board = $(canvas).closest(".board");
    $menu = $("section.anti-maze").find(".menu");
    $win = $board.find(".win");
    
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
    
    $menu.click(function(e) {
      var $this = $(e.target);
      
      if ($this.is(".puzzle")) {
        var type = $this.parent().attr("class").split(" ")[0];
        var index = $this.index() - 1;
        var puzzle = AntiMazeData.lookup(type, index);
        load(puzzle);
        $menu.toggleClass("show");
      } else {
        $menu.toggleClass("show");
      }
      
      return false;
    });
  };
  
  var initMenu = function() {
    for (var type in AntiMazeData.All) {
      var $levels = $menu.find(".levels." + type);
      $levels.find("li:gt(0)").remove();
      var puzzles = AntiMazeData.All[type];
      $.each(puzzles, function(i, puzzle) {
        var levels = [];
        var c = 0;
        levels[c++] = "<li class=\"puzzle\">";
        levels[c++] = puzzle.name;
        levels[c++] = "</li>";
        $levels.append($(levels.join("")));
      });
    }
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
    $board.hide();
    $("body").removeClass().addClass(puzzle.type);
    resizeCanvas(canvas, puzzle.width, puzzle.height, options.tileSize, options.tileSize);
    reset();
    currentPuzzle = $.extend(true, {}, puzzle);
    currentTargets = $.merge([], currentPuzzle.targets);
    
    // wall shadows
    drawVerticalWalls(true);
    drawHorizontalWalls(true);

    // walls
    drawVerticalWalls(false);
    drawHorizontalWalls(false);

    //wallsToString(currentPuzzleVerticalWalls);
    //wallsToString(currentPuzzleHorizontalWalls);
    
    adjustPlayerPos(currentPuzzle.player.x, currentPuzzle.player.y);
    drawPlayer();
    drawTargets();
    setTitle(puzzle.name);
    $board.show();
    
    animate();
  };
  
  var loadImages = function() {
    $.each(images, function(i, typeImages) {
      for (var t in typeImages) {
        var img = new Image();
        img.onload = function() {
          imagesLoaded++;
          if (imagesLoaded == expectedImages) {
            console.log("all images loaded");
            initMenu();
          }
        };
        img.src = "images/anti-maze/" + typeImages[t].name;
        typeImages[t].img = img;
      }
    });
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
          return false;
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
    clearPlayer();
    $win.show();
  };
  
  var playerX = function() { return playerPos.x * options.tileSize + (2 * ctx.lineWidth); };
  var playerY = function() { return playerPos.y * options.tileSize + (2 * ctx.lineWidth); };
  
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
      case "80": drawPlayer(); return false;
    }
  };
  
  var reset = function() {
    gameOver = false;
    playerPos.x = 0;
    playerPos.y = 0;
    playerMovingThruWalls = true;
    currentPuzzleVerticalWalls = [];
    currentPuzzleHorizontalWalls = [];
    $win.hide();
  };
  
  var resizeCanvas = function(canvas, width, height, tileWidth, tileHeight) {
    var w = width * tileWidth + 6;
    var h = height * tileHeight + 6;
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    
    $board.css({width:w, height:h});
    setCanvasOptions();
  };
  
  var setCanvasOptions = function() {
    ctx.lineWidth = 3;
  };
  
  var setTitle = function(title) {
    $(canvas).closest(".illusion").find(".title").text(title);
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
  
  var targetX = function(target) { return target.x * options.tileSize + 8; };
  var targetY = function(target) { return target.y * options.tileSize + 8; };
  
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
  }
});