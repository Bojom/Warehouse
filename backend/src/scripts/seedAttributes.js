const sequelize = require('../config/db.config.js')
const Brand = require('../models/brand.model.js')
const Model = require('../models/model.model.js')
const PartType = require('../models/partType.model.js')
const Colour = require('../models/colour.model.js')

const seedDimensions = async () => {
  try {
    // Helper function for findOrCreate
    const findOrCreateItem = async (model, item) => {
      const [instance, created] = await model.findOrCreate({
        where: { code: item.code },
        defaults: item,
      });
      if (!created) {
        // If the item was found, update its name
        await instance.update({ name: item.name });
      }
      return instance;
    }

    // 1. Seed Brands
    const brandData = [
      { name: 'Apple', code: 'A' },
      { name: 'Samsung', code: 'S' },
      { name: 'Google', code: 'G' },
    ]
    const brands = await Promise.all(brandData.map(b => findOrCreateItem(Brand, b)))
    console.log('Brands seeded or found successfully')

    const apple = brands.find((b) => b.name === 'Apple')
    const samsung = brands.find((b) => b.name === 'Samsung')
    const google = brands.find((b) => b.name === 'Google')

    // 2. Seed Models, linked to Brands
    const modelData = [
      // Apple Models
      { name: 'iPhone 16 Pro Max', code: '16PM', brand_id: apple.id },
      { name: 'iPhone 16 Pro', code: '16P', brand_id: apple.id },
      { name: 'iPhone 15', code: '15', brand_id: apple.id },
      // Samsung Models
      { name: 'Galaxy S25 Ultra', code: 'S25U', brand_id: samsung.id },
      { name: 'Galaxy Z Fold 6', code: 'ZF6', brand_id: samsung.id },
      // Google Models
      { name: 'Pixel 9 Pro', code: 'P9P', brand_id: google.id },
    ]
    // Models are not multilingual, so we use a different helper
    const findOrCreateModel = async (item) => {
        const [instance, created] = await Model.findOrCreate({
            where: { code: item.code },
            defaults: item,
        });
        if (!created) {
            // If the model was found, update its name
            await instance.update({ name: item.name });
        }
        return instance;
    };
    await Promise.all(modelData.map(m => findOrCreateModel(m)))
    console.log('Models seeded or found successfully')

    // 3. Seed Part Types
    const partTypeData = [
        { name: 'Screen', code: 'SCR' },
        { name: 'Battery', code: 'BAT' },
        { name: 'Rear Camera', code: 'RCM' },
        { name: 'Front Camera', code: 'FCM' },
        { name: 'Back Cover', code: 'BC'  },
        { name: 'Motherboard', code: 'MB'  },
        { name: 'Logic Board', code: 'LB'  },
        { name: 'Charging Port', code: 'CP'  },
        { name: 'Speaker', code: 'SPK' },
        { name: 'Microphone', code: 'MIC' },
        { name: 'Earpiece', code: 'EAR' },
        { name: 'Headphone Jack', code: 'HPJ' },
        { name: 'SIM Tray', code: 'SIM' },
        { name: 'SD Card Slot', code: 'SDS' },
        { name: 'Power Button', code: 'PWR' },
        { name: 'Volume Button', code: 'VOL' },
        { name: 'Home Button', code: 'HOM' },
        { name: 'Fingerprint Sensor', code: 'FPS' },
        { name: 'Vibrator Motor', code: 'VIB' },
        { name: 'Antenna', code: 'ANT' },
        { name: 'NFC Coil', code: 'NFC' },
        { name: 'Wireless Charge Coil', code: 'WCC' },
        { name: 'Proximity Sensor', code: 'PRX' },
        { name: 'Light Sensor', code: 'ALS' },
        { name: 'Gyroscope', code: 'GYR' },
        { name: 'Accelerometer', code: 'ACC' },
        { name: 'Infrared Blaster', code: 'IRB' },
        { name: 'Face-ID Module', code: 'FID' },
        { name: 'Display Flex Cable', code: 'DFC' },
        { name: 'Camera Lens', code: 'CLS' }
    ]
    await Promise.all(partTypeData.map(pt => findOrCreateItem(PartType, pt)))
    console.log('PartTypes seeded or found successfully')

    // 4. Seed Colours
    const colourData = [
        { name: 'Black', code: 'BLK' },
        { name: 'White', code: 'WHT' },
        { name: 'Blue', code: 'BLU' },
        { name: 'Red', code: 'RED' },
        { name: 'Green', code: 'GRN' },
        { name: 'Yellow', code: 'YLW' },
        { name: 'Gold', code: 'GLD' },
        { name: 'Silver', code: 'SLV' },
        { name: 'Gray', code: 'GRY' },
        { name: 'Purple', code: 'PRP' },
        { name: 'Pink', code: 'PNK' },
        { name: 'Orange', code: 'ORG' },
        { name: 'Brown', code: 'BRN' },
        { name: 'Cyan', code: 'CYN' },
        { name: 'Magenta', code: 'MAG' },
        { name: 'Navy', code: 'NAV' },
        { name: 'Teal', code: 'TEL' },
        { name: 'Rose Gold', code: 'RGL' },
        { name: 'Graphite', code: 'GPH' },
        { name: 'Midnight', code: 'MID' },
        { name: 'Starlight', code: 'STL' },
        { name: 'Titanium', code: 'TTN' }
    ]
    await Promise.all(colourData.map(c => findOrCreateItem(Colour, c)))
    console.log('Colours seeded or found successfully')

    console.log('Dimension data has been seeded successfully.')
  } catch (error) {
    console.error('Failed to seed dimension data:', error)
  } finally {
    await sequelize.close()
  }
}

seedDimensions() 