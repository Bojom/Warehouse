const express = require('express');
const router = express.Router();
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
    const models = await Model.findAll({ ...filter, order: [['name', 'ASC']] });
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

// --- Brands CRUD ---
router.post('/brands', async (req, res) => {
  try {
    const brand = await Brand.create(req.body);
    res.status(201).json(brand);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/brands/:id', async (req, res) => {
  try {
    const [updated] = await Brand.update(req.body, { where: { id: req.params.id } });
    if (updated) {
      const updatedBrand = await Brand.findByPk(req.params.id);
      res.status(200).json(updatedBrand);
    } else {
      res.status(404).json({ message: 'Brand not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/brands/:id', async (req, res) => {
  try {
    const deleted = await Brand.destroy({ where: { id: req.params.id } });
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: 'Brand not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// --- Models CRUD ---
router.post('/models', async (req, res) => {
  try {
    const model = await Model.create(req.body);
    res.status(201).json(model);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/models/:id', async (req, res) => {
  try {
    const [updated] = await Model.update(req.body, { where: { id: req.params.id } });
    if (updated) {
      const updatedModel = await Model.findByPk(req.params.id);
      res.status(200).json(updatedModel);
    } else {
      res.status(404).json({ message: 'Model not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/models/:id', async (req, res) => {
  try {
    const deleted = await Model.destroy({ where: { id: req.params.id } });
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: 'Model not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// --- Part Types CRUD ---
router.post('/part-types', async (req, res) => {
  try {
    const partType = await PartType.create(req.body);
    res.status(201).json(partType);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/part-types/:id', async (req, res) => {
  try {
    const [updated] = await PartType.update(req.body, { where: { id: req.params.id } });
    if (updated) {
      const updatedPartType = await PartType.findByPk(req.params.id);
      res.status(200).json(updatedPartType);
    } else {
      res.status(404).json({ message: 'Part Type not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/part-types/:id', async (req, res) => {
  try {
    const deleted = await PartType.destroy({ where: { id: req.params.id } });
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: 'Part Type not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// --- Colours CRUD ---
router.post('/colours', async (req, res) => {
  try {
    const colour = await Colour.create(req.body);
    res.status(201).json(colour);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/colours/:id', async (req, res) => {
  try {
    const [updated] = await Colour.update(req.body, { where: { id: req.params.id } });
    if (updated) {
      const updatedColour = await Colour.findByPk(req.params.id);
      res.status(200).json(updatedColour);
    } else {
      res.status(404).json({ message: 'Colour not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/colours/:id', async (req, res) => {
  try {
    const deleted = await Colour.destroy({ where: { id: req.params.id } });
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: 'Colour not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 