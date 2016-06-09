// this collection contains all the songs
Songs = new Mongo.Collection("songs");
Stats = new Mongo.Collection("stats");

// this variable will store the visualisation so we can delete it when we need to 
var visjsobj;

/// routing 

 Router.configure({
  layoutTemplate: 'ApplicationLayout'
 });


/* Configuring different routes */
 Router.route('/', function () {
  this.render('welcome', {
    to:"main"   /// Welcome will be rendered into the  main in the applicationLayout template.
  });   
});

Router.route('/batting_stats', function () {
  this.render('song_viz', {
    to:"main"   /// Song_viz template will be rendered into the main in  applicationLayout template.
  });   
});


if (Meteor.isClient){

////////////////////////////
///// helper functions for the vis control form
////////////////////////////


Template.registerHelper('get_feature_names', (type) => {
      var feat_field;
      if (type == "single"){
        feat_field = "single_features";
      }
      // pull an example song from the database
      // - we'll use this to find the names of all the single features
      song = Songs.findOne();
      if (song != undefined){// looks good! 
        // get an array of all the song feature names 
        // (an array of strings)
        features = Object.keys(song[feat_field]);
        features_a = new Array();

        // create a new array containing
        // objects that we can send to the template
        // since we can't send an array of strings to the template
        for (var i=0;i<features.length;i++){
            features_a[i] = {name:features[i]};
        }
        return features_a;
      }
      else {// no song available, return an empty array for politeness
        return [];
      }

});


/*
   Template.song_viz_controls.helpers({

    get_feature_names: function(type){
      var feat_field;
      if (type == "single"){
        feat_field = "single_features";
      }
      // pull an example song from the database
      // - we'll use this to find the names of all the single features
      song = Songs.findOne();
      if (song != undefined){// looks good! 
        // get an array of all the song feature names 
        // (an array of strings)
        features = Object.keys(song[feat_field]);
        features_a = new Array();

        // create a new array containing
        // objects that we can send to the template
        // since we can't send an array of strings to the template
        for (var i=0;i<features.length;i++){
            features_a[i] = {name:features[i]};
        }
        return features_a;
      }
      else {// no song available, return an empty array for politeness
        return [];
      }
    },
  });

 */ 

////////////////////////////
///// helper functions for the feature list display template
////// (provide the data for that list of songs)
////////////////////////////

// helper that provides an array of feature_values
// for all songs of the currently selected type
// this is used to feed the template that displays the big list of 
// numbers
  Template.song_feature_list.helpers({
    "get_all_feature_values":function(){
      if (Session.get("feature") != undefined){
        var songs = Songs.find({});
        var features = new Array();
        var ind = 0;
        // build an array of data on the fly for the 
        // template consisting of 'feature' objects
        // describing the song and the value it has for this particular feature
        songs.forEach(function(song){
          //console.log(song);
            features[ind] = {
              player:song.stats.name,
              team:song.stats.team, 
              value:song[Session.get("feature")["type"]][Session.get("feature")["name"]]
            };
            ind ++;
        })
        return features;
      }
      else {
        return [];
      }
    },
    "get_selected_stat":function(){
      if(Session.get('feature') != undefined){
        var stat_array = Stats.findOne({name:Session.get("feature")["name"]});
        console.log(stat_array);
        return stat_array;
        //return Session.get("feature")["name"];
      }
      else{
        return ;
      }
    }
  });

////////////////////////////
///// event handlers for the viz control form
////////////////////////////

  Template.song_viz_controls.events({
    // event handler for when user changes the selected
    // option in the drop down list
    "change .js-select-single-feature":function(event){
      event.preventDefault();
      var feature = $(event.target).val();
      console.log('Click on the dropdown');
      Session.set("feature", {name:feature, type:"single_features"});
    }, 
    // event handler for when the user clicks on the 
    // blobs button
     "click .js-show-blobs":function(event){
      event.preventDefault();
      initBlobVis();
    }, 
    // event handler for when the user clicks on the 
    // timeline button
     "click .js-show-timeline":function(event){
      event.preventDefault();
      initDateVis();
      
    }
    
  }); 

////////////////////////////
///// helpers for the song_vizjs 
////////////////////////////

 /*
  Template.song_vizjs.helpers({
    get_single_feature_names:function(type){
      list_single_features(type);
    }
  })
  */

////////////////////////////
///// event handlers for the song_vizjs 
////////////////////////////
  Template.song_vizjs.events({
    "change .js-select-single-feature_1":function(event){
      event.preventDefault();
      var feature_1 = $(event.target).val();
      Session.set("feature_1_set", {name_1:feature_1, type_1:"single_features"});
    },
     "change .js-select-single-feature_2":function(event){
      event.preventDefault();
      var feature_2 = $(event.target).val();
        Session.set("feature_2_set", {name_2:feature_2, type_2:"single_features"});

    },
     "click .js-show-scatter":function(event){
        event.preventDefault();
        if((Session.get("feature_1_set")!= undefined) && (Session.get("feature_2_set")!=undefined)){
          initDateVis_1();
          }
        else{
            document.getElementById("visjs_1").innerHTML = "Select both features!";
          }
      }
  });

}

