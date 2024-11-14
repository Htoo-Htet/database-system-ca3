window.addEventListener('DOMContentLoaded', function () {

    const token = localStorage.getItem('token');
    let reviewId = localStorage.getItem('reviewId');


    const form = document.querySelector('form'); // Only have 1 form in this HTML
    form.querySelector('input[name=reviewId]').value = reviewId;
    form.onsubmit = function (e) {
        e.preventDefault(); // prevent using the default submit behavior

        reviewId = form.querySelector('input[name=reviewId').value;

        // update review details by reviewId using fetch API with method PUT
        fetch(`/reviews/${reviewId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            }
        })
            .then(function (response) {
                if (response.ok) {
                    alert(`Review deleted!`);
                    
                    
                } else {
                    // If fail, show the error message
                    response.json().then(function (data) {
                        alert(`Error deleting review - ${data.error}`);
                    });
                }
            })
            .catch(function (error) {
                alert(`Error deleting review`);
            });
    };
});
