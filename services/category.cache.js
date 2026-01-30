const { getCategoryInfo } = require('./category.info.service');

let cachedCategoryMap = null;
let cacheTimestamp = 0;

const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

const normalizeKey = (val = '') =>
  val.trim().toUpperCase();

const buildCategoryMap = (categories) => {
  const map = new Map();

  categories.forEach((cat) => {
    map.set(normalizeKey(cat.fantasyName), {
      name: cat.description || '', 
      category: cat.categoryId || 'uncategorized',
    });
  });

  return map;
};

exports.getCategoryCache = async () => {
  const now = Date.now();

  if (cachedCategoryMap && now - cacheTimestamp < CACHE_TTL) {
    return cachedCategoryMap;
  }

  const categories = await getCategoryInfo();
  cachedCategoryMap = buildCategoryMap(categories);
  cacheTimestamp = now;

  return cachedCategoryMap;
};

exports.getCategoryFromCache = (map, fantasyName = '') => {
  return (
    map.get(normalizeKey(fantasyName)) || {
      name: '',
      description: '',
      category: 'uncategorized',
    }
  );
};
