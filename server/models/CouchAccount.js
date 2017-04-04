/**
 * Created by fahid on 3/30/17.
 */
'use strict';
const helper = require('./CouchHelper');

class CouchAccount {

    static create(name, callback) {


        const nameParts = name.trim().split(/\s/);
        const document = {
            name: {
                first: nameParts.shift(),
                middle: nameParts.length > 1 ? nameParts.shift() : undefined,
                last: nameParts.join(' ')
            },
            notes: [],
            timeCreated: new Date(),
            type: "account"
        };

        function preCallback(err, docs){
            if(err){ callback(err); }
            else{
                let entryId =  docs.id;
                helper.findById('account', entryId, callback);
            }
        }

        helper.create(document, preCallback);

    }


    static pagedFind(query, field, sort, limit, page, callback){
        helper.pagedFind('account', query, field, sort, limit, page, callback);
    }

    static findByUsername(username, callback){

        function preCallback(err, res){
            if (err){ callback(err); }
            else{
                if (res && res.length > 0){ callback(null, res[0]); }
                else {
                    callback(null, res);
                }
            }
        }

        helper.findByChild('account', ['user', 'name'], username.toLowerCase(), preCallback);
    }

    static findById(id, callback){
        helper.findById('account', id, callback);
    }

    static findByIdAndUpdate(id, update, callback){
        //TODO find alternative for Mongo $push

        if( update.hasOwnProperty('$set')) {
            helper.findByIdAndUpdate('account', id, update.$set, callback);
        } else if (update.hasOwnProperty('$push')){
            helper.findByIdAndUpdate('account', id, update.$push, callback);
        }
    }

    static findByIdAndDelete(id, callback){
        helper.findByIdAndDelete('account', id, callback);
    }



}

module.exports =  CouchAccount;