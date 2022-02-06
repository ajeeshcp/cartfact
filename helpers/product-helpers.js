const { get } = require("../config/connection");
const bcrypt = require("bcrypt") ;
const { PRODUCT_COLLECTION, ORDER_COLLECTION,ADMIN_COLLECTION } = require("../config/collections");
const objectId  = require("mongodb").ObjectId
module.exports = {

    addProduct : async(product, callback) => {
        product.prodPrice=parseInt(product.prodPrice);

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
                console.log("enthaddaaa fear ayoo" , product);
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
    },
    getOrdersList: () => {
        return new Promise((resolve, reject) => {
            get().collection(ORDER_COLLECTION).find({status:"placed"}).toArray().then((response) => {
                resolve(response) ;
            })
        })
    },
    changeProductStatus :(orderId) => {
        return new Promise((resolve, reject) => {
            get().collection(ORDER_COLLECTION).updateOne({_id: new objectId(orderId)},
            {
                $set:{
                    status:"shipped"
                }
            }
            ).then((data) => {
                resolve(data)
            })
        })
    },
    doLogin:(loginData) => {
        return new Promise((resolve, reject) => {
            let response = {
                admin:null,
                status:false,
            }
            get().collection(ADMIN_COLLECTION).findOne({Email:loginData.Email}).then((admin) => {

                bcrypt.compare(loginData.Password, admin.Password).then((status) => {
                    if(status) {
                        console.log("Login success");
                        response.admin=admin
                        response.status=true
                        resolve(response) ;
                    } else { 
                        console.log("Login failed");
                        resolve({status:false})
                    }
                })
            }).catch((err) => reject(err))

        })
    }

}