////////////////////////////
///// functions that set up and display the visualisation
////////////////////////////

function list_single_features(type){

  if (Session.get("feature") != undefined){
        var songs = Songs.find({});
        var features = new Array();
        var ind = 0;
        // build an array of data on the fly for the 
        // template consisting of 'feature' objects
        // describing the song and the value it has for this particular feature
        songs.forEach(function(song){
          //console.log(song);
            features[ind] = {
              player:song.stats.name,
              team:song.stats.team, 
              value:song[Session.get("feature")["type"]][Session.get("feature")["name"]]
            };
            ind ++;
        })
        return features;
      }
      else {
        return [];
      }
    }


// function that creates a new timeline visualisation
function initDateVis(){
  // clear out the old visualisation if needed
  if (visjsobj != undefined){
    visjsobj.destroy();
  }
  var songs = Songs.find({});
  var ind = 0;
  // generate an array of items
  // from the songs collection
  // where each item describes a song plus the currently selected
  // feature
  var items = new Array();
  // iterate the songs collection, converting each song into a simple
  // object that the visualiser understands
  songs.forEach(function(song){
    if (song.stats.date != undefined && 
      song.stats.date[0] != undefined ){
      var label = "ind: "+ind;
      var value = song[Session.get("feature")["type"]][Session.get("feature")["name"]];
      var date = song.stats.date[0] + "-01-01";

       if (song.stats.name != undefined){// we have a title
        label = song.stats.name + " - " + 
         value;
      }  
      // here we create the actual object for the visualiser
      // and put it into the items array
      items[ind] = {
        x: date, 
        y: value, 
        // slighlty hacky label -- check out the vis-label
        // class in song_data_viz.css 
        label:{content:label, className:'vis-label', xOffset:-5}, 
      };
      ind ++ ;
  }
  });
  // set up the data plotter
  var options = {
    style:'bar', 
  };
  // get the div from the DOM that we are going to 
  // put our graph into 
  var container = document.getElementById('visjs');
  // create the graph
  visjsobj = new vis.Graph2d(container, items, options);
  // tell the graph to set up its axes so all data points are shown
  visjsobj.fit();
}

// function that creates a new blobby visualisation
function initBlobVis(){
  // clear out the old visualisation if needed
  if (visjsobj != undefined){
    visjsobj.destroy();
  }
  // find all songs from the Songs collection
  var songs = Songs.find({});
  var nodes = new Array();
  var ind = 0;
  // iterate the songs, converting each song into 
  // a node object that the visualiser can understand
    songs.forEach(function(song){
      // set up a label with the song title and artist
     var label = "ind: "+ind;
     var value = song[Session.get("feature")["type"]][Session.get("feature")["name"]];
     if (song.stats.name != undefined){// we have a title
          label = song.stats.name + " - " + 
          value;
      } 
      // figure out the value of this feature for this song
     
      // create the node and store it to the nodes array
        nodes[ind] = {
          id:ind, 
          label:label, 
          value:value,
        }
        ind ++;
    })
    // edges are used to connect nodes together. 
    // we don't need these for now...
    edges =[
    ];
    // this data will be used to create the visualisation
    var data = {
      nodes: nodes,
      edges: edges
    };
    // options for the visualisation
     var options = {
      nodes: {
        shape: 'dot',
      }
    };
    // get the div from the dom that we'll put the visualisation into
    container = document.getElementById('visjs');
    // create the visualisation
    visjsobj = new vis.Network(container, data, options);
}


// function that creates a new timeline visualisation
function initDateVis_1(){
  // clear out the old visualisation if needed
  var visjsobj_1;

  /*
  if (visjsobj != undefined){
    visjsobj.destroy();
  }
  */

  var songs = Songs.find({});
  var ind = 0;
  // generate an array of items
  // from the songs collection
  // where each item describes a song plus the currently selected
  // feature
  var items = new Array();
  // iterate the songs collection, converting each song into a simple
  // object that the visualiser understands
  songs.forEach(function(song){
    if (song.stats.date != undefined && 
      song.stats.date[0] != undefined ){
      var label = "ind: "+ind;
      var x_value = song[Session.get("feature_1_set")["type_1"]][Session.get("feature_1_set")["name_1"]];
      var y_value = song[Session.get("feature_2_set")["type_2"]][Session.get("feature_2_set")["name_2"]];
      var date = song.stats.date[0] + "-01-01";
      var team = song.stats.team;

       if (song.stats.name != undefined){// we have a title
        label = song.stats.name + " - " + 
         team;
      }  
      // here we create the actual object for the visualiser
      // and put it into the items array
      items[ind] = {
        x: x_value, 
        y: y_value, 
        // slighlty hacky label -- check out the vis-label
        // class in song_data_viz.css 
        label:{content:label, className:'vis-label', xOffset:-5}, 
      };
      ind ++ ;
  }
  });
  // set up the data plotter
  var options = {
    sort: false,
    sampling:false,
    style:'points' 
  };
  // get the div from the DOM that we are going to 
  // put our graph into 
  var container = document.getElementById('visjs_1');
  // create the graph
  visjsobj_1 = new vis.Graph2d(container, items, options);
  // tell the graph to set up its axes so all data points are shown
  visjsobj_1.fit();
}

