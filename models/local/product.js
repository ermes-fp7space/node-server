var sequelize = require('../../initializers/db');

var Parcel = sequelize.import('./parcel');
var User = sequelize.import('./user');

module.exports = function(sequelize, Sequelize) {

  var Product = sequelize.define('product', {
    productId: {type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true},
    uploadDate: {type: Sequelize.DATE, allowNull: false},
    shared: {type: Sequelize.BOOLEAN, defaultValue: false},
    type: {type: Sequelize.STRING, allowNull:false}
  }, {
    instanceMethods: {
      getInnerProduct: function () {
        return this['get' + this.get('type').substr(0, 1).toUpperCase() + this.get('type').substr(1)]();
      }
    }
  });

  // A product belongs to the user that uploaded it
  Product.belongsTo(User, {as: 'user', foreignKey: 'userId'});
  User.hasMany(Product, {as: 'products', foreignKey: 'userId'});

  // A product can be applied to different parcels and a parcel holds different kinds of products
  Product.belongsToMany(Parcel, {as: 'parcels', through: 'parcel_products', foreignKey: 'productId'});
  Parcel.belongsToMany(Product, {as: 'products', through: 'parcel_products', foreignKey: 'parcelId'});

  return Product;
};