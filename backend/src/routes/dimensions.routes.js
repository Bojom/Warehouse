const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Brand = require('../models/brand.model.js');
const Model = require('../models/model.model.js');
const PartType = require('../models/partType.model.js');
const Colour = require('../models/colour.model.js');


// Get all brands
router.get('/brands', async (req, res) => {
  try {
    const brands = await Brand.findAll({ order: [['name', 'ASC']] });
    res.json(brands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all models, optionally filtered by brand_id
router.get('/models', async (req, res) => {
  try {
    const { brand_id } = req.query;
    const filter = brand_id ? { where: { brand_id } } : {};
    const models = await Model.findAll({ ...filter, include: [Brand], order: [['name', 'ASC']] });
    res.json(models);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all part types
router.get('/part-types', async (req, res) => {
  try {
    const partTypes = await PartType.findAll({ order: [['name', 'ASC']] });
    res.json(partTypes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all colours
router.get('/colours', async (req, res) => {
  try {
    const colours = await Colour.findAll({ order: [['name', 'ASC']] });
    res.json(colours);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generic Create/Update/Delete handlers
const handleCRUD = (model) => {
  return {
    create: async (req, res) => {
      try {
        const item = await model.create(req.body);
        res.status(201).json(item);
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    },
    update: async (req, res) => {
      try {
        const [updated] = await model.update(req.body, { where: { id: req.params.id } });
        if (updated) {
          const updatedItem = await model.findByPk(req.params.id);
          res.status(200).json(updatedItem);
        } else {
          res.status(404).json({ message: 'Item not found' });
        }
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    },
    delete: async (req, res) => {
      try {
        const deleted = await model.destroy({ where: { id: req.params.id } });
        if (deleted) {
          res.status(204).send();
        } else {
          res.status(404).json({ message: 'Item not found' });
        }
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  };
};

const brandCRUD = handleCRUD(Brand);
router.post('/brands', brandCRUD.create);
router.put('/brands/:id', brandCRUD.update);
router.delete('/brands/:id', brandCRUD.delete);

const modelCRUD = handleCRUD(Model);
router.post('/models', modelCRUD.create);
router.put('/models/:id', modelCRUD.update);
router.delete('/models/:id', modelCRUD.delete);

const partTypeCRUD = handleCRUD(PartType);
router.post('/part-types', partTypeCRUD.create);
router.put('/part-types/:id', partTypeCRUD.update);
router.delete('/part-types/:id', partTypeCRUD.delete);

const colourCRUD = handleCRUD(Colour);
router.post('/colours', colourCRUD.create);
router.put('/colours/:id', colourCRUD.update);
router.delete('/colours/:id', colourCRUD.delete);


// Search by code across all attribute types
router.get('/search-by-code', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).json({ message: 'Code parameter is required.' });
  }

  try {
    const results = [];
    const searchConfig = { where: { code: { [Op.iLike]: `%${code}%` } } };

    const brands = await Brand.findAll(searchConfig);
    brands.forEach(item => results.push({ ...item.get(), type: 'Brand' }));

    const models = await Model.findAll({ ...searchConfig, include: [Brand] });
    models.forEach(item => results.push({ ...item.get(), type: 'Model' }));

    const partTypes = await PartType.findAll(searchConfig);
    partTypes.forEach(item => results.push({ ...item.get(), type: 'Part Type' }));

    const colours = await Colour.findAll(searchConfig);
    colours.forEach(item => results.push({ ...item.get(), type: 'Colour' }));

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'An error occurred during search.', error: error.message });
  }
});

module.exports = router; 