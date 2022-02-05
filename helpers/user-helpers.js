const { get } = require("../config/connection");
const { USER_COLLECTION, CART_COLLECTION, PRODUCT_COLLECTION,ORDER_COLLECTION } = require("../config/collections") ;
const bcrypt = require("bcrypt") ;
const objectId  = require("mongodb").ObjectId ;
const Razorpay = require('razorpay') ;

var instance = new Razorpay({
    key_id: 'rzp_test_mMVDVCnxiJOgCc',
    key_secret: '3yKfEOWpo5dyhkD27YTLGiyL',
  });

  

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
                    ).then((response) => resolve()).catch((err)=>reject(err))
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
            ).then((response) => resolve({count}) )
        })
    },
    deleteCartProduct : (prodId, userId) => {
        return new Promise((resolve, reject) => {
            get().collection(CART_COLLECTION).updateOne(
                {
                    user: new objectId(userId)
                },
                {
                    $pull:{products:{item: new objectId(prodId)}}
                }
            ).then((response) => {
                resolve(response)
            })
        })
    },
    getTotalAmount : (userId) => {

        return new Promise( async(resolve, reject) => {
            let TotalAmount = await get().collection(CART_COLLECTION).aggregate([
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
               },
               {
                    $group:{
                        _id:null,
                        total:{$sum:{$multiply:[ '$quantity','$product.prodPrice']}}
                    }
               }
            ]).toArray();
            if(TotalAmount.length > 0){
                resolve(TotalAmount[0].total)
            }else{
                resolve(0)
            }
            
        });

    },
    getCartProductsList : (userId) => {
        return new Promise(async(resolve, reject) => {
            let cart = await get().collection(CART_COLLECTION).findOne({user: new objectId(userId)})
            if(cart){
                resolve(cart.products)
            }else{
                reject(null)
            }
        })
    },
    placeOrder : (order, products , total) => {
        return new Promise((resolve, reject) => {
              let status = order.payment==='cod' ? 'placed' :'pending' ;
              let orderObj = {
                deliveryDetails :{
                    name: order.fullname,
                    mobile: order.phone,
                    pincode: order.pincode,
                    address: order.address,
                },
                userId:order.userId,
                paymentMethode:order.payment,
                products:products,
                status:status,
                totalAmount:total,
                date:new Date()
              }
              get().collection(ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                  get().collection(CART_COLLECTION).remove({user: new objectId(order.userId)});
                  resolve(response.insertedId)
              })
        })
    },
    getOrderDetails :(userId) => {
        return new Promise((resolve, reject) => {

            get().collection(ORDER_COLLECTION).aggregate([
                {
                    $match:{userId: userId}
                },
                {
                    $lookup:{
                        from:PRODUCT_COLLECTION,
                        localField:'products.item',
                        foreignField:'_id',
                        as:'products'
                    }
                },
               
               
            ])  
            .toArray().then((order) => {
                resolve(order)
            }).catch((err) => reject(err))
        })
    },
    removeOrderItem :(prodId, orderId) => {
        console.log(prodId,orderId);
        return new Promise((resolve, reject) => {
            get().collection(ORDER_COLLECTION).updateOne(
                {
                    _id: new objectId(orderId)
                },
                {
                    $pull:{products:{item: new objectId(prodId) }}
                }
            ).then((response) => {
                resolve(response)
            })
        })
    },
    getOrderItems :(orderId) =>{
        return new Promise((resolve, reject) => {
            get().collection(ORDER_COLLECTION).aggregate([
                {
                    $match:{_id: new objectId(orderId)}
                },
               {
                   $lookup:{
                       from:PRODUCT_COLLECTION,
                       localField:'products.item',
                       foreignField:'_id',
                       as:'products'
                   }
               },
               
               
            ])
            .toArray().then((response) => {
                resolve(response)
            })
        })
    },
    removeOrder :(orderId) => {
        return new Promise((resolve, reject) => {
            get().collection(ORDER_COLLECTION).remove({_id:new objectId(orderId)}).then((response) => {
                resolve(response)
            })
        })
    },
    generateRazorpay : (orderId, total) =>{
        return new Promise((resolve, reject) => {
            instance.orders.create({
                amount: total*100,
                currency: "INR",
                receipt: ""+orderId,
            },(err, order) => {
                if(err){
                    console.log(err);
                    reject(err)
                }else{
                    console.log("order",order);
                    resolve(order)
                }
            })
        })
    },
    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            const crypto = require('crypto');
            const secret = '3yKfEOWpo5dyhkD27YTLGiyL';
            const hash = crypto.createHmac('sha256', secret)
            .update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
            .digest('hex');

            if(hash === details['payment[razorpay_signature]']){
                resolve()
            } else {
                reject()
            }

        })
    },
    changePaymentStatus: (orderId) => {
        return new Promise((resolve, reject) => {
            get().collection(ORDER_COLLECTION).updateOne({_id:new objectId(orderId)},
            {
                $set:{
                    status:"placed"
                }
            }
            ).then(() => {
                resolve()
            })
        })
    }

}