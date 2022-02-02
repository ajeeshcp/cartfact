const addToCart = (proId) => {
    $.ajax({
        url:"/add-to-cart/"+proId,
        method:'get',
        success:(response) => {
            
             let count = $('#cart-count').html();
             count = parseInt(count)+1 ;
             $('#cart-count').html(count) ;
             $(document).ready(function () {
                
                    alert("Item added to cart");
            
            });
        }
    })
}