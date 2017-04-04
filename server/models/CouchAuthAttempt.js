/**
 * Created by fahid on 4/3/17.
 */
'use strict';
const Async = require('async');
const Config = require('../../config');
const helper =  require('./CouchHelper');


class CouchAuthAttempt{

    static create(ip, username, callback){

        const document = {
            ip,
            username: username.toLowerCase(),
            time: new Date(),
            type : 'auth-attempt'
        };

        // existing interface expects the object that was just created
        function preCallback(err, docs){
            if(err){ callback(err); }
            else{
                let entryId =  docs.id;
                helper.findById('auth-attempt', entryId, callback);
            }
        }

        helper.create(document, preCallback);


    }

    static abuseDetected(ip, username, callback) {

    const self = this;

    Async.auto({
        abusiveIpCount: function (done) {

            const query = { ip };
            helper.count('auth-attempt', query, done);
        },
        abusiveIpUserCount: function (done) {

            const query = {
                ip,
                username: username.toLowerCase()
            };


            helper.count('auth-attempt', query, done);
        }
    }, (err, results) => {

        if (err) {
            return callback(err);
        }

        const authAttemptsConfig = Config.get('/authAttempts');
        const ipLimitReached = results.abusiveIpCount >= authAttemptsConfig.forIp;
        const ipUserLimitReached = results.abusiveIpUserCount >= authAttemptsConfig.forIpAndUser;

        callback(null, ipLimitReached || ipUserLimitReached);
    });
}

    static pagedFind( query, field, sort, limit, page, callback){
        helper.pagedFind('auth-attempt', query, field, sort, limit, page, callback);
    }

    static findById(id, callback){
        helper.findById('auth-attempt', id, callback);
    }

    static findByIdAndDelete(id, callback){
        helper.findByIdAndDelete('auth-attempt', id, callback);
    }
}


module.exports  =  CouchAuthAttempt;

