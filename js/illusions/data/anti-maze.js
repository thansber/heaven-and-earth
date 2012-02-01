define(
/* AntiMazeData */
function() {
  var puzzles = {
    ocean:[{name:"", width:14, height:9, player:{x:0,y:0}, targets:[{x:13,y:8}],
            vertical:["|||||||||||||","","","","","           ||","","","           ||"],
            horizontal:["             -","             -","             -","             -","             -","           - -","           - -","           -"]
          }],
    desert:[],
    mountain:[],
    sky:[]
  };
  
  return {
    lookup : function(type, index) { return puzzles[type][index]; }
  };
});