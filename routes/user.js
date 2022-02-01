var express = require('express');
var router = express.Router();
const productHelpers = require("../helpers/product-helpers") ;
const userHelpers = require("../helpers/user-helpers") ;

const verifyLogin = (req, res, next) =>{
  if(req.session.loggedIn){
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

    if(req.session.loggedIn){
      res.redirect("/")
    }else
    res.render("user/login",{"loginErr":req.session.loginErr})
    req.session.loginErr = false ;
    
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
            req.session.loggedIn = true 
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

          req.session.loggedIn=true ;
          req.session.user=response.user ;
          res.redirect("/")

        }else{
          req.session.loginErr = true ;
          res.redirect("/login") ;
        }
      })
    }else {
      res.send("No account found associated with this email account!") 
    }
  })
})

router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/")
})

router.get("/cart", verifyLogin ,async(req, res) => {
  let user = req.session.user ;
  let cartProducts = await userHelpers.getCartProducts(req.session.user._id)
  console.log("cartitems",cartProducts);
  res.render("user/cart",{cartProducts,user})
})

router.get("/add-to-cart/:id" , (req, res) => {
  userHelpers.addToCart(req.params.id, req.session.user._id).then((data) => {
    res.json({status:true}) ;
  })
})

router.post("/change-product-quantity", (req,res,next) => {
  userHelpers.changeProductQuantity(req.body).then((data) => {
    res.json({data})
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

module.exports = router;

