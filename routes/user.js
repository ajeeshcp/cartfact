var express = require('express');
var router = express.Router();
const productHelpers = require("../helpers/product-helpers") ;
const userHelpers = require("../helpers/user-helpers") ;

const verifyLogin = (req, res, next) =>{
  if(req.session.userloggedIn){
    next() ;
  } else {
    res.redirect("/login")
  }
}

/* GET home page. */
router.get('/',async function(req, res, next) {
  let user = req.session.user ;
  let cartCount = null
  if(user){
   cartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  productHelpers.getAllProducts().then((products) => {
    res.render('user/view-products',{products, user,cartCount});
  })
  
});
router.get("/login", (req, res) => {

    if(req.session.userloggedIn){
      res.redirect("/")
    }else
    res.render("user/login",{"loginErr":req.session.userloginErr})
    req.session.userloginErr = false ;
    
})
router.get("/signup", (req, res) => {
    res.render("user/signup")
})
router.post("/signup" , (req,res) =>{
  userHelpers.checkEmailExist(req.body.Email).then((data) =>{
    if(data){
        res.send("Email already taken")     
    } else {
        userHelpers.doSignup(req.body).then((response) => {
          userHelpers.checkUserExist(response.insertedId).then((data) => {
            req.session.userloggedIn = true ;
            req.session.user = data
            res.redirect("/")
          })
        }).catch((err) =>{
          res.send(err)
        })
    }

  })
  
})

router.post("/login", (req, res) => {
  userHelpers.checkEmailExist(req.body.Email).then((data) =>{
    if(data){
      userHelpers.doLogin(req.body, data).then((response) =>{
        if(response.status){

          req.session.user=response.user ;
          req.session.userloggedIn=true ;
          res.redirect("/")

        }else{
          req.session.userloginErr = true ;
          res.redirect("/login") ;
        }
      })
    }else {
      res.send("No account found associated with this email account!") 
    }
  })
})

router.get("/logout", (req, res) => {
  req.session.user=null;
  res.redirect("/")
})

router.get("/cart", verifyLogin ,async(req, res) => {
  
    let user = req.session.user._id ;
    let cartProducts = await userHelpers.getCartProducts(user)
    userHelpers.getTotalAmount(user).then((TotalAmount) => {

      res.render("user/cart",{cartProducts,user:req.session.user._id,TotalAmount})
    }).catch((err) => {
      console.log(err);
    })
  
 
})

router.get("/add-to-cart/:id" , (req, res) => {
  userHelpers.addToCart(req.params.id, req.session.user._id).then((data) => {
    res.json({status:true}) ;
  }).catch((err) => res.json(err))
})

router.post("/change-product-quantity", (req,res,next) => {
  userHelpers.changeProductQuantity(req.body).then(async(data) => {
    data.TotalAmount = await userHelpers.getTotalAmount(req.body.user)
    res.json(data)
  })
})

router.get("/delete-cart-product/:id", (req, res) => {
  userHelpers.deleteCartProduct(req.params.id, req.session.user._id).then((data) =>{
    res.redirect("/cart")
  })
})

router.get("/detailed-view/:id", (req,res) => {
  let user = req.session.user ;
  productHelpers.getProductDetails(req.params.id).then((product) => {
    res.render("user/detailedView",{user, product})
  })
})
router.get("/place-order",verifyLogin, async(req, res ) => {
  let user = req.session.user ;
  let TotalAmount = await userHelpers.getTotalAmount(user._id)
  if(TotalAmount === 0){
    res.render("user/notFound",{user})
  }else{
    res.render("user/placeOrder",{user,TotalAmount})
  }
})
router.post("/place-order", async(req, res) => {

  let products = await userHelpers.getCartProductsList(req.body.userId) ;
  let totalPrice =await userHelpers.getTotalAmount(req.body.userId) ;
  if(totalPrice){
    userHelpers.placeOrder(req.body, products, totalPrice).then((orderId) => {
      if(req.body.payment === "cod"){
        res.json({codSuccess:true})
      }else{
        console.log(totalPrice);
        userHelpers.generateRazorpay(orderId,totalPrice).then((response) => {
          console.log("this is resp",response);
          res.json(response)
        }).catch((err) => {
          console.log("reject",err);
        })
      }
       
    })
  }
 
} )
router.get("/orderThanks", (req,res) => {
  res.render("user/orderThanks",{user:req.session.user})
})
router.get("/orders",verifyLogin, (req,res) => {
  userHelpers.getOrderDetails(req.session.user._id).then((orders) => {
    res.render("user/orders",{orders,user:req.session.user})
  }).catch((err) => console.log("err",err))
})
router.get("/remove-order-item/:id/:orderId", (req, res) =>{
  let orderId = req.params.orderId
  userHelpers.removeOrderItem(req.params.id ,orderId).then(async(response) => {
    let order = await userHelpers.getOrderItems(orderId);
    if(order[0].products.length === 0){
      userHelpers.removeOrder(orderId).then((response) => {
        resolve()
      })
    }
    res.redirect("/orders")

  })
})
router.get("/order-receipt/:orderId" , (req,res) => {
  let orderId = req.params.orderId ;
  userHelpers.getOrderItems(orderId).then((data) => {
    res.render("user/orderReciept",{data:data[0],user:req.session.user})
  })
  
})
router.post("/verify-payment", (req, res) => {
  userHelpers.verifyPayment(req.body).then(() => {
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
      res.json({status:true})
    })
  }).catch((err) => {
    console.log("err",err);
      res.json({status: false})
  })
})

module.exports = router;

