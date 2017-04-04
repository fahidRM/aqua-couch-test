/**
 * Created by fahid on 3/30/17.
 */
'use strict';

const Async = require('async');
const Bcrypt = require('bcrypt');
const Slug =  require('slug');
const helper =  require('./CouchHelper');
const Uuid = require('node-uuid');


class CouchSession{

    static generateKeyHash(callback) {

        const key = Uuid.v4();

        Async.auto({
            salt: function (done) {

                Bcrypt.genSalt(10, done);
            },
            hash: ['salt', function (results, done) {

                Bcrypt.hash(key, results.salt, done);
            }]
        }, (err, results) => {

            if (err) {
                return callback(err);
            }

            callback(null, {
                key,
                hash: results.hash
            });
        });
    }



    static create(userId, callback){
        const self = this;










        Async.auto({
            keyHash: this.generateKeyHash.bind(this),
            newSession: ['keyHash', function (results, done) {

                const document = {
                    userId: userId,
                    key: results.keyHash.hash,
                    time: new Date(),
                    type: "session"
                };

               /* function tx(err, rslt){
                    console.log("*******************tx*****************88");
                    console.log(err);
                    console.log(rslt);
                    console.log(rslt.id);
                }*/
                //self.insertOne(document, done);
                helper.create( document, done);

            }],
            clean: ['newSession', function (results, done) {

                console.log("Clean Up results" , results);
                console.log(results)
                function xp(err, docs){

                    console.log("*****************xp****************");
                    console.log(err);
                    console.log(docs);
                }
                function preCallback(err, docs){
                    if(err){ done(err); }
                    else{
                        let entryId =  docs.id;
                        console.log(docs);
                        console.log(done);
                        helper.findById('session', entryId, xp);
                    }
                }

                helper.deleteOne('session', [{ prop : 'userId', polarity : 1, value :  userId}, { prop: 'key', polarity : -1, value : results.keyHash.hash }], preCallback);

                //delete one:  query then delete
                //self.deleteOne(query, done);
            }]
        }, (err, results) => {

            if (err) {
                return callback(err);
            }

            results.newSession[0].key = results.keyHash.key;

            callback(null, results.newSession[0]);
        });

    }

    static pagedFind(query, field, sort, limit, page, callback){
        helper.pagedFind('session', query, field,sort, limit, page, callback);
    }

    static findById(id, callback){
        helper.findById('session', id, callback);
    }

    static findByCredentials(id, key, callback){
        const self = this;

        Async.auto({
            session: function (done) {

                helper.findById('session', id, done);
            },
            keyMatch: ['session', function (results, done) {

                if (!results.session) {
                    return done(null, false);
                }

                const source = results.session.key;
                Bcrypt.compare(key, source, done);
            }]
        }, (err, results) => {

            if (err) {
                return callback(err);
            }

            if (results.keyMatch) {
                return callback(null, results.session);
            }

            callback();
        });
    }

    static findByIdAndDelete(id, callback){
        helper.findByIdAndDelete('session', id, callback);
    }

}

module.exports =  CouchSession;