const { get } = require("../config/connection");
const { PRODUCT_COLLECTION } = require("../config/collections");
const objectId  = require("mongodb").ObjectId
module.exports = {

    addProduct : async(product, callback) => {

        get().collection(PRODUCT_COLLECTION).insertOne(product).then((data) => {
            callback(data.insertedId) 
        })
        
    },
    getAllProducts : () => {
        return new Promise( async(resolve,reject) => {
            const products  = await get().collection(PRODUCT_COLLECTION).find().toArray() ;
            resolve(products)
        })
       

    },
    deleteProduct : (prodId) => {
        return new Promise((resolve, reject) => {
            prodId = new objectId(prodId);
            get().collection(PRODUCT_COLLECTION).remove({_id:prodId}).then((data) => {
                resolve(data)
            })
        })
       
    },
    getProductDetails :(prodId) => {
        return new Promise((resolve, reject) => {
            prodId = new objectId(prodId);
            get().collection(PRODUCT_COLLECTION).findOne({_id:prodId}).then((product) => {
                resolve(product)
            })
        })
    },
    updateProduct : (prodId,prodDetails) => {
        return new Promise((resolve, reject) => {
            prodId = new objectId(prodId);
            get().collection(PRODUCT_COLLECTION).updateOne({_id: prodId},{
                $set:{
                    prodTitle:prodDetails.prodTitle,
                    prodPrice:prodDetails.prodPrice,
                    prodCategory:prodDetails.prodCategory,
                    prodDescription:prodDetails.prodDescription
                }
            }).then((reposnse) => {
                resolve(reposnse)
            })
        })
    }

}