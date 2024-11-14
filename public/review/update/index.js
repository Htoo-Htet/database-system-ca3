window.addEventListener('DOMContentLoaded', function () {

    const token = localStorage.getItem('token');
    let reviewId = localStorage.getItem('reviewId');


    const form = document.querySelector('form'); // Only have 1 form in this HTML
    form.querySelector('input[name=reviewId]').value = reviewId;
    form.onsubmit = function (e) {
        e.preventDefault(); // prevent using the default submit behavior

        reviewId = form.querySelector('input[name=reviewId]').value
        const rating = form.querySelector('select[name=rating]').value;
        const reviewText = form.querySelector('textarea[name=reviewText]').value;

        // update review details by reviewId using fetch API with method PUT
        fetch(`/reviews/${reviewId}`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                rating: rating,
                reviewText: reviewText
            }),
        })
        .then(function (response) {
            if (response.ok) {
                alert(`Review updated!`);
                // Clear the input field
                form.querySelector("select[name=rating]").value = "";
                form.querySelector("textarea[name=reviewText]").value = "";
            } else {
                // If fail, show the error message
                response.json().then(function (data) {
                    alert(`Error updating review - ${data.error}`);
                });
            }
        })
        .catch(function (error) {
            alert(`Error updating review`);
        });
    };
});
