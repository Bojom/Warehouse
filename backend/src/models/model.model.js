const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config.js');
const Brand = require('./brand.model.js');

const Model = sequelize.define(
  'Model',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    brand_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Brand,
        key: 'id',
      },
    },
  },
  {
    tableName: 'models',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['brand_id', 'name'],
      },
      {
        unique: true,
        fields: ['brand_id', 'code'],
      },
    ],
  }
);

Brand.hasMany(Model, { foreignKey: 'brand_id' });
Model.belongsTo(Brand, { foreignKey: 'brand_id' });

module.exports = Model; 