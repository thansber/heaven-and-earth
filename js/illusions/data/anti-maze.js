define(
/* AntiMazeData */
["../constants"],
function(Constants) {

  var ALL_BY_INDEX = {};
  for (var t in Constants.Types) {
    ALL_BY_INDEX[Constants.Types[t]] = [];
  }
  
  var TypeRules = {};
  TypeRules[Constants.Types.Ocean] = {allowsWrapping:false, targetSwitchesMovementRule:false};
  TypeRules[Constants.Types.Desert] = {allowsWrapping:false, targetSwitchesMovementRule:false};
  TypeRules[Constants.Types.Mountain] = {allowsWrapping:true, targetSwitchesMovementRule:false};
  TypeRules[Constants.Types.Sky] = {allowsWrapping:true, targetSwitchesMovementRule:true};
  
  var Puzzle = function(type, name, opt) {
    this.type = type;
    this.name = name;
    $.extend(true, this, TypeRules[type]); // puzzles inherit rules based on their type
    $.extend(true, this, opt);
    
    ALL_BY_INDEX[this.type].push(this);
  };
  
  /* ================= */
  /* ----- OCEAN ----- */
  /* ================= */
  new Puzzle(Constants.Types.Ocean, "Right Turn", {
    width:14, height:9, player:{x:0,y:0}, targets:[{x:13,y:8}],
    vertical: ["101","201","301","401","501","601","701","801","901","a01","b01","c01","d01","c61","d61","c81","d81"],
    horizontal: ["d11","d21","d31","d41","d51","b61","d61","b71","d71","b81"]});
  new Puzzle(Constants.Types.Ocean, "Switchbacks", {
    width:9, height:9, player:{x:1,y:1}, targets:[{x:7,y:7}],
    vertical: ["301","501","701","111","817","221","421","621","726"],
    horizontal: ["117","126","831","641","851","661","781","871"]});
  new Puzzle(Constants.Types.Ocean, "Direct Route", {
    width:14, height:9, player:{x:1,y:1}, targets:[{x:12,y:6}],
    vertical: [],
    horizontal: []});
  new Puzzle(Constants.Types.Ocean, "Illusions", {
    width:14, height:9, player:{x:1,y:4}, targets:[{x:13,y:6}],
    vertical: [],
    horizontal: []});
  new Puzzle(Constants.Types.Ocean, "Nest", {
    width:14, height:9, player:{x:0,y:0}, targets:[{x:13,y:8}],
    vertical: [],
    horizontal: []});
  new Puzzle(Constants.Types.Ocean, "So Near, Yet Far", {
    width:14, height:9, player:{x:6,y:4}, targets:[{x:7,y:4}],
    vertical: [],
    horizontal: []});
  new Puzzle(Constants.Types.Ocean, "Right and Left", {
    width:14, height:9, player:{x:13,y:4}, targets:[{x:0,y:4}],
    vertical: [],
    horizontal: []});
  new Puzzle(Constants.Types.Ocean, "Square Squiggly", {
    width:15, height:15, player:{x:0,y:0}, targets:[{x:1,y:0}],
    vertical: [],
    horizontal: []});
  new Puzzle(Constants.Types.Ocean, "Where To?", {
    width:25, height:15, player:{x:24,y:13}, targets:[{x:24,y:14}],
    vertical: [],
    horizontal: []});
  new Puzzle(Constants.Types.Ocean, "I Love U", {
    width:25, height:15, player:{x:0,y:0}, targets:[{x:24,y:14}],
    vertical: [],
    horizontal: []});
  new Puzzle(Constants.Types.Ocean, "Meander", {
    width:21, height:13, player:{x:0,y:0}, targets:[{x:14,y:6}],
    vertical: [],
    horizontal: []});
  new Puzzle(Constants.Types.Ocean, "City", {
    width:21, height:13, player:{x:10,y:6}, targets:[{x:9,y:6}],
    vertical: [],
    horizontal: []});
  
  /* ================== */
  /* ----- DESERT ----- */
  /* ================== */
  new Puzzle(Constants.Types.Desert, "Three Stops", {
    width:25, height:4, player:{x:0,y:3}, targets:[{x:0,y:0}, {x:12,y:0}, {x:24,y:0}],
    vertical: ["101","131","201","221","302","401","501","631","711","731","811","911",
               "a11","a31","b11","b31","c11","c31","d04","e03","f21","g11","h11","i11","j13",
               "k31","l13","m01","n31","o31"],
    horizontal: ["131","221","311","511","521","531","711","721","731","911","921","931",
                 "b11","b21","d31","e12","f21","i31","j21","l12","l22","l32","o11","o21","o31"]});
  new Puzzle(Constants.Types.Desert, "Line Up", {
    width:13, height:13, player:{x:7,y:0}, 
    targets:[{x:0,y:6}, {x:1,y:6}, {x:2,y:6}, {x:3,y:6}, {x:4,y:6}, {x:5,y:6}, {x:6,y:6}, {x:7,y:6}, {x:8,y:6}, {x:9,y:6}, {x:10,y:6}, {x:11,y:6}, {x:12,y:6}],
    vertical: ["101","1b2","201","2a3","302","394","403","485","504","576","605","676","706",
               "785","806","894","905","9a3","a04","ab2","b03","bc1","c02","cc1"],
    horizontal: ["012","023","034","045","056","067","075","084","093","0a2","0b1",
                 "677","786","865","895","954","9a4","a43","ab3","b32","bc2","c21"]});
  
  /* ==================== */
  /* ----- MOUNTAIN ----- */
  /* ==================== */
  new Puzzle(Constants.Types.Mountain, "Through and Around", {
    width:20, height:3, player:{x:0,y:1}, 
    targets:[{x:1,y:1}, {x:2,y:1}, {x:3,y:1}, {x:4,y:1}, {x:5,y:1}, {x:6,y:1}, {x:7,y:1}, {x:8,y:1}, {x:9,y:1}, 
             {x:10,y:1}, {x:11,y:1}, {x:12,y:1}, {x:13,y:1}, {x:14,y:1}, {x:15,y:1}, {x:16,y:1}, {x:17,y:1}, {x:18,y:1}, {x:19,y:1}],
    vertical: ["011","111","211","311","411","511","611","711","811","911","b11","c11","d11","e11","f11","g11","h11","i11","j11","k11"],
    horizontal: []});
  
  
  return {
    lookup : function(type, index) { return ALL_BY_INDEX[type][index]; }
  };
});