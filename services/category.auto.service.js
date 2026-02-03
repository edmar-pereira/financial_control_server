const CategoryInfo = require('../models/category.info.model');

/**
 * Insere ou atualiza automaticamente uma categoria
 * SOMENTE quando a origem permite (ex: BANK)
 */
exports.autoRegisterCategory = async ({ fantasyName, categoryId, source }) => {
  if (!fantasyName || !categoryId) return;

  // 🔒 regra: só aprende automaticamente do banco
  if (source !== 'BANK') return;

  await CategoryInfo.updateOne(
    { fantasyName }, // 🔎 filtro
    {
      $set: { categoryId, source }, // 📝 atualização
      $setOnInsert: {
        fantasyName,
        createdAt: new Date(),
      },
    },
    { upsert: true }, // ⭐ AQUI acontece a inserção
  );
};
