define(
/* */ 
["jquery", "./data/anti-maze", "./constants"], 
function($, AntiMazeData, Constants) {
  
  var canvas = null;
  var ctx = null;
  var $board = null;
  var $menu = null;
  var $header = null;
  var $win = null;
  var $levels = null;
  
  var keysPressed = {};
  var images = {};
  images[Constants.Types.Ocean] = {
    player: {
      name: "player-ocean.png",
      numAnimations:6
    }, 
    target: [{
      name: "target-ocean.png",
      numAnimations: 5
    }]
  };
  images[Constants.Types.Desert] = {
    player: {
      name: "player-desert.png",
      numAnimations: 1
    }, 
    target: [{
      name: "target-desert.png",
      numAnimations: 6
    }]
  };
  images[Constants.Types.Mountain] = {
    player: {
      name: "player-mountain.png",
      numAnimations: 4
    }, 
    target: [{
      name: "target-mountain.png",
      numAnimations: 6
    }]
  };
  images[Constants.Types.Sky] = {
    player: {
      name: "player-sky.png",
      numAnimations: 5
    }, 
    target: [
      {
        name: "target-sky-inner.png",
        numAnimations: 6
      },
      {
        name: "target-sky-outer.png",
        numAnimations: 5
      }]
  };
  var expectedImages = 9;
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
  var currentTargetFrame = [];
  var numTargetsFound = 0;
  var numTotalTargets = 0;

  var playerPos = {x:0,y:0};
  
  var animationCount = 0;

  var ArrowKeys = {Left:"37",Up:"38",Right:"39",Down:"40"};
  var wallRegex = /[w]/;
  var temporaryWallIndicator = "~";
  
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
      playerPos.y = 0;
    }
  };
  
  var adjustNavigationButtons = function(index) {
    $header
      .find(".prev").toggle(index > 0).end()
      .find(".next").toggle(index < $menu.find("li:not(.type)").length);
  };
  
  var animate = function() {
    if (gameOver) {
      return;
    }
    requestAnimFrame(animate);
    animationCount++;
    if (animationCount % 10 == 0) {
      if (images[currentPuzzle.type].player.numAnimations > 1) {
        drawPlayer();
      }
      
      var anyTargetAnimations = false;
      $.each(images[currentPuzzle.type].target, function(i, targetImage) {
        anyTargetAnimations = anyTargetAnimations || targetImage.numAnimations > 1
      });
      if (anyTargetAnimations) {
        drawTargets();
      }
    }
  };
  
  var clearPlayer = function() { ctx.clearRect(playerX(), playerY(), options.playerSize, options.playerSize); };
  var clearTarget = function(index) { 
    var target = currentTargets[index];
    ctx.clearRect(targetX(target), targetY(target), options.targetSize, options.targetSize);
    currentTargets.splice(index, 1);
  };
  
  var currentPuzzleIndex = function() {
    return $levels.index($menu.find(".selected"));
  };
  
  var drawHorizontalWalls = function(opt) {
    var wallOptions = $.extend({shadow:false, store:false}, opt);
    var walls = currentPuzzle.horizontal;
    for (var i = 0; i < walls.length; i++) {
      if (walls[i]) {
        var line = parseLineData(walls[i].split(""));
        if (wallOptions.store) {
          storeHorizontalWalls(line, i);
        }
        drawHorizontalWall(line, wallOptions);
      }
    }
  };
  
  var drawHorizontalWall = function(line, opt) {
    var wallOptions = $.extend({shadow:false, clear:false}, opt);
    var wallStart = {x:line.x + (wallOptions.shadow ? ctx.lineWidth : 0), y:line.y + 1.5 + (wallOptions.shadow ? ctx.lineWidth : 0)};
    var wallEnd = {x:line.x + ctx.lineWidth + (options.tileSize * line.len) + (wallOptions.shadow ? ctx.lineWidth : 0), y:wallStart.y};
    
    // Temp lines only have their shadow drawn
    if (!line.temporary || wallOptions.shadow) {
      var color = wallOptions.clear ? $board.css("backgroundColor") : (wallOptions.shadow ? currentPuzzle.wallShadowColor : "#000000");
      //console.log("drawing a vertical line at (" + line.x + "," + line.y + ") for " + line.len + " tiles");
      drawWall(color, wallStart, wallEnd);
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
    for (var t = 0; t < currentTargets.length; t++) {
      drawTarget(currentTargets[t], t);
    }
  };
  var drawTarget = function(target, t) {
    var puzzleTargetImages = images[currentPuzzle.type].target;
    
    $.each(puzzleTargetImages, function(i, targetImage) {
      var img = targetImage.img;
      var x = targetX(target);
      var y = targetY(target);
      var targetFrame = currentTargetFrame[i][t];
      ctx.drawImage(img, targetFrame * options.targetSize, 0, options.targetSize, options.targetSize, x, y, options.targetSize, options.targetSize);
      currentTargetFrame[i][t]++;
      if (targetFrame >= targetImage.numAnimations) {
        currentTargetFrame[i][t] = 0;
      }
    });
  };
  
  var drawVerticalWalls = function(opt) {
    var wallOptions = $.extend({shadow:false, store:false}, opt);
    var walls = currentPuzzle.vertical;
    for (var i = 0; i < walls.length; i++) {
      if (walls[i]) {
        var line = parseLineData(walls[i].split(""));
        if (wallOptions.store) {
          storeVerticalWalls(line, i);
        }
        drawVerticalWall(line, wallOptions);
      }
    }
  };
  
  var drawVerticalWall = function(line, opt) {
    var wallOptions = $.extend({shadow:false, clear:false}, opt);
    var wallStart = {x:line.x + 1.5 + (wallOptions.shadow ? ctx.lineWidth : 0), y:line.y + (wallOptions.shadow ? ctx.lineWidth : 0)};
    var wallEnd = {x:wallStart.x, y:line.y + ctx.lineWidth + (options.tileSize * line.len) + (wallOptions.shadow ? ctx.lineWidth : 0)};
    
    // Temp lines only have their shadow drawn
    if (!line.temporary || wallOptions.shadow) {
      var color = wallOptions.clear ? $board.css("backgroundColor") : (wallOptions.shadow ? currentPuzzle.wallShadowColor : "#000000");
      //console.log("drawing a vertical line at (" + line.x + "," + line.y + ") for " + line.len + " tiles");
      drawWall(color, wallStart, wallEnd);
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
    
    var $section = $("section.anti-maze");
    $board = $(canvas).closest(".board");
    $header = $section.find("header");
    $menu = $section.find(".menu");
    $win = $board.find(".win");
    
    initMenu();
    $levels = $menu.find("li:not(.type)");
    
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
    
    $header.click(function(e) {
      var $target = $(e.target);
      
      if ($target.is(".button")) {
        var index = currentPuzzleIndex();
        var destinationIndex = index;
        
        adjustNavigationButtons(index);
        
        if ($target.is(".prev")) {
          destinationIndex--;
        } else if ($target.is(".next")) {
          destinationIndex++;
        }
        $levels.eq(destinationIndex).click();
      }
      
    });
    
    $menu.click(function(e) {
      var $this = $(e.target);
      
      if ($this.is(".puzzle")) {
        var type = $this.parent().attr("class").split(" ")[0];
        var index = $this.index() - 1;
        var puzzle = AntiMazeData.lookup(type, index);
        load(puzzle);
        $menu.find(".selected").removeClass("selected");
        $this.addClass("selected");
        adjustNavigationButtons(currentPuzzleIndex());
        if ($menu.hasClass("show")) {
          $menu.toggleClass("show");
        }
      } else {
        $menu.toggleClass("show");
      }
      
      return false;
    });
  };
  
  var initMenu = function() {
    for (var type in AntiMazeData.All) {
      var $levelsForType = $menu.find(".levels." + type);
      $levelsForType.find("li:gt(0)").remove();
      var puzzles = AntiMazeData.All[type];
      $.each(puzzles, function(i, puzzle) {
        var levels = [];
        var c = 0;
        levels[c++] = "<li class=\"puzzle\">";
        levels[c++] = puzzle.name;
        levels[c++] = "</li>";
        $levelsForType.append($(levels.join("")));
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
    return !!walls[x] ? walls[x][y] : null;
  };
  
  var load = function(puzzle) {
    $board.hide();
    $("body").removeClass().addClass(puzzle.type);
    resizeCanvas(canvas, puzzle.width, puzzle.height, options.tileSize, options.tileSize);
    reset();
    
    currentPuzzle = $.extend(true, {}, puzzle);
    
    $.each(images[currentPuzzle.type].target, function(i) {
      currentTargetFrame[i] = []; 
    });
    
    $.each(currentPuzzle.targets, function(t, target) {
      if (!target.fake) {
        numTotalTargets++;
      }
      
      currentTargets.push(target);
      $.each(currentTargetFrame, function(i, targetFrames) {
        targetFrames.push(0); 
      });
    });
    
    // wall shadows
    drawVerticalWalls({shadow:true, store:false});
    drawHorizontalWalls({shadow:true, store:false});

    // walls
    drawVerticalWalls({shadow:false, store:true});
    drawHorizontalWalls({shadow:false, store:true});

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
        var typeImage = typeImages[t];
        var images = $.isArray(typeImage) ? typeImage : [typeImage];
        
        $.each(images, function(i, image) {
          var img = new Image();
          img.onload = function() {
            imagesLoaded++;
            if (imagesLoaded == expectedImages) {
              loadInitialPuzzle();
            }
          };
          img.src = "images/anti-maze/" + image.name;
          image.img = img;
        });
      }
    });
  };
  
  var loadInitialPuzzle = function() {
    $menu.find(".puzzle:eq(0)").click();
  };
  
  var move = function(x, y) {
    //console.log("attempting to move from (" + playerPos.x + "," + playerPos.y + ") to (" + (playerPos.x + x) + "," + (playerPos.y + y) + ")");
    var crossedBoundary = isCrossingBoundary(x, y);
    
    if (crossedBoundary && !currentPuzzle.allowsWrapping) {
      //console.log("crossing boundary, wrapping allowed = " + currentPuzzle.allowsWrapping);
      return false;
    }

    var wallX = 0;
    var wallY = 0;
    var isWallThere = false;
    
    if (x) {
      wallX = (crossedBoundary ? 0 : Math.max(playerPos.x, playerPos.x + x)) - 0.5;
      wallY = playerPos.y;
      isWallThere = isWallHere(currentPuzzleVerticalWalls, wallX, wallY);
      if (!!isWallThere && isWallThere.temporary) {
        moveThruTemporaryVerticalWall(wallX, wallY, isWallThere.index);
        
        if (crossedBoundary) {
          var otherBoundaryX = currentPuzzle.width - 0.5;
          moveThruTemporaryVerticalWall(otherBoundaryX, wallY, isWallHere(currentPuzzleVerticalWalls, otherBoundaryX, wallY).index);
        }
      }
    } else if (y) {
      wallX = playerPos.x;
      wallY = (crossedBoundary ? 0 : Math.max(playerPos.y, playerPos.y + y)) - 0.5;
      isWallThere = isWallHere(currentPuzzleHorizontalWalls, wallX, wallY);
      if (!!isWallThere && isWallThere.temporary) {
        moveThruTemporaryHorizontalWall(wallX, wallY, isWallThere.index);
        
        if (crossedBoundary) {
          var otherBoundaryY = currentPuzzle.height - 0.5;
          moveThruTemporaryHorizontalWall(wallX, otherBoundaryY, isWallHere(currentPuzzleHorizontalWalls, wallX, otherBoundaryY).index);
        }
      }
    }
    
    var isAllowed = !(playerMovingThruWalls ^ !!isWallThere);
    // Can always move through a temporary wall
    if (isWallThere && isWallThere.temporary) {
      isAllowed = true;
    }
    //console.log("wall at (" + wallX + "," + wallY + ")=" + !!isWallThere + ", allowed=" + isAllowed);

    if (isAllowed) {
      clearPlayer();
      adjustPlayerPos(x, y);
      
      var targetIndex = isPlayerOnTarget(); 
      if (targetIndex >= 0) {
        clearTarget(targetIndex);
        numTargetsFound++;
        
        if (currentPuzzle.targetSwitchesMovementRule) {
          playerMovingThruWalls = !playerMovingThruWalls;
        }
        
        if (numTargetsFound == numTotalTargets) {
          playerWins();
          return false;
        }
      }
      
      drawPlayer();
    }
  };
  
  var moveThruTemporaryHorizontalWall = function(wallX, wallY, wallIndex) {
    if (!currentPuzzle.horizontal[wallIndex]) {
      return false;
    }
    
    // Sky puzzles cause a player moving thru a temp wall to turn the wall into a real one
    // rather than clearing it like mountain puzzles
    if (currentPuzzle.targetSwitchesMovementRule && !playerMovingThruWalls) {
      currentPuzzle.horizontal[wallIndex] = currentPuzzle.horizontal[wallIndex].replace(temporaryWallIndicator, "");
      var wallNowPermanent = parseLineData(currentPuzzle.horizontal[wallIndex].split(""));
      storeHorizontalWalls(wallNowPermanent, wallIndex);
      drawHorizontalWall(wallNowPermanent, {shadow:false}); 
    } else {
      var wallLine = parseLineData(currentPuzzle.horizontal[wallIndex].split(""));
      // clear the wall first
      drawHorizontalWall(wallLine, {shadow:true, clear:true});
      // delete it from the local arrays
      currentPuzzleHorizontalWalls[wallX][wallY] = null;
      currentPuzzle.horizontal[wallIndex] = null;
      // re-draw other walls
      drawHorizontalWalls({shadow:true});
      drawHorizontalWalls({shadow:false});
      drawVerticalWalls({shadow:false});
    }
  };
  
  var moveThruTemporaryVerticalWall = function(wallX, wallY, wallIndex) {
    if (!currentPuzzle.vertical[wallIndex]) {
      return;
    }
    
    // Sky puzzles cause a player moving thru a temp wall to turn the wall into a real one
    // rather than clearing it like mountain puzzles
    if (currentPuzzle.targetSwitchesMovementRule && !playerMovingThruWalls) {
      currentPuzzle.vertical[wallIndex] = currentPuzzle.vertical[wallIndex].replace(temporaryWallIndicator, "");
      var wallNowPermanent = parseLineData(currentPuzzle.vertical[wallIndex].split(""));
      storeVerticalWalls(wallNowPermanent, wallIndex);
      drawVerticalWall(wallNowPermanent, {shadow:false}); 
    } else {
      var wallLine = parseLineData(currentPuzzle.vertical[wallIndex].split(""));
      // clear the wall first
      drawVerticalWall(wallLine, {shadow:true, clear:true});
      // delete it from the local arrays
      currentPuzzleVerticalWalls[wallX][wallY] = null;
      currentPuzzle.vertical[wallIndex] = null;
      // re-draw other walls
      drawVerticalWalls({shadow:true}); 
      drawVerticalWalls({shadow:false}); 
      drawHorizontalWalls({shadow:false});
    }
  };
  
  /**
   * Line data is of the format "XYZ[~]" where:
   * X - the x coordinate of the top-left most point of the line
   * Y - the y coordinate of the top-left most point of the line
   * Z - the length of the line
   * ~ - optional, if present, this wall is temporary and will vanish once traversed
   */
  var parseLineData = function(lineData) {
    var tileX = parseInt(lineData[0], 36);
    var tileY = parseInt(lineData[1], 36);
    return {
      x: options.tileSize * tileX,
      y: options.tileSize * tileY,
      tileX: tileX,
      tileY: tileY,
      len: parseInt(lineData[2], 36),
      temporary: (lineData.length > 3 && lineData[3] === temporaryWallIndicator) 
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
    currentTargets = [];
    currentTargetFrame = [];
    numTargetsFound = 0;
    numTotalTargets = 0;
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
  
  var storeHorizontalWalls = function(line, index) {
    var wallY = line.tileY - 0.5;
    for (var i = line.tileX, n = line.tileX + line.len; i < n; i++) {
      var walls = currentPuzzleHorizontalWalls[i];
      if (!walls) {
        walls = [];
        currentPuzzleHorizontalWalls[i] = walls;
      }
      walls[wallY] = {
        temporary: line.temporary,
        index: index
      };
    }
  };
  
  var storeVerticalWalls = function(line, index) {
    var wallX = line.tileX - 0.5;
    for (var i = line.tileY, n = line.tileY + line.len; i < n; i++) {
      var walls = currentPuzzleVerticalWalls[wallX];
      if (!walls) {
        walls = [];
        currentPuzzleVerticalWalls[wallX] = walls;
      }
      walls[i] = {
        temporary: line.temporary,
        index: index
      };
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