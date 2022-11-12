'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Post extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Post.init({
    title: DataTypes.STRING,
    highlight: DataTypes.STRING,
    body: DataTypes.STRING(1000),
    imgUrl: DataTypes.STRING(1000),
    addedBy: DataTypes.STRING,
    modifiedBy: DataTypes.STRING,
    version: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Post',
  });
  return Post;
};