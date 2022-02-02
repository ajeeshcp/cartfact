
  const changeQuantity = (cartId, proId,userId, count) => {
    $.ajax({
      url:'/change-product-quantity',
      data:{
        user:userId,
        cart:cartId,
        product:proId,
        count:count
      },
      method:'post',
      success:(response) => {
          let count = $(`#${proId}`).html();
          count = parseInt(count)+response.count ;
            $(`#${proId}`).html(count) ;
            console.log(proId);
            if(count < 2 || count === 1){
                $(`.${proId}`).hide();
            }else{
                $(`.${proId}`).show();
            }
            $("#total").html(response.TotalAmount) ;

           
      }
    })
  }
