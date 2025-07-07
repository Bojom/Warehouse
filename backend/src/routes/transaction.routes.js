// backend/src/routes/transaction.routes.js
const express = require('express');
const router = express.Router();
const sequelize = require('../config/db.config');
const Transaction = require('../models/transaction.model');
const Part = require('../models/part.model');
const User = require('../models/user.model');
const { protect } = require('../middleware/auth.middleware');
const { Op } = require('sequelize');
const excel = require('exceljs');

// POST /api/transactions
router.post('/', protect, async (req, res) => {
  const { part_id, trans_type, quantity, remarks } = req.body;
  const user_id = req.user.id;

  try {
    const result = await sequelize.transaction(async (t) => {
      if (trans_type === 'IN' || trans_type === 'OUT') {
        // --- Handle IN/OUT: Lock and update part stock ---
      const part = await Part.findByPk(part_id, {
        lock: t.LOCK.UPDATE,
        transaction: t,
      });
      if (!part) {
        throw new Error('配件不存在');
      }

      if (trans_type === 'IN') {
        if (part.stock_max !== null && part.stock + quantity > part.stock_max) {
          throw new Error(
            `入库失败：数量 ${quantity} 将导致库存 ${part.stock + quantity} 超过最大库存限制 ${part.stock_max}`
          );
        }
        part.stock += quantity;
        } else { // trans_type === 'OUT'
        if (part.stock < quantity) {
            throw new Error('库存不足，无法出库');
        }
        part.stock -= quantity;
        }
        await part.save({ transaction: t });

      } else if (trans_type !== 'ANOMALY') {
        // --- Handle invalid type ---
        throw new Error('无效的操作类型');
      }
      // --- For ANOMALY type, we do nothing to the stock, just log the transaction ---

      // --- Create the transaction record for all types ---
      const newTransaction = await Transaction.create(
        {
          part_id,
          user_id,
          trans_type,
          quantity,
          remarks,
        },
        { transaction: t }
      );

      return newTransaction;
    });

    res.status(201).json({ message: '操作成功', transaction: result });
  } catch (error) {
    if (
      error.message.includes('库存不足') ||
      error.message.includes('无效的操作类型') ||
      error.message.includes('入库失败')
    ) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: '操作失败', error: error.message });
  }
});

// GET /api/transactions
router.get('/', protect, async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      partId,
      type,
      startDate,
      endDate,
      brandId,
      modelId,
      partTypeId,
    } = req.query

    const offset = (page - 1) * pageSize
    let where = {}
    let partWhere = {} // Where clause for the Part model

    if (type) {
      where.trans_type = type;
    }
    if (partId && partId.length > 0) {
      const partIds = Array.isArray(partId) ? partId : partId.split(',');
      if (partIds.length > 0) {
        where.part_id = { [Op.in]: partIds };
      }
    }
    if (startDate && endDate) {
      where.trans_time = { [Op.between]: [new Date(startDate), new Date(endDate)] }
    }

    // New filtering logic for part attributes
    if (brandId) partWhere.brand_id = brandId
    if (modelId) partWhere.model_id = modelId
    if (partTypeId) partWhere.part_type_id = partTypeId

    const { count, rows } = await Transaction.findAndCountAll({
      where,
      include: [
        {
          model: Part,
          as: 'Part',
          attributes: ['part_name', 'part_number'],
          where: partWhere, // Apply part filters here
          required: Object.keys(partWhere).length > 0 || partId, // Make join required if filtering by part attributes
        },
        {
          model: User,
          attributes: [['user_name', 'operator']],
          required: false, // Use LEFT JOIN
        },
      ],
      order: [['trans_time', 'DESC']],
      limit: parseInt(pageSize, 10),
      offset: offset,
      raw: true, // Use raw: true to get plain objects
      nest: true, // Use nest: true to nest included models
    });

    // With raw: true and nest: true, the data is already in a clean format.
    // We just need to ensure the top-level properties are consistent.
    const formattedTransactions = rows.map(t => ({
      id: t.id,
      trans_type: t.trans_type,
      quantity: t.quantity,
      part_id: t.part_id,
      part_number: t.Part?.part_number ?? 'N/A',
      part_name: t.Part?.part_name ?? 'N/A',
      operator: t.User?.operator ?? 'N/A', // Access the aliased 'operator' field
      trans_time: t.trans_time,
      remarks: t.remarks,
    }));

    res.json({
      total: count,
      data: formattedTransactions,
    });
  } catch (error) {
    console.error('Failed to get transactions:', error);
    res.status(500).json({ message: '获取记录失败', error: error.message });
  }
});

