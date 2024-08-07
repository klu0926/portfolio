'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Post extends Model {
    static associate(models) {
      Post.belongsToMany(models.Tag, {
        through: models.PostTag,
        foreignKey: 'postId',
        as: 'tags',
        onDelete: 'CASCADE'
      })
    }
  }
  Post.init({
    title: DataTypes.STRING,
    group: DataTypes.STRING,
    cover: DataTypes.STRING,
    data: DataTypes.TEXT,
    description: DataTypes.STRING,
    backgroundHex: DataTypes.STRING,
    order: DataTypes.INTEGER,
    meta: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Post',
  });
  return Post;
};