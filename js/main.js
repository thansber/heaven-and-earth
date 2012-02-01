require(
["jquery", "illusions/anti-maze", "illusions/data/anti-maze", "lib/jquery.timer"], 
function($, AntiMaze, AntiMazeData, Timer) {
    $(document).ready(function() {
      console.log("LET'S GO");
      AntiMaze.init();
      AntiMaze.load(AntiMazeData.lookup("ocean", 0));
    });
  }
);