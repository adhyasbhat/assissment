const fs = require('fs');
const csv = require('csv-parser');
const axios = require('axios');
const sharp = require('sharp');
const {Request,Product} = require('../Module/config')


const inputCSV = async (req, res) => {
try{
    const file = req.file;
    if (!file) {
        return res.status(400).send('Please upload a file!');
    }
    const requestId = 'requestId'+Math.floor(Math.random() * 1000);
    const request = new Request({
        requestId: requestId,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
    });
    await request.save();
    const products = [];

    fs.createReadStream(file.path).pipe(csv()).on('data',(row)=>{
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
    }).on('end',async()=>{
        await Product.insertMany(products);
        processImages(products,requestId);
        res.satus(200).json({requestId:requestId});
    });

    
}
catch(err){
    res.status(500).send('Internal Server Error');
};
}
const processImages = async (products,requestId) => {
    try{
        const request = await Request.findOne({requestID});
        request.status = 'processing';
        request.updatedAt = new Date();
        await request.save();

        const processedProducts = await Promise.all(products.map(async(product)=>{
        const outputImgURL = await Promise.all(product.inputImageUrls.map(async(url)=>{
            const respond = await axios.get(url,{responseType:'arraybuffer'});
            const compressedImage = await compressedImage(respond.data)
            const outputURL = await uploadImage(compressedImage);
            return outputURL;

        }))

        product.outputImageUrls = outputImgURL;
        product.updatedAt = new Date();
        await product.save();
        return product;
        }));

        request.status = 'completed';
        request.updatedAt = new Date();
        await request.save();

        triggerWebhook(requestId,processedProducts);
    }
    catch(err){
        console.error(err);
        const request = await Request.findOne({requestId});
        request.status = 'failed';
        request.updatedAt = new Date();
        await request.save();
    }
};  
const compressedImage = async (img) => {
    return sharp(img).jpeg({quality:50}).toBuffer();
};
const uploadImage = async (imageData, fileName) => {
    const outputPath = path.join(__dirname, '..', 'uploads', 'processed', fileName);
    await fs.promises.writeFile(outputPath, imageData);
    return outputPath;
  };
module.exports = { inputCSV };