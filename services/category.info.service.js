const service = require('../models/category.info.model');

exports.getCategoryInfo = async () => {
  const data = await service.find();
  return data;
};

// exports.updateCategory = async (data) => {
//   try {
//     console.log(data);
//     // if (!Array.isArray(data)) {
//     //   return res.status(400).json({ message: 'Invalid data format' });
//     // }

//     const bulkOps = data.map((item) => ({
//       updateOne: {
//         filter: { id: item.id }, // Match documents by "id"
//         update: { $set: item }, // Update fields with new values
//         upsert: true, // Insert document if it doesn't exist
//       },
//     }));

//     const result = await service.bulkWrite(bulkOps);
//     console.log('Collection updated successfully', result.nModified);
//     return result;
//     // res
//     //   .status(200)
//     //   .json({ message: 'Collection updated successfully', result });
//   } catch (error) {
//     console.error('Error updating collection:', error);
//   }

//   // return await service.findByIdAndUpdate(id, data);
// };
