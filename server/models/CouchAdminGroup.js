/**
 * Created by fahid on 3/30/17.
 */
'use strict';
const Slug =  require('slug');
const helper =  require('./CouchHelper');

class CouchAdminGroup{


    static create(name, callback){

        const document = {
            _id: Slug(name).toLowerCase(),
            name :  name,
            type : "admin-group"
        };

        helper.create( document, callback)
    }

    static findById(id, callback){
        helper.findById('admin-group', id, callback);
    }

    static findByIdAndUpdate(id, update, callback){
        helper.findByIdAndUpdate('admin-group', id, update.$set,callback );
    }

    static findByIdAndDelete(id, callback){
        helper.findByIdAndDelete('admin-group', id, callback);
    }

    static pagedFind(query, fields, sort, limit, page, callback){
        helper.pagedFind('admin-group', query, fields, sort, limit, page, callback);
    }


    hasPermissionTo(permission){
        if (this.permissions && this.permissions.hasOwnProperty(permission)) {
            return this.permissions[permission];
        }

        return false;
    }

}

module.exports =  CouchAdminGroup;