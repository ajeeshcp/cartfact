
  const changeQuantity = (cartId, proId, count) => {
    $.ajax({
      url:'/change-product-quantity',
      data:{
        cart:cartId,
        product:proId,
        count:count
      },
      method:'post',
      success:(response) => {
          let count = $(`#${proId}`).html();
          count = parseInt(count)+response.data ;
            $(`#${proId}`).html(count) ;
            console.log(proId);
            if(count < 2){
                $(`.${proId}`).hide();
            }else{
                $(`.${proId}`).show();
            }
           
      }
    })
  }
