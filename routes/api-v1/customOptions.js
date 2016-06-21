var express = require('express');
var router = express.Router();
var path = require('path');

var defaults = require('../../helpers/config');
var _ = require('underscore');
_.mixin(require('underscore.inflections'));
var sequelize = require('../../initializers/db');
var CustomOptions = sequelize.import(path.resolve('./models/local/customOption'));

module.exports = function() {

    router.get('/', function(req, res) {
        var user = req.user;

        getInvolvedPeopleIDs(user).then((userIds) => {
            return CustomOptions.findAll({where: {userId: {$in: userIds}}}).then((options) => {
                var response = {customOptions: []};

                defaults.customOptionProducts.forEach((productType) => {
                    var customOption = {id: productType};
                    customOption.options = _.map(_.filter(options, (option) => option.productType === productType), (option) => {
                        return _.pick(option, ['text', 'value']);
                    });
                    response.customOptions.push(customOption);
                });

                res.status(200).json(response);
            });
        }).catch(() => {
            console.error('USER OPTIONS ERROR: ' + user.username);
            res.status(404).json({errors: [{type: "UnexpectedError", message: "Error retrieving user options"}]});
        });
    });

    router.use('/:productType', function(req, res, next) {
        var productType = req.params.productType;
        if (_.contains(defaults.customOptionProducts, productType)) {
            next();
        } else {
            res.type('text/plain');
            res.status(404).send("404 - These aren't the products you're looking for");
            console.log('Requested resource:', req.url, '- Not Available');
        }
    });

    router.get('/:productType', function(req, res) {
        var user = req.user;
        var productType = req.params.productType;

        getInvolvedPeopleIDs(user).then((userIds) => {
            return CustomOptions.findAll({where: {userId: {$in: userIds}}}).then((options) => {
                var response = {};
                response.customOption = {id: productType};
                response.customOption.options = _.map(_.filter(options, (option) => option.productType === productType), (option) => {
                    return _.pick(option, ['text', 'value']);
                });
                res.status(200).json(response);
            });
        }).catch(() => {
            console.error('USER OPTIONS ERROR: ' + user.username);
            res.status(404).json({errors: [{type: "UnexpectedError", message: "Error retrieving user options"}]});
        });
    });

    router.put('/:productType', function(req, res) {
        var user = req.user;
        var productType = req.params.productType;
        var updatedProductOptions = req.body.customOption;

        new Promise((resolve, reject) => {
          if (user.type === 'guest') { // Guest do not have access to custom options
              return reject();
          }
          return resolve();
        }).then(() => {
            return sequelize.transaction((t) => {
                return user.getOptions({transaction: t}).then((options) => {
                    var response = {};
                    var productOptionsValues = _.map(_.filter(options, (option) => option.productType === productType), (option) => {
                        return option.value;
                    });
                    var newProductOptions = updatedProductOptions.options;
                    if (productOptionsValues.length !== newProductOptions) {

                        var newOptionsValues = _.pluck(newProductOptions, 'value');
                        var toAddValues = _.difference(newOptionsValues, productOptionsValues);
                        var toAdd = [];
                        toAddValues.forEach((value) => {
                            var option = _.findWhere(newProductOptions, {value: value});
                            option.userId = user.userId;
                            option.productType = productType;
                            toAdd.push(option);
                        });

                        return CustomOptions.bulkCreate(toAdd, {transaction: t}).then(() => {
                            return user.getOptions({transaction: t}).then((options) => {
                                var response = {};
                                response.customOption = {id: productType};
                                response.customOption.options = _.map(_.filter(options, (option) => option.productType === productType), (option) => {
                                    return _.pick(option, ['text', 'value']);
                                });
                                return response;
                            });
                        });
                    } else {
                        return response;
                    }

                });
            });
        }).then((response) => {
            res.status(200).json(response);
        }).catch((err) => {
            console.error('USER OPTIONS ERROR: ' + err);
            res.status(200).json({errors: [{type: "UnexpectedError", message: "Error retrieving user options"}]});
        });
    });

    return router;

};

function getInvolvedPeopleIDs(user) {
    var users = []; // Users which are sharing custom options

    if (user.type === 'collaborator') {
        return user.getOwners().then((owners) => {
            users = users.concat(owners); // Add owners
            var waitForAll = [];

            // Add other collaborators
            owners.forEach((owner) => {
                waitForAll.push(owner.getCollaborators().then((collaborators) => users = users.concat(collaborators)));
            });

            return Promise.all(waitForAll);
        }).then(() => {
            users = _.map(users, (user) => user.userId);
            return users;
        });
    } else { // Owner, admin or guest
        users = users.concat(user);

        return user.getCollaborators().then((collaborators) => {
            users = users.concat(collaborators);
        }).then(() => {
            users = _.map(users, (user) => user.userId);
            return users;
        });
    }
}