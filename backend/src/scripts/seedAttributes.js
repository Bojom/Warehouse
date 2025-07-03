const sequelize = require('../config/db.config.js')
const Brand = require('../models/brand.model.js')
const Model = require('../models/model.model.js')
const PartType = require('../models/partType.model.js')
const Colour = require('../models/colour.model.js')

const seedDimensions = async () => {
  try {
    // 1. Seed Brands
    const brands = await Brand.bulkCreate([
      { name: 'Apple', code: 'AP' },
      { name: 'Samsung', code: 'SS' },
      { name: 'Google', code: 'GG' },
    ])
    console.log('Brands seeded successfully')

    const apple = brands.find((b) => b.name === 'Apple')
    const samsung = brands.find((b) => b.name === 'Samsung')
    const google = brands.find((b) => b.name === 'Google')

    // 2. Seed Models, linked to Brands
    await Model.bulkCreate([
      // Apple Models
      { name: 'iPhone 16 Pro Max', code: '16PM', brand_id: apple.id },
      { name: 'iPhone 16 Pro', code: '16P', brand_id: apple.id },
      { name: 'iPhone 15', code: '15', brand_id: apple.id },
      // Samsung Models
      { name: 'Galaxy S25 Ultra', code: 'S25U', brand_id: samsung.id },
      { name: 'Galaxy Z Fold 6', code: 'ZF6', brand_id: samsung.id },
      // Google Models
      { name: 'Pixel 9 Pro', code: 'P9P', brand_id: google.id },
    ])
    console.log('Models seeded successfully')

    // 3. Seed Part Types
    await PartType.bulkCreate([
      { name: 'Screen', code: 'SCR' },
      { name: 'Battery', code: 'BAT' },
      { name: 'Camera', code: 'CAM' },
      { name: 'Back Cover', code: 'BC' },
    ])
    console.log('PartTypes seeded successfully')

    // 4. Seed Colours
    await Colour.bulkCreate([
      { name: 'Black', code: 'BLK' },
      { name: 'White', code: 'WHT' },
      { name: 'Blue', code: 'BLU' },
      { name: 'Titanium', code: 'TTN' },
    ])
    console.log('Colours seeded successfully')

    console.log('Dimension data has been seeded successfully.')
  } catch (error) {
    console.error('Failed to seed dimension data:', error)
  } finally {
    await sequelize.close()
  }
}

seedDimensions() 