/**
 * Created by fahid on 3/29/17.
 */
'use strict';
'use strict';
const Account = require('./account');
const Admin = require('./admin');
const Async = require('async');
const Bcrypt = require('bcrypt');

class CouchUser{

    static generatePasswordHash(password, callback) {

        Async.auto({
            salt: function (done) {

                Bcrypt.genSalt(10, done);
            },
            hash: ['salt', function (results, done) {

                Bcrypt.hash(password, results.salt, done);
            }]
        }, (err, results) => {

            if (err) {
                return callback(err);
            }

            callback(null, {
                password,
                hash: results.hash
            });
        });
    }

    static create(username, password, email, callback){
        const self = this;

        Async.auto({
            passwordHash: this.generatePasswordHash.bind(this, password),
            newUser: ['passwordHash', function (results, done) {

                const document = {
                    isActive: true,
                    username: username.toLowerCase(),
                    password: results.passwordHash.hash,
                    email: email.toLowerCase(),
                    //roles : {},
                    //resetPassword: {},
                    timeCreated: new Date()
                };



                self.insertOne(document, done);
            }]
        }, (err, results) => {

            if (err) {
                return callback(err);
            }

            results.newUser[0].password = results.passwordHash.password;

            callback(null, results.newUser[0]);
        });
    }


    static findByCredentials(username, password, callback){

    }


    static findByUsername(username, callback) {

    }


    constructor(attrs) {
        //super(attrs);
        Object.defineProperty(this, '_roles', {
            writable: true,
            enumerable: false
        });
    }

    canPlayRole(role) {

        if (!this.roles) {
            return false;
        }

        return this.roles.hasOwnProperty(role);
    }

    hydrateRoles(callback) {

        if (!this.roles) {
            this._roles = {};
            return callback(null, this._roles);
        }

        if (this._roles) {
            return callback(null, this._roles);
        }

        const self = this;
        const tasks = {};

        if (this.roles.account) {
            tasks.account = function (done) {

                Account.findById(self.roles.account.id, done);
            };
        }

        if (this.roles.admin) {
            tasks.admin = function (done) {

                Admin.findById(self.roles.admin.id, done);
            };
        }

        Async.auto(tasks, (err, results) => {

            if (err) {
                return callback(err);
            }

            self._roles = results;

            callback(null, self._roles);
        });
    }

}


module.exports =  CouchUser;