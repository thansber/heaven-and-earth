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
  
  var playerPos = {x:-1,y:-1};
  var playerPadding = -1
  var playerSize = -1;
  var targetPadding = -1;
  var targetRadius = -1;

  var ArrowKeys = {Left:"37",Up:"38",Right:"39",Down:"40"};
  
  var drawPlayer = function() { ctx.fillRect(playerX(), playerY(), playerSize, playerSize); };
  
  var drawTargets = function(targets) {
    var targetEndArc = 2 * Math.PI; // 360 degress
    for (var t = 0; t < targets.length; t++) {
      var target =  targets[t];
      var targetX = target.x * options.tileSize + (options.tileSize / 2);
      var targetY = target.y * options.tileSize + (options.tileSize / 2);
      
      ctx.beginPath();
      ctx.arc(targetX, targetY, targetRadius, 0, targetEndArc);
      ctx.fill();
    }
  };
  
  var init = function(opt) {
    options = $.extend(options, opt);
    canvas = document.getElementById("anti-maze"); 
    ctx = canvas.getContext("2d");
    ctx.lineWidth = 2;
    
    playerPadding = options.tileSize * 0.125;
    playerSize = options.tileSize - (playerPadding * 2) - 1;
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
    
    /*
    $(document).everyTime("40ms", "timer", function() {
      refresh();
    });
    */
  };
  
  var isArrowKey = function(key) {
    for (var k in ArrowKeys) {
      if (key == ArrowKeys[k]) {
        return true;
      }
    }
    return false;
  };
  
  var load = function(puzzle) {

    for (var j = 0; j < puzzle.vertical.length; j++) {
      var row = puzzle.vertical[j].split("");
      var x, y;
      for (var i = 0; i < row.length; i++) {
        if (row[i] == "|") {
          x = options.tileSize * (i + 1);
          y = options.tileSize * j;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + options.tileSize + 1);
          ctx.stroke();
        }
      }
    }
    
    for (var j = 0; j < puzzle.horizontal.length; j++) {
      var row = puzzle.horizontal[j].split("");
      var x, y;
      for (var i = 0; i < row.length; i++) {
        if (row[i] == "-") {
          x = (options.tileSize * i) - 1;
          y = options.tileSize * (j + 1);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + options.tileSize + 1, y);
          ctx.stroke();
        }
      }
    }
    
    playerPos.x = puzzle.player.x;
    playerPos.y = puzzle.player.y;
    drawPlayer();
    drawTargets(puzzle.targets);
  };
  
  var move = function(x, y) {
    var $player = $("#player");
    
    console.log("moving x=" + x + ",y=" + y);
  };
  
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
    switch (key) {
      case ArrowKeys.Left: move(-1, 0); return false;
      case ArrowKeys.Down: move(0, 1); return false;
      case ArrowKeys.Right: move(1, 0); return false;
      case ArrowKeys.Up: move(0, -1); return false;
    }
  };
  
  return {
    init: init,
    load: load,
    refresh: refresh
  }
});