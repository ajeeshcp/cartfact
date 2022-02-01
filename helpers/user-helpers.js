const { get } = require("../config/connection");
const { USER_COLLECTION, CART_COLLECTION, PRODUCT_COLLECTION } = require("../config/collections") ;
const bcrypt = require("bcrypt") ;
const objectId  = require("mongodb").ObjectId


module.exports = {
    doSignup : (userData) =>{
        return new Promise( async(resolve, reject) => {
            if(userData.Password === userData.confirmPassword) {
                userData.confirmPassword = userData.Password = await bcrypt.hash(userData.Password, 10) ;
                get().collection(USER_COLLECTION).insertOne(userData).then((data) =>{
                    resolve(data) ;
                })    

            } else {
                reject("Password not match..")
            }
            
        })
    },
    checkEmailExist: (email) => {
        return new Promise( async(resolve, reject) => {
           const user = await get().collection(USER_COLLECTION).findOne({Email:email}) ;
           resolve(user)
           
        })
    },
    checkUserExist: (userId) => {
        return new Promise(async(resolve, reject) => {
            const user = await get().collection(USER_COLLECTION).findOne({_id:userId}) ;
            resolve(user)
        })
    },
    doLogin: (loginData , userDbData) => {
        return new Promise((resolve, reject) => {
            let response = {
                user:null,
                status:false,
            }
            bcrypt.compare(loginData.Password, userDbData.Password).then((status) => {
                if(status) {
                    console.log("Login success");
                    response.user=userDbData
                    response.status=true
                    resolve(response) ;
                } else { 
                    console.log("Login failed");
                    resolve({status:false})
                }
            })

        })
        
    },
    addToCart: (prodId, userId) => {

        let proObj = {
            item:objectId(prodId),
            quantity:1
        }

        return new Promise(async(resolve, reject) => {
           let user_Id = new objectId(userId)
            let userCart =await get().collection(CART_COLLECTION).findOne({user:user_Id})
            if(userCart){
                let proExist = userCart.products.findIndex( product => product.item == prodId) ;
                if(proExist != -1){
                    get().collection(CART_COLLECTION).updateOne(
                        {
                            user:user_Id,
                           'products.item': new objectId(prodId)
                        },
                        {
                            $inc:{'products.$.quantity':1}
                        }
                    )
                }else{
                    get().collection(CART_COLLECTION).updateOne(
                        {
                           user:user_Id
                        },
                        {
                            $push:{products:proObj}
                        }
                    ).then((response) => resolve())
                }
    
            } else {
                let cartObj = {
                    user: new objectId(userId),
                    products:[proObj]
                }
                get().collection(CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve(response)
                })
            }
        })
    },

    getCartProducts: (userId) => {
        
        return new Promise( async(resolve, reject) => {
            let cartItems = await get().collection(CART_COLLECTION).aggregate([
                {
                    $match:{user:new objectId(userId)}
                },
               {
                   $unwind:'$products'
               },
               {
                   $project:{
                       item:'$products.item',
                       quantity:'$products.quantity'
                   }
               },
               {
                   $lookup:{
                       from:PRODUCT_COLLECTION,
                       localField:'item',
                       foreignField:'_id',
                       as:'product'
                   }
               },
               {
                   $project:{
                       item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                   }
               }
            ]).toArray();
           
            resolve(cartItems)
        });
       
    },
    getCartCount: (userId) => {
        return new Promise(async( resolve, reject) => {
            let count = 0 ;
            let cart = await get().collection(CART_COLLECTION).findOne({user: new objectId(userId)})
            cart ? count = cart.products.length : null ;
            resolve(count)
        })
    },
    changeProductQuantity: ({cart,product,count}) => {
        count = parseInt(count)
        return new Promise((resolve, reject) =>{
            get().collection(CART_COLLECTION).updateOne(
                {
                    _id:new objectId(cart),
                   'products.item': new objectId(product)
                },
                {
                    $inc:{'products.$.quantity':count}
                }
            ).then((response) => resolve(count) )
        })
    }

}