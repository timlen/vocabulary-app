var express = require('express');
var router = express.Router();

var request = require('request'),
    mongoose = require('mongoose');

var Vocabulary = mongoose.model('App', {
    originalLanguageName: {
        type: String,
        required: true
    },
    translatedLanguageName: {
        type: String,
        required: true
    },
    words: {
        type: [],
        required: true
    },
    tliId: {
        type: String,
        required: true
    },
    teacherId: {
        type: String,
        required: true
    }
});

router.get('/init', function(req, resp, next) {
    request((process.env.API_URL || 'http://localhost:5000/api') + '/auth', function(err, response, body) {
        if(err) {
            return next(err);
        }

        var userData = JSON.parse(body);

        req.session.userData = userData;

        resp.send(userData);
    });
});

router.get('/vocabulary/:tliId', function(req, resp, next) {
    Vocabulary.findOne({tliId: req.params.tliId}, function(err, vocabulary) {
        if(err) {
            return next(err);
        }

        if(!vocabulary) {
            return resp.send({
                originalLanguageName: '',
                translatedLanguageName: '',
                words: [
                    {originalLanguage: '', translatedLanguage: ''},
                    {originalLanguage: '', translatedLanguage: ''},
                    {originalLanguage: '', translatedLanguage: ''},
                    {originalLanguage: '', translatedLanguage: ''},
                    {originalLanguage: '', translatedLanguage: ''}
                ],
                tliId: req.params.tliId,
                teacherId: req.session.userData.userId
            });
        }

        if(req.session.userData.userType === 'student') {
            vocabulary.words.forEach(function (word) {
                delete word.translatedLanguage;
            });
        }

        resp.send({
            originalLanguageName: vocabulary.originalLanguageName,
            translatedLanguageName: vocabulary.translatedLanguageName,
            words: vocabulary.words,
            tliId: vocabulary.tliId,
            teacherId: vocabulary.teacherId
        });
    });
});

router.put('/vocabulary/:tliId', function(req, resp, next) {
    if(req.session.userData.userType === 'teacher') {
        var vocabularyData = {
            originalLanguageName: req.body.originalLanguageName,
            translatedLanguageName: req.body.translatedLanguageName,
            words: req.body.words
        };

        Vocabulary.findOneAndUpdate({tliId: req.params.tliId}, vocabularyData, {upsert: true}, function(err, updatedVocabulary) {
            if(err) {
                return next(err);
            }

            resp.send(updatedVocabulary);
        });
    } else {
        resp.send('Not allowed');
    }
});

router.put('/correct/:tliId', function(req, resp, next) {
    var wordMapping = {};
    req.body.words.forEach(function(wordPair) {
        wordMapping[wordPair.originalLanguage] = wordPair.translatedLanguage;
    });

    Vocabulary.findOne({tliId: req.params.tliId}, function(err, vocabulary) {
        if(err) {
            return next(err);
        }

        vocabulary.words.forEach(function(dbWordPair) {
            if(wordMapping[dbWordPair.originalLanguage] &&
                dbWordPair.translatedLanguage.toLowerCase().trim() === wordMapping[dbWordPair.originalLanguage].toLowerCase().trim()) {
                dbWordPair.correct = true;
            }

            dbWordPair.translatedLanguage = wordMapping[dbWordPair.originalLanguage];
        });

        resp.send(vocabulary);
    });
});

module.exports = router;
