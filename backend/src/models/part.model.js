// backend/src/models/part.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config.js');
const Supplier = require('./supplier.model.js');
const Brand = require('./brand.model.js');
const Model = require('./model.model.js');
const PartType = require('./partType.model.js');
const Colour = require('./colour.model.js');

const Part = sequelize.define(
  'Part',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    part_number: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    part_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    unit: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'pcs',
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    stock_min: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    stock_max: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
    },
    supplier_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Supplier,
        key: 'id',
      },
    },
    brand_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Brand,
        key: 'id',
      },
    },
    model_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Model,
        key: 'id',
      },
    },
    part_type_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: PartType,
        key: 'id',
      },
    },
    colour_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Colour,
        key: 'id',
      },
    },
  },
  {
    tableName: 'parts',
    timestamps: true,
    createdAt: 'creation_time',
    updatedAt: 'updated_time',
  }
);

// match Supplier hasMany Part
Supplier.hasMany(Part, { foreignKey: 'supplier_id' });
// one Part belongs To one Supplier
Part.belongsTo(Supplier, { foreignKey: 'supplier_id' });

// Brand <> Part
Brand.hasMany(Part, { foreignKey: 'brand_id' });
Part.belongsTo(Brand, { foreignKey: 'brand_id' });

// Model <> Part
Model.hasMany(Part, { foreignKey: 'model_id' });
Part.belongsTo(Model, { foreignKey: 'model_id' });

// PartType <> Part
PartType.hasMany(Part, { foreignKey: 'part_type_id' });
Part.belongsTo(PartType, { foreignKey: 'part_type_id' });

// Colour <> Part
Colour.hasMany(Part, { foreignKey: 'colour_id' });
Part.belongsTo(Colour, { foreignKey: 'colour_id' });

module.exports = Part;
