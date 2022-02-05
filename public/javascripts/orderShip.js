const orderShip = (orderId) => {
    $.ajax({
        url:'/admin/order-ship',
        data:{
          orderId:orderId
        },
        method:'post',
        success:(response) => {
            if(response.success===true){
                console.log(response);
                // alert("Order shipped")
            }else{
                alert("Eroor occured")
            }
             
        }
      })
}