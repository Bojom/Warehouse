const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config.js');

const PartType = sequelize.define(
  'PartType',
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
    tableName: 'part_types',
    timestamps: false,
  }
);

module.exports = PartType; 