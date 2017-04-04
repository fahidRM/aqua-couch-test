/**
 * Created by fahid on 4/4/17.
 */
'use strict';
const AdminGroup = ('./CouchAdminGroup');
// require('./admin-group');
const Async = require('async');
const helper = require('./CouchHelper');

class CouchAdmin {


    static create(name, callback) {

        const nameParts = name.trim().split(/\s/);

        const document = {
            name: {
                first: nameParts.shift(),
                middle: nameParts.length > 1 ? nameParts.shift() : undefined,
                last: nameParts.join(' ')
            },
            timeCreated: new Date(),
            type: "admin"
        };

        function preCallback(err, docs){
            if(err){ callback(err); }
            else{
                let entryId =  docs.id;
                helper.findById('admin', entryId, callback);
            }
        }

        helper.create(document, preCallback);


    }


    static pagedFind(query, field, sort, limit, page, callback){
        helper.pagedFind('admin', query, field, sort, limit, page, callback);
    }

    static findById(id, callback){
        helper.findById('admin', id, callback);
    }

    static findByIdAndDelete(id, callback){
        helper.findByIdAndDelete('admin', id, callback);
    }

    static findByIdAndUpdate(id, update, callback){

        helper.findByIdAndUpdate('admin', id, update.$set, callback);

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

        helper.findByChild('admin', ['user', 'name'], username.toLowerCase(), preCallback);
    }

    constructor(attrs) {
        Object.defineProperty(this, '_groups', {
            writable: true,
            enumerable: false
        });
    }

    isMemberOf(group) {

        if (!this.groups) {
            return false;
        }

        return this.groups.hasOwnProperty(group);
    }

    hydrateGroups(callback) {

        if (!this.groups) {
            this._groups = {};
            return callback(null, this._groups);
        }

        if (this._groups) {
            return callback(null, this._groups);
        }

        const tasks = {};

        Object.keys(this.groups).forEach((group) => {

            tasks[group] = function (done) {

                AdminGroup.findById(group, done);
            };
        });

        Async.auto(tasks, (err, results) => {

            if (err) {
                return callback(err);
            }

            this._groups = results;

            callback(null, this._groups);
        });
    }

    hasPermissionTo(permission, callback) {

        if (this.permissions && this.permissions.hasOwnProperty(permission)) {
            return callback(null, this.permissions[permission]);
        }

        this.hydrateGroups((err) => {

            if (err) {
                return callback(err);
            }

            let groupHasPermission = false;

            Object.keys(this._groups).forEach((group) => {

                if (this._groups[group].hasPermissionTo(permission)) {
                    groupHasPermission = true;
                }
            });

            callback(null, groupHasPermission);
        });
    }

}


module.exports = CouchAdmin;