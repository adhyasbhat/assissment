// const fs = require('fs');
// const csv = require('csv-parser');
// const json2csv = require('json2csv').parse;
// const axios = require('axios');
// const sharp = require('sharp');
// const path = require('path');
// const {Request,Product} = require('../Module/config')


// const inputCSV = async (req, res) => {
// try{
    
//     const file = req.file;
//     if (!file) {
//         return res.status(400).send('Please upload a file!');
//     }
//     console.log(file)
//     const requestId = 'requestId'+Math.floor(Math.random() * 1000);
//     console.log(requestId)
//     const request = new Request({
//         requestId: requestId,
//         status: 'pending',
//         createdAt: new Date(),
//         updatedAt: new Date()
//     });
//     console.log(file)
//     console.log(request)
//     await request.save();
//     const products = [];
//     console.log(products,"pro")
//     console.log(file.path)
//     fs.createReadStream(file.path).pipe(csv()).on('data',(row)=>{
//         const product = new Product({
//             requestId: requestId,
//             serialNumber: row['S. No.'],
//             productName: row['Product Name'],
//             inputImageUrls: row['Input Image Urls'].split(','),
//             outputImageUrls: [],
//             createdAt: new Date(),
//             updatedAt: new Date()
//         });
//         products.push(product);
//     }).on('end',async()=>{
//         await Product.insertMany(products);
//         processImages(products,requestId);
//         res.status(200).json({requestId:requestId});
//     });

    
// }
// catch(err){
//     res.status(500).send(err);
// };
// }
// const processImages = async (products,requestId) => {
//     try{
//         const request = await Request.findOne({requestId});
//         request.status = 'processing';
//         request.updatedAt = new Date();
//         await request.save();

//         const processedProducts = await Promise.all(products.map(async(product)=>{
//         const outputImgURL = await Promise.all(product.inputImageUrls.map(async(url)=>{
//             const respond = await axios.get(url,{responseType:'arraybuffer'});
//             const compressedImage = await compressImage(respond.data)
//             const outputURL = await uploadImage(compressedImage,generateFileName);
//             return outputURL;

//         }))

//         product.outputImageUrls = outputImgURL;
//         product.updatedAt = new Date();
//         await product.save();
//         return product;
//         }));

//         request.status = 'completed';
//         request.updatedAt = new Date();
//         await request.save();

//         triggerWebhook(requestId,processedProducts);
//     }
//     catch(err){
//         console.error(err);
//         const request = await Request.findOne({requestId});
//         request.status = 'failed';
//         request.updatedAt = new Date();
//         await request.save();
//     }
// };  
// const compressImage = async (img) => {
//     return sharp(img).jpeg({quality:50}).toBuffer();
// };
// const generateFileName = () => {
//     return `${Date.now()}.jpg`; // Generate a unique filename for each processed image
//   };
// const uploadImage = async (imageData, fileName) => {
//     const outputPath = path.join(__dirname, '..', 'uploads', 'processed', fileName);
//     await fs.promises.writeFile(outputPath, imageData);
//     return outputPath;
//   };
//   const getStatus = async (req, res) => {
//     try {
//       const requestId = req.params.requestId;
//       const request = await Request.findOne({ requestId });
//       if (!request) {
//         return res.status(404).send('Request not found');
//       }
//       res.status(200).json({ status: request.status });
//     } catch (err) {
//       console.error(err);
//       res.status(500).send('Internal Server Error');
//     }
//   };
//   const getOutputCSV = async (req, res) => {
//     try {
//       const requestId = req.params.requestId;
//       const products = await Product.find({ requestId });
      
//       if (products.length === 0) {
//         return res.status(404).send('No products found for the given requestId');
//       }
      
//       const fields = ['serialNumber', 'productName', 'inputImageUrls', 'outputImageUrls'];
//       const opts = { fields, delimiter: ',' };
//       const csvData = json2csv(products, opts);
      
