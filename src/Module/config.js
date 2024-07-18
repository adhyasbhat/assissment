const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/ocr',);
const productSchema = new mongoose.Schema({
    requestId :{type: String, required: true},
    status :{type: String, required: true},
    products:[{
        serialNumber:Number,
        productName:String,
        inpurImgUrl:[String],
    }],
    outputUrl:[
        {
            serialNumber:Number,
            productName:String,
            outputImgUrl:[String],
        }
     
    ]
});
const Product = mongoose.model('Product', productSchema);
module.exports = Product;
