var TempTable       = require('./temptable.js'),
	debug			= require('debug'),
	log				= debug('n4p:dataset');
	

function Dataset( iDatasetNm , iJsonObj ) {
	log( "ds create" );

	this.dataset	= null;
	this.metaSchema	= null;
	this.name		= "";
	this.rootName	= "";
	this.tempTables	= {};
	this.getDataset(iDatasetNm,iJsonObj);
	if( this.name === "" ){
		throw new Error( "Dataset " + iDatasetNm + " not found" );
	}
}

Dataset.prototype.$ = function(ttName){
	log( "ds:$", ttName );

	var targetTable     = null,
	    datasetContents = null,
	    ttNm            = "";

    ttName      = ttName.toLowerCase();
    
    this.dataset.some( function(item) {
		datasetContents = item;
		return true;
    });

    datasetContents.some( function( item, tt ) {
        if ( tt.toString().toLowerCase() == ttName ) {
			targetTable = datasetContents[tt];
			ttNm        = tt;
			return true;
        }
        return false;
    });
    
	if( !this.tempTables[ttNm] ){
		this.tempTables[ttNm]   = new TempTable( this, ttNm, targetTable, this.metaSchema[ttNm] );
	}
	
	return this.tempTables[ttNm];
};

Dataset.prototype.copyDataset = function(empty){
	log( "ds:copyDataset" );

	var copyDatasetJsonObj = {},
	    copyDataset;

	copyDatasetJsonObj[ this.rootName ]     = JSON.parse( this.writeJson() );
    copyDatasetJsonObj[ this.rootName ][ this.name + "MetaSchema" ] = JSON.parse( JSON.stringify( this.metaSchema ) );
    
    copyDataset = new Dataset( this.name, copyDatasetJsonObj );

	if(empty){
		copyDataset.emptyDataset();		
	}

	return copyDataset;
};

Dataset.prototype.emptyDataset = function(){
	log( "ds:emptyDataset" );

    this.dataset[this.rootName].forEach( function( item, prop ) {
		this.$( prop ).emptyTemptable();
    }, this );
};

Dataset.prototype.getDataset = function(iDatasetNm,iJsonObj){
	log( "ds:getDataset", iDatasetNm );

	var prop,
	    prop2;
	    
	for(prop in iJsonObj){

		if( iJsonObj[ prop ][ iDatasetNm ] && iJsonObj[ prop ][ iDatasetNm + "MetaSchema" ] ) {
			this.dataset    = iJsonObj[ prop ];
			this.metaSchema = iJsonObj[ prop ][ iDatasetNm + "MetaSchema" ];
			this.name       = prop.toString();
			for(prop2 in this.dataset){
				this.rootName   = prop2;
				break;
			}
			break;
		}						

		if( typeof iJsonObj[ prop ] == "object" ){
			this.getDataset( iDatasetNm, iJsonObj[ prop ] );
		}
	}
};

Dataset.prototype.writeJson = function(){
	log( "ds:writeJson" );

	var writeJson   = "",
	    jsonObj     = {};
	
	if( this.dataset ){
		jsonObj[ this.rootName ]    = this.dataset[ this.rootName ];		
		writeJson                   = JSON.stringify( jsonObj );
	}
	return writeJson;
};

module.exports	= function( name, obj ) {
    return new Dataset( name, obj );
};