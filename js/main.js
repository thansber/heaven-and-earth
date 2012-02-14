require(
["jquery", "illusions/anti-maze", "illusions/data/anti-maze", "lib/jquery.timer", "util"], 
function($, AntiMaze, AntiMazeData, Timer, Util) {
    $(document).ready(function() {
      Util.init();
      AntiMaze.init();
      AntiMaze.load(AntiMazeData.lookup("sky", 8));
      $("section.anti-maze").find(".menu").toggleClass("show");
    });
  }
);