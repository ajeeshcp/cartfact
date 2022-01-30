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
        return new Promise(async(resolve, reject) => {
           let user_Id = new objectId(userId)
            let userCart =await get().collection(CART_COLLECTION).findOne({user:user_Id})
            if(userCart){

                get().collection(CART_COLLECTION).updateOne({user:user_Id},{
                    $push:{products : new objectId(prodId)}
                }).then((response) => {
                    resolve(response)
                })

            } else {
                let cartObj = {
                    user: new objectId(userId),
                    products:[new objectId(prodId)]
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
                    $lookup:{
                        from:PRODUCT_COLLECTION,
                        let:{prodList:'$products'},
                        pipeline:[
                            { 
                                $match:{
                                    $expr:{
                                        $in:['$_id',"$$prodList"]
                                    }
                                }
                            }
                        ],
                        as:'cartItems'
                    }
                }
            ]).toArray();
            resolve(cartItems[0].cartItems)
        });
       
    },
    getCartCount: (userId) => {
        return new Promise(async( resolve, reject) => {
            let count = 0 ;
            let cart = await get().collection(CART_COLLECTION).findOne({user: new objectId(userId)})
            cart ? count = cart.products.length : null ;
            resolve(count)
        })
    }

}