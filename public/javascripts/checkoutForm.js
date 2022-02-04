$("#checkout-form").submit((e) => {
    e.preventDefault()
    $.ajax({
        url:'/place-order',
        method:'post',
        data:$("#checkout-form").serialize(),
        success: (response) => {
            if(response.codSuccess){
                location.href="/orderThanks"
            }else{
                console.log("ivde ethi",response);
                razorpayPayment(response) ;
            }
        }
    })
})

function razorpayPayment(order){
    console.log("called",order);
    var options = {
        "key": "rzp_test_mMVDVCnxiJOgCc", // Enter the Key ID generated from the Dashboard
        "amount": order.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
        "currency": "INR",
        "name": "Cartfact pvt limited",
        "description": "Test Transaction",
        "image": "https://example.com/your_logo",
        "order_id": order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
        "handler": function (response){
            console.log("response got");
            alert(response.razorpay_payment_id);
            alert(response.razorpay_order_id);
            alert(response.razorpay_signature) ;
            verifyPayment(response, order)


        },
        "prefill": {
            "name": "Gaurav Kumar",
            "email": "gaurav.kumar@example.com",
            "contact": "9999999999"
        },
        "notes": {
            "address": "Razorpay Corporate Office"
        },
        "theme": {
            "color": "#3399cc"
        }

    };
    var rzp1 = new Razorpay(options);
        rzp1.open();
} 

function verifyPayment(payment, order) {
    console.log("ivdeyum ethi");
    $.ajax({
        url:"/verify-payment",
        data:{
            payment,
            order
        },
        method:"post",
        success:(data)=>{

            console.log("heree",data);
        },
        error:(err) => {
            console.log(err);
        } 
    })
}