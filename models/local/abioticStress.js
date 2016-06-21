var sequelize = require('../../initializers/db');

var Product = sequelize.import('./product');

module.exports = function(sequelize, Sequelize) {
    "use strict";

    var AbioticStress = sequelize.define('abiotic_stress', {
        productId: {type: Sequelize.INTEGER, primaryKey: true},
        cause: {type: Sequelize.STRING, allowNull: false},
        comments: Sequelize.TEXT, // Nullable
        file: Sequelize.STRING, // Nullable
        damage: Sequelize.INTEGER, // Nullable
        observationDate: {type: Sequelize.DATE, allowNull: false}
    });

    // Append general product info like: upload date, user who uploaded, parcels where applied, etc.
    AbioticStress.belongsTo(Product, {foreignKey: 'productId', constraints: false, scope: {type: 'abioticStress'}});
    Product.hasOne(AbioticStress, {foreignKey: 'productId', constraints: false, as: 'abioticStress'});

    return AbioticStress;
};
