const express = require('express');
const router = express.Router();
const productHelpers = require("../helpers/product-helpers") ;
const userHelpers = require("../helpers/user-helpers")

const verifyAdminLogin = (req, res, next) =>{
  if(req.session.adminloggedIn){
    next() ;
  } else {
    res.redirect("/admin/login")
  }
}

/* GET users listing. */
router.get('/',verifyAdminLogin, function(req, res, next) {
  let admin = req.session.admin
  productHelpers.getAllProducts().then((products) => {
    res.render('admin/view-products',{products, admin,Isadmin:true});
  })
});

router.get("/add-product",verifyAdminLogin,(req, res) => {
  let admin = req.session.admin
  res.render("admin/add-products", {admin,Isadmin:true})
})

router.post("/add-product" , (req,res) =>{
  let admin = req.session.admin
  productHelpers.addProduct(req.body,(id) => {
    const image = req.files.prodImage ;
    image.mv("./public/product-images/"+id+".png",(err,done) => {
        if(!err){
          res.render("admin/add-products",{admin,Isadmin:true})
        } else {
          console.log(err);
        }
    })

  })

})


router.get("/delete-product/:id", (req, res) => {
  let prodId = req.params.id ;
  productHelpers.deleteProduct(prodId).then((data) => {
    res.redirect("/admin")
  })

})

router.get("/edit-product/:id", async(req, res) => {
  let admin = req.session.admin
  const product  =  await productHelpers.getProductDetails(req.params.id) ;
  res.render("admin/edit-products",{product,admin,Isadmin:true})
})
router.post("/edit-product/:id", (req, res) => {
  productHelpers.updateProduct(req.params.id, req.body).then(() =>{
    res.redirect("/admin")
    if(req.files.prodImage){
      const image = req.files.prodImage ;
      image.mv("./public/product-images/"+req.params.id+".png")
    }
  })
})
router.get("/orders-lists", verifyAdminLogin,(req, res) => {
  let admin = req.session.admin
  productHelpers.getOrdersList().then((products) => {
    res.render("admin/viewAllOrders",{products,admin,Isadmin:true})
  }).catch((err) => console.log(err))
})
router.get("/view-order-product/:id",verifyAdminLogin,(req, res) => {
  let admin = req.session.admin
  let orderId = req.params.id ;
  userHelpers.getOrderItems(orderId).then((data) => {
    res.render("admin/orderProductview",{data:data[0],admin,Isadmin:true})
  })
})
router.get("/order-ship/:id",(req, res) => {
  let orderId = req.params.id ;
  productHelpers.changeProductStatus(orderId).then((response) => {
      res.redirect("/admin/orders-lists");
  })
})
router.get("/users-list",verifyAdminLogin, (req, res) => {
  let admin = req.session.admin
  userHelpers.getAllUsers().then((users) => {
    res.render("admin/viewAllUsers",{users,admin,Isadmin:true})
  })
})
router.get("/login", (req, res) => {
  if(req.session.adminloggedIn){
    res.redirect("/admin")
  }else{
    res.render("admin/login",{loginErr:req.session.adminloginErr,Isadmin:true})
    req.session.adminloginErr = false ;
  }
 
})
router.post("/login" ,(req, res) => {
  productHelpers.doLogin(req.body).then((response) => {
    if(response.status){
      console.log("admin login",response);
      req.session.admin=response.admin ;
      req.session.adminloggedIn=true ;
      res.redirect("/admin")
    }else{
      req.session.adminloginErr = true ;
      res.redirect("/admin/login") ;
    }
  }).catch((err) => {
    req.session.adminloginErr = true ;
    res.redirect("/admin/login") ;
  })
})
router.get("/logout", (req, res) => {
  console.log("Log outted");
  req.session.destroy()
  res.redirect("/admin/login");
  
  req.session.adminloggedIn=false ;
  req.session.admin=null;
})



module.exports = router;