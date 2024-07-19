const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB...'))
  .catch(err => console.log(err));
  const requestSchema = new mongoose.Schema({
    requestId: { type: String, required: true, unique: true },
    status: { type: String, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
  });
  
  const productSchema = new mongoose.Schema({
    requestId: { type: String, required: true },
    serialNumber: { type: Number, required: true },
    productName: { type: String, required: true },
    inputImageUrls: { type: [String], required: true },
    outputImageUrls: { type: [String], required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
  });
  
  const Request = mongoose.model('Request', requestSchema);
  const Product = mongoose.model('Product', productSchema);
module.exports = {Request,Product};
