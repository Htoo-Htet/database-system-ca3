window.addEventListener('DOMContentLoaded', function () {
    
    const token = localStorage.getItem("token");
    const cartProductId = localStorage.getItem("cartProductId");

    const productIdInput = document.querySelector("input[name='productId']");
    const quantityInput = document.querySelector("input[name='quantity']");
    productIdInput.value = cartProductId;
    
    productIdInput.addEventListener("input", function () {
        // Only allow numeric values
        this.value = this.value.replace(/[^0-9]/g, "");
    });

    quantityInput.addEventListener("input", function () {
        // Only allow numeric values
        this.value = this.value.replace(/[^0-9]/g, "");
    });

    const form = document.querySelector('form');
    form.onsubmit = function (e) {
        e.preventDefault();

        let productId = form.querySelector('#productId').value;
        let quantity = form.querySelector('#quantity').value;

        if (!productId || !quantity) {
            alert('Product ID and quantity must not be empty.');
            return;
        }
    
        productIdNumber = Number(productId);
        quantityNumber = Number(quantity);

        // Check if productId and quantity are positive integers
        if (!Number.isInteger(productIdNumber) || productIdNumber <= 0) {
            alert('Product ID must be a positive integer.');
            return;
        }

        if (!Number.isInteger(quantityNumber) || quantityNumber <= 0) {
            alert('Quantity must be a positive integer.');
            return;
        }

        // Add to cart
        fetch(`/carts/add`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ 
                productId: productIdNumber,
                quantity: quantityNumber 
            })
        })
        .then(function (response) {
            if (response.ok) {
                alert(`Product added to cart!`);
                window.location.href = '/product/retrieve/all';
                
            } else {
                response.json().then(function (data) {
                    alert(data.error);
                });
            }
        })
        .catch(function (error) {
            alert(`Error adding to cart.`);
        });
    }
});