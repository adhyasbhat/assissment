const fs = require('fs');
const csv = require('csv-parser');
const axios = require('axios');
const sharp = require('sharp');
const { Request, Product } = require('./models');

// Upload CSV and initiate processing
const uploadCSV = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const requestId = generateRequestId();
    const request = new Request({ requestId, status: 'pending', createdAt: new Date(), updatedAt: new Date() });
    await request.save();

    const products = [];

    fs.createReadStream(file.path)
      .pipe(csv())
      .on('data', (row) => {
        const product = new Product({
          requestId,
          serialNumber: row['S. No.'],
          productName: row['Product Name'],
          inputImageUrls: row['Input Image Urls'].split(','),
          outputImageUrls: [],
          createdAt: new Date(),
          updatedAt: new Date()
        });
        products.push(product);
      })
      .on('end', async () => {
        await Product.insertMany(products);
        processImages(requestId, products); // Start async image processing
        res.status(200).json({ requestId });
      });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get processing status
const getStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await Request.findOne({ requestId });

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const products = await Product.find({ requestId });

    res.status(200).json({
      requestId,
      status: request.status,
      products
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Generate unique request ID
const generateRequestId = () => {
  return 'req_' + Math.random().toString(36).substr(2, 9);
};

// Compress image using sharp
const compressImage = async (imageData) => {
  return sharp(imageData).jpeg({ quality: 50 }).toBuffer();
};

// Mock function to upload image
const uploadImage = async (imageData) => {
  // Implement image upload logic
  return 'https://www.public-image-output-url.jpg';
};

// Mock function to trigger webhook
const triggerWebhook = (requestId, products) => {
  // Implement webhook logic
};

// Asynchronously process images
const processImages = async (requestId, products) => {
  try {
    const request = await Request.findOne({ requestId });
    request.status = 'processing';
    request.updatedAt = new Date();
    await request.save();

    const processedProducts = await Promise.all(products.map(async (product) => {
      const outputImageUrls = await Promise.all(product.inputImageUrls.map(async (url) => {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const compressedImage = await compressImage(response.data);
        const outputUrl = await uploadImage(compressedImage);
        return outputUrl;
      }));

      product.outputImageUrls = outputImageUrls;
      product.updatedAt = new Date();
      await product.save();
      return product;
    }));

    request.status = 'completed';
    request.updatedAt = new Date();
    await request.save();

    // Trigger webhook
    triggerWebhook(requestId, processedProducts);

  } catch (error) {
    console.error(error);
    const request = await Request.findOne({ requestId });
    request.status = 'failed';
    request.updatedAt = new Date();
    await request.save();
  }
};

module.exports = { uploadCSV, getStatus };
