const express = require('express');
const router = express.Router();
const productHelpers = require("../helpers/product-helpers")

/* GET users listing. */
router.get('/', function(req, res, next) {
  productHelpers.getAllProducts().then((products) => {
    res.render('admin/view-products',{products, admin:true});
  })
});

router.get("/add-product",(req, res) => {
  res.render("admin/add-products", {admin:true})
})

router.post("/add-product" , (req,res) =>{

  productHelpers.addProduct(req.body,(id) => {
    const image = req.files.prodImage ;
    image.mv("./public/product-images/"+id+".png",(err,done) => {
        if(!err){
          res.render("admin/add-products",{admin:true})
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
  const product  =  await productHelpers.getProductDetails(req.params.id) ;
  res.render("admin/edit-products",{product,admin:true})
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

module.exports = router;