//       res.header('Content-Type', 'text/csv');
//       res.attachment(`${requestId}_output.csv`);
//       return res.send(csvData);
//     } catch (err) {
//       console.error(err);
//       res.status(500).send('Internal Server Error');
//     }
//   };
// module.exports = { inputCSV , getStatus,getOutputCSV };
const fs = require('fs');
const csv = require('csv-parser');
const json2csv = require('json2csv').parse;
const axios = require('axios');
const sharp = require('sharp');
const path = require('path');
const { Request, Product } = require('../Module/config');

const inputCSV = async (req, res) => {
  try {
    console.log("Received request for file upload");

    const file = req.file;
    if (!file) {
      console.log("No file uploaded");
      return res.status(400).send('Please upload a file!');
    }

    console.log("File received:", file);

    const requestId = 'requestId' + Math.floor(Math.random() * 1000);
    const request = new Request({
      requestId: requestId,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Log the request object
    console.log("Request to save:", request);

    // Save the request object and handle errors
    await request.save().then(() => {
      console.log("Request saved successfully.");
    }).catch((err) => {
      console.error("Error saving request:", err);
      throw new Error("Error saving request to database.");
    });

    const products = [];
    fs.createReadStream(file.path).pipe(csv()).on('data', (row) => {
      const product = new Product({
        requestId: requestId,
        serialNumber: row['S. No.'],
        productName: row['Product Name'],
        inputImageUrls: row['Input Image Urls'].split(','),
        outputImageUrls: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      products.push(product);
    }).on('end', async () => {
      await Product.insertMany(products);
      processImages(products, requestId);
      res.status(200).json({ requestId: requestId });
    });

  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
};

const processImages = async (products, requestId) => {
  try {
    const request = await Request.findOne({ requestId });
    request.status = 'processing';
    request.updatedAt = new Date();
    await request.save();

    const processedProducts = await Promise.all(products.map(async (product) => {
      const outputImgURLs = await Promise.all(product.inputImageUrls.map(async (url) => {
        try {
          console.log(`Processing image: ${url}`);
          const response = await axios.get(url, { responseType: 'arraybuffer' });
          const compressedImage = await compressImage(response.data);
          const outputURL = await uploadImage(compressedImage, generateFileName());
          console.log(`Processed image URL: ${outputURL}`);
          return outputURL;
        } catch (error) {
          console.error(`Error processing image ${url}:`, error);
          return null;
        }
      }));

      product.outputImageUrls = outputImgURLs.filter(url => url !== null);
      product.updatedAt = new Date();
      await product.save();
      return product;
    }));

    request.status = 'completed';
    request.updatedAt = new Date();
    await request.save();

    // triggerWebhook(requestId, processedProducts);
  } catch (err) {
    console.error(err);
    const request = await Request.findOne({ requestId });
    request.status = 'failed';
    request.updatedAt = new Date();
    await request.save();
  }
};

const compressImage = async (img) => {
  return sharp(img).jpeg({ quality: 50 }).toBuffer();
};

const generateFileName = () => {
  return `${Date.now()}.jpg`;
};

const uploadImage = async (imageData, fileName) => {
  const outputPath = path.join(__dirname, '..', 'uploads', 'processed', fileName);
  await fs.promises.writeFile(outputPath, imageData);
  return outputPath;
};

const getStatus = async (req, res) => {
  try {
    const requestId = req.params.requestId;
    const request = await Request.findOne({ requestId });
    if (!request) {
      return res.status(404).send('Request not found');
    }
    res.status(200).json({ status: request.status });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
};

const getOutputCSV = async (req, res) => {
  try {
    const requestId = req.params.requestId;
    const products = await Product.find({ requestId });

    if (products.length === 0) {
      return res.status(404).send('No products found for the given requestId');
    }

    const fields = ['serialNumber', 'productName', 'inputImageUrls', 'outputImageUrls'];
    const opts = { fields, delimiter: ',' };
    const csvData = json2csv(products, opts);

    res.header('Content-Type', 'text/csv');
    res.attachment(`${requestId}_output.csv`);
    return res.send(csvData);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = { inputCSV, getStatus, getOutputCSV };
