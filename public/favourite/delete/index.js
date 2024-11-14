window.addEventListener('DOMContentLoaded', function () {

    const token = localStorage.getItem('token');
    const previousUrl = localStorage.getItem('previousUrl');
    let productId = localStorage.getItem('productId');


    const form = document.querySelector('form'); // Only have 1 form in this HTML
    form.querySelector('input[name=productId]').value = productId;
    form.onsubmit = function (e) {
        e.preventDefault(); // prevent using the default submit behavior

        productId = form.querySelector('input[name=productId').value;

        // update review details by reviewId using fetch API with method PUT
        fetch(`/favourites/${productId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            }
        })
        .then(function (response) {
            if (response.ok) {
                alert(`Favourite removed!`);
                window.location.href = previousUrl;
                
            } else {
                // If fail, show the error message
                response.json().then(function (data) {
                    alert(`Error removing favourite - ${data.error}`);
                });
            }
        })
        .catch(function (error) {
            alert(`Error removing favourite`);
        });
        
    };
});