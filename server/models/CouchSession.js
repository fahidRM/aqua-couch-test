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

                function preCallback(err, docs){
                    if(err){ done(err); }
                    else{
                        let entryId =  docs.id;
                        helper.findById('session', entryId, secondPreCallback);
                    }
                }

                function secondPreCallback(err, docs){
                    if(err){ done(err); }
                    else{
                        done(null, [docs]);
                    }
                }

                helper.create( document, preCallback);

            }],
            clean: ['newSession', function (results, done) {



                helper.deleteOne('session', [{ prop : 'userId', polarity : 1, value :  userId}, { prop: 'key', polarity : -1, value : results.keyHash.hash }], done);

            }]
        }, (err, results) => {


            console.log("MOD FINAL::: ", results);

            if (err) {
                return callback(err);
            }

            results.newSession[0].key = results.keyHash.key;

            callback(null, results.newSession[0]  );
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

CouchSession.collection =  'sessions';
CouchSession.indexes = [
    { key: { userId: 1 } }
];

module.exports =  CouchSession;