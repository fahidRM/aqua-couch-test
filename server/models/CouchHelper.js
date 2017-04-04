/**
 * Created by fahid on 4/2/17.
 */
'use strict';

const config =  require('../Config/Couch');
const cradle =  require('cradle');

class CouchHelper{


    static getDB(){
        let conn =  new(cradle.Connection)(config.host, config.port);
        return conn.database(config.db);
    }

    static create(document, callback){

        CouchHelper.getDB().save( document,  function(err, success){
            if (err){ console.log("Falied to create"); console.log(err); console.log("\n\n\n"); callback(err); }
            else{
                console.log(success);
                console.log("Data added");
                console.log("\n\n\n");
                callback(null, success);
            }
        });
    }


    static findById(type, id, callback){
        //TODO: refactor so as to work the way couch would allow passing of parameters ==> TEMP CODE
        CouchHelper.getDB().view(config.db + '/' + type, function(err, res) {
            if (err) {
                callback(err);
            }
            else {


                let data =  res.map(function (elem) {   return elem.key;    });
                let response =  data.filter ( function (elem) { return  elem._id === id; });

                if (response){ callback(null, response[0]);}
                else{
                    //TODO actual approach to throw 404 instead of this
                    callback(null, {"StatusCode" : 404, "error" : "Not Found", "message" : "Document not found"});
                }
            }
        });
    }


    static pagedFind(type, query, field, sort, limit, page, callback){
        //TODO implement pagination
        //{"data":[{"_id":"qq-swdewd","pivot":"qq","name":"swdewd"}],"pages":{"current":1,"prev":0,"hasPrev":false,"next":2,"hasNext":false,"total":1},"items":{"limit":20,"begin":1,"end":1,"total":1}}
        // above line is output from paginator, for now no pagination handle later

        CouchHelper.getDB().view( config.db + '/' +  type, function(err, res){
            if (err){ console.log("Error", err); callback(err); }
            else{
                console.log("Status, no error!!!");
                console.log(res);
                let response = {
                    "data" :  res.map(function(element){ return element.key}),
                    "pages":{"current":1,"prev":0,"hasPrev":false,"next":2,"hasNext":false,"total":1},
                    "items":{"limit":20,"begin":1,"end":1,"total":1}
                };
                callback(null, response);
            }
        });
    }


    static findByIdAndUpdate(type, id, update, callback){

        let db = CouchHelper.getDB();
        db.view(config.db + '/' + type, function(err, res) {
            if (err) {
                console.log("Error", err);
                callback(err);
            }
            else {

                let data =  res.map(function (elem) {
                    return elem.key;
                });

                let response =  data.filter(function(elem){
                    return elem._id ===  id;
                });

                console.log("Type: "  + type + "  ID: " +  id, update);
                console.log("Response:: ", response);
                console.log("\n\n\n");
                if (response){
                    update["_rev"] =  response[0]._rev;
                    // update["_rev"] =  rsps[0]._rev;
                    // console.log(":::REV?:::", update);
                    db.merge(id, update, function(err, success){

                        if (err){ callback(err); }
                        else{
                            //appdb.close();
                            console.log("\n\nResp:::\n\n", success);
                            CouchHelper.findById(type, id, callback);
                        }

                    });

                }
                else{
                    //TODO actual approach to throw 404 instead of this
                    callback(null, {"StatusCode" : 404, "error" : "Not Found", "message" : "Document not found"});
                }
            }
        });

    }



    static findByIdAndDelete(type, id, callback){

        let db =  CouchHelper.getDB();

        db.view(config.db + '/' +  type, function(err, res) {
            if (err) {
                console.log("Error", err);
                callback(err);
            }
            else {

                let data =  res.map(function (elem) {
                    return elem.key;
                });

                let response =  data.filter(function(elem){
                    return elem._id ===  id;
                });

                if (response){
                    db.remove(id,  response[0]._rev, function(err, success){

                        if (err){ callback(err); }
                        else{
                            callback(success);
                            //appdb.close();
                            console.log("\n\nResp:::\n\n", success);
                            //CouchStatus.findById(id, callback);
                        }

                    });

                }
                else{
                    //TODO actual approach to throw 404 instead of this
                    callback(null, {"StatusCode" : 404, "error" : "Not Found", "message" : "Document not found"});
                }
            }
        });
    }

    static findByChild(type, path, value, callback){

        //TODO optimize
        CouchHelper.getDB().view(config.db + '/' +  type, function(err, res){
            if (err){ callback(err); }
            else{
                let allItems = res.map(function (element) { return element.key; } );
                //let criteriaProps =  Object.keys(criteria);
                let match = [];

                allItems.forEach( function(element){


                    let elementValue =element;
                    for ( var i in path){
                        elementValue = elementValue[path[i]];
                    }

                    if( elementValue === value){ match.push(element); }

                });

                callback(null, match);
            }
        });
    }

    static count(type, criteria, callback){
        //TODO optimize
        CouchHelper.getDB().view(config.db + '/' +  type, function(err, res){
           if (err){ callback(err); }
           else{
               let allItems = res.map(function (element) { return element.key; } );
               let criteriaProps =  Object.keys(criteria);
               let count = 0;

               allItems.forEach( function(element){

                   for (var prop in criteriaProps){

                       if ( ! element.hasOwnProperty( criteriaProps[prop] ) ){
                           return;
                       }else{

                           if ( criteria[ criteriaProps[prop] ] !== element[ criteriaProps[prop] ]){
                               return;
                           }
                       }
                   }
                   count ++;
               });

               callback(null, count);
           }
        });
    }

    //TODO  a better way has to be found to replace some mongodb queries such as $ne
    //TODO deprecate this function after building a proper query mechanism
    static deleteOne(type, criteria, callback){
        let db =  CouchHelper.getDB();

        db.view(config.db + '/' +  type, function(err, res) {
            if (err) {
                console.log("Error", err);
                callback(err);
            }
            else {

                let data =  res.map(function (elem) {
                    return elem.key;
                });


                let responses =  data.filter(function(elem){

                    for ( var criterion in criteria){
                        if (elem.hasOwnProperty(criteria[criterion].prop)){

                            let valueCheck = criteria[criterion].value === elem[ criteria[criterion].prop ];
                            let polarityCheck = criteria[criterion].polarity === -1;

                            if (
                                ! ((valueCheck && ! polarityCheck) || ( !valueCheck && polarityCheck))
                            ){ return false;}

                        }else{ return false;}

                    }
                    return true;
                });

                if (responses){
                    let iter = 0;
                    let count = 0;

                    for (var response  in responses){
                        db.remove(responses[response]._id, responses[response]._rev, function(err, success){
                            iter ++;
                            if (err){ callback(err); }
                            else{
                                count ++;
                                if (iter === responses.length){
                                    //console.log("\n\nResp:::\n\n", success);
                                    callback(null, count);
                                }
                            }
                        });
                    }

                }
                else{
                    //TODO actual approach to throw 404 instead of this
                    callback(null, {"StatusCode" : 404, "error" : "Not Found", "message" : "Document not found"});
                }
            }
        });
    }



}


module.exports = CouchHelper;