// GET /api/transactions/summary
router.get('/summary', protect, async (req, res) => {
  try {
    const { partId, type, startDate, endDate } = req.query;
    const trans_type = type;

    const whereCondition = {};
    if (partId && partId.length > 0) {
      whereCondition.part_id = { [Op.in]: partId.split(',') };
    }
    if (trans_type && trans_type.length > 0) {
      whereCondition.trans_type = trans_type;
    }
    if (startDate && endDate) {
      whereCondition.trans_time = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    const summary = await Transaction.findAll({
      where: whereCondition,
      attributes: [
        [
          sequelize.fn('DATE_TRUNC', 'day', sequelize.col('trans_time')),
          'date',
        ],
        'trans_type',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity'],
      ],
      group: ['date', 'trans_type'],
      order: [['date', 'ASC']],
      raw: true,
    });
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get transaction summary' });
  }
});

// GET /api/transactions/export
router.get('/export', protect, async (req, res) => {
  try {
    const { partId, userId, type, startDate, endDate } = req.query;
    
    // Determine language from 'Accept-Language' header, default to 'en'
    const langHeader = req.headers['accept-language'] || 'en';
    console.log('Received Accept-Language Header:', langHeader); // <-- ADDING THIS LOG
    const firstLang = langHeader.split(',')[0].trim().toLowerCase();
    
    let locale = 'en'; // Default to English
    if (firstLang.startsWith('zh')) {
      locale = 'zh';
    } else if (firstLang.startsWith('fr')) {
      locale = 'fr';
    }

    const trans_type = type;

    // Translation mappings
    const translations = {
      zh: {
        fileName: '出入库记录',
        worksheetName: '出入库记录',
        headers: {
          time: '操作时间',
          partNumber: '配件编号',
          partName: '配件名称',
          type: '类型',
          quantity: '数量',
          user: '经手人',
          remarks: '备注'
        },
        types: {
          IN: '入库',
          OUT: '出库',
          ANOMALY: '异常',
          UNKNOWN: '未知'
        }
      },
      en: {
        fileName: 'Transaction Records',
        worksheetName: 'Transaction Records',
        headers: {
          time: 'Operation Time',
          partNumber: 'Part Number',
          partName: 'Part Name',
          type: 'Type',
          quantity: 'Quantity',
          user: 'Operator',
          remarks: 'Remarks'
        },
        types: {
          IN: 'In',
          OUT: 'Out',
          ANOMALY: 'Anomaly',
          UNKNOWN: 'Unknown'
        }
      },
      fr: {
        fileName: 'Dossiers de Transaction',
        worksheetName: 'Dossiers de Transaction',
        headers: {
          time: 'Heure de l\'opération',
          partNumber: 'Numéro de pièce',
          partName: 'Nom de la pièce',
          type: 'Type',
          quantity: 'Quantité',
          user: 'Opérateur',
          remarks: 'Remarques'
        },
        types: {
          IN: 'Entrée',
          OUT: 'Sortie',
          ANOMALY: 'Anomalie',
          UNKNOWN: 'Inconnu'
        }
      }
    };

    const t = translations[locale] || translations.en;

    const whereCondition = {};
    if (partId && partId.length > 0) {
      const partIds = partId.split(',');
      whereCondition.part_id = { [Op.in]: partIds };
    }
    if (userId) whereCondition.user_id = userId;
    if (trans_type && trans_type.length > 0) {
      whereCondition.trans_type = trans_type;
    }
    if (startDate && endDate) {
      whereCondition.trans_time = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    const transactions = await Transaction.findAll({
      where: whereCondition,
      include: [
        { model: Part, attributes: ['part_number', 'part_name'] },
        { model: User, attributes: [['user_name', 'username']] },
      ],
      order: [['trans_time', 'ASC']],
    });

    const getTypeText = (type) => {
      return t.types[type] || t.types.UNKNOWN;
    };

    let fileName = t.fileName;

    if (partId) {
      const partIds = partId.split(',');
      const parts = await Part.findAll({
        where: { id: { [Op.in]: partIds } },
        attributes: ['part_name'],
      });
      const partNames = parts.map((p) => p.part_name).join('-');
      if (partNames) {
        fileName += `-${partNames}`;
      }
    }

    if (startDate && endDate) {
      const formattedStartDate = new Date(startDate)
        .toISOString()
        .split('T')[0];
      const formattedEndDate = new Date(endDate).toISOString().split('T')[0];
      fileName += `-${formattedStartDate}_to_${formattedEndDate}`;
    }

    fileName += '.xlsx';

    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet(t.worksheetName);

    worksheet.columns = [
      { header: t.headers.time, key: 'time', width: 25 },
      { header: t.headers.partNumber, key: 'p_num', width: 20 },
      { header: t.headers.partName, key: 'p_name', width: 30 },
      { header: t.headers.type, key: 'type', width: 10 },
      { header: t.headers.quantity, key: 'qty', width: 10 },
      { header: t.headers.user, key: 'user', width: 15 },
      { header: t.headers.remarks, key: 'remarks', width: 40 },
    ];

    // Style the header row
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' } // A light grey color
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });


    transactions.forEach((t_instance) => {
      const t = t_instance.get({ plain: true });
      worksheet.addRow({
        time: t.trans_time,
        p_num: t.Part?.part_number,
        p_name: t.Part?.part_name,
        type: getTypeText(t.trans_type),
        qty: t.quantity,
        user: t.User?.username,
        remarks: t.remarks,
      });
    });

    const encodedFileName = encodeURIComponent(fileName);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodedFileName}`
    );

    await workbook.xlsx.write(res);
  } catch (error) {
    res.status(500).json({ message: 'Error exporting transactions' });
  }
});

module.exports = router;
