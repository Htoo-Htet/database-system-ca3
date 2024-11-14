window.addEventListener('DOMContentLoaded', function () {

    const token = localStorage.getItem('token');
    let productId = localStorage.getItem('productId');

    const productIdInput = document.querySelector("input[type='number']");
    productIdInput.addEventListener("input", function () {
        this.value = this.value.replace(/[^0-9]/g, "");
    });

    const form = document.querySelector('form'); // Only have 1 form in this HTML
    form.querySelector('input[name=productId]').value = productId;
    form.onsubmit = function (e) {
        e.preventDefault(); // prevent using the default submit behavior

        productId = form.querySelector('input[name=productId').value;

        if (!productId) {
            alert('Product ID must not be empty.');
            return;
        }

        productIdNumber = Number(productId);
        if (!Number.isInteger(productIdNumber) || productIdNumber <= 0) {
            alert('Product ID must be a positive integer.');
            return;
        }

        // update review details by reviewId using fetch API with method PUT
        fetch(`/favourites/${productId}`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            }
        })
            .then(function (response) {
                if (response.ok) {
                    alert(`Favourite added!`);
                    window.location.href = '/product/retrieve/all';
                    
                } else {
                    // If fail, show the error message
                    response.json().then(function (data) {
                        alert(`Error adding favourite - ${data.error}`);
                    });
                }
            })
            .catch(function (error) {
                alert(`Error adding favourite`);
            });
    };
});