/**
 * Created by fahid on 3/30/17.
 */
'use strict';
const Slug =  require('slug');
const helper =  require('./CouchHelper');
class CouchStatus{


    static create(pivot, name, callback){

        const document = {
            _id: Slug(pivot + ' ' + name).toLowerCase(),
            pivot: pivot,
            name: name,
            type : "status"
        };

        helper.create(document, callback);
    }


    static pagedFind(query, field, sort, limit, page, callback){
         helper.pagedFind('status', query, field, sort, limit, page, callback);
    }

    static findById(id, callback){
        helper.findById('status', id, callback);
    }


    static findByIdAndUpdate(id, update, callback){
        helper.findByIdAndUpdate('status', id, { "name": update.$set.name} , callback);
    }

    static findByIdAndDelete(id, callback){
       helper.findByIdAndDelete('status', id, callback);
    }

}


module.exports =  CouchStatus;