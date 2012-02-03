require(
["jquery", "illusions/anti-maze", "illusions/data/anti-maze", "lib/jquery.timer"], 
function($, AntiMaze, AntiMazeData, Timer) {
    $(document).ready(function() {
      console.log("LET'S GO");
      AntiMaze.init();
      
      $("section.illusion .menu").click(function() {
        $(this).toggleClass("show");
        return false;
      });
      
      AntiMaze.load(AntiMazeData.lookup("mountain", 0));
    });
  }
);