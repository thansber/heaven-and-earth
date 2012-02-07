require(
["jquery", "illusions/anti-maze", "illusions/data/anti-maze", "lib/jquery.timer", "util"], 
function($, AntiMaze, AntiMazeData, Timer, Util) {
    $(document).ready(function() {
      Util.init();
      AntiMaze.init();
    });
  }
);