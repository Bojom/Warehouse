const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config.js');

const Colour = sequelize.define(
  'Colour',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    code: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
    },
  },
  {
    tableName: 'colours',
    timestamps: false,
  }
);

module.exports = Colour; 