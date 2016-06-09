
// define a startup script that 
// reads the JSON data files from the filesystem 
// and inserts them into the database if needed

if (Meteor.isServer){
	Meteor.startup(function(){
		if (!Songs.findOne()){
		console.log("no songs yet... creating from filesystem");
		// pull in the NPM package 'fs' which provides
		// file system functions
		var fs = Meteor.npmRequire('fs');
		// get a list of files in the folder private/jsonfiles, which
		// ends up as assets/app/jsonfiles in the app once it is built
		var files = fs.readdirSync('./assets/app/jsonfiles/');
		// iterate the files, each of which should be a 
		// JSON file containing song data.
		var inserted_songs = 0;
		for (var i=0;i<files.length; i++){
		//for (var i=0;i<1; i++){

		 	var filename = 'jsonfiles/'+files[i];
		 	// in case the file does not exist, put it in a try catch
		 	try{
		 		var song = JSON.parse(Assets.getText(filename));
		 		// now flatten the stats and tonal features
		 		// into a single set of properties
		 		var single_features = {};
		 		var array_features = {};
		 		var string_features = {};

		 		/* stats_keys = Object.keys(song.stats); */
		 		stats_keys = Object.keys(song.stats);
      			//tonal_keys = Object.keys(song.tonal);
      			for (var j=0;j<stats_keys.length;j++){
      				console.log("type of "+stats_keys[j]+" is "+typeof(song.stats[stats_keys[j]]));
      				// only use features that are numbers ... ignore arrays etc. 
      				if (typeof(song.stats[stats_keys[j]]) === "number"){
      					single_features[stats_keys[j]] = song.stats[stats_keys[j]];
      				}
      				if (typeof(song.stats[stats_keys[j]]) === "object" && 
      					song.stats[stats_keys[j]].length != undefined){// its an array
      					array_features[stats_keys[j]] = song.stats[stats_keys[j]];
      				}
      				if (typeof(song.stats[stats_keys[j]]) === "string"){
      					string_features[stats_keys[j]] = song.stats[stats_keys[j]];
      				}
      	
      			}
      			/*
      			for (var j=0;j<tonal_keys.length;j++){
      				console.log("type of "+tonal_keys[j]+" is "+typeof(song.tonal[tonal_keys[j]]));
      				if (typeof(song.tonal[tonal_keys[j]]) === "number"){
      					single_features[tonal_keys[j]] = song.tonal[tonal_keys[j]];
      				}
      				if (typeof(song.tonal[tonal_keys[j]]) === "object" && 
      					song.tonal[tonal_keys[j]].length != undefined){// its an array
      					array_features[tonal_keys[j]] = song.tonal[tonal_keys[j]];
      				}
      				if (typeof(song.tonal[tonal_keys[j]]) === "string"){
      					string_features[tonal_keys[j]] = song.tonal[tonal_keys[j]];
      				}
      			}
      			*/

		 		// insert the song to the DB:
		 		song.single_features = single_features;
		 		song.array_features = array_features;
		 		song.string_features = string_features;
		 		
		 		Songs.insert(song);
		 		inserted_songs ++;
		 	}catch (e){
		 		console.log("error parsing file "+filename);
		 	}
		}
		console.log("Inserted "+inserted_songs+" new songs...");
	}
	if(Stats.find().count() == 0){
		var stats_desc = [
			{
			 name:"span",
			 desc:"The length of the career of the batsman."
			},
			{
			 name:"innings",
			 desc:"No. of times the batsman has played or got a chance to bat."
			},
			{
			 name:"not_out",
			 desc: "No. of times batsman has not been out (dismissed) till the end of the innings."
			},
			{
			 name:"runs",
			 desc: "No. of total runs scored in the career of the batsman."
			},
			{
			 name:"Average",
			 desc: "The batting average is the total number of runs scored in the career divided by the number of times they have been out."
			},
			{
			 name:"100s",
			 desc: "No. of scores past 100 runs in an innings."
			},
			{
			 name:"50s",
			 desc: "No. of scores past 100 runs in an innings."
			},
			{
			 name:"HS",
			 desc: "Stands for Highest Score, scored in an innigs."
			},
			{
			 name:"MoM",
			 desc: "Stands for Man of the Match awards ( data not available for batsman who started before 1960 in the timeline)."
			
			}
		]
		_.each(stats_desc,function(doc){
		Stats.insert(doc)
		})
	}
 })
}
