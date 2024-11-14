function fetchProduct(productId) {
    const token = localStorage.getItem("token");

    return fetch(`/products/${productId}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
        .then(function (response) {
            return response.json();
        })
        .then(function (body) {
            if (body.error) throw new Error(body.error);
            const product = body.product;
            const tbody = document.querySelector("#product-tbody");

            const row = document.createElement("tr");
            row.classList.add("product");
            const nameCell = document.createElement("td");
            const descriptionCell = document.createElement("td");
            const unitPriceCell = document.createElement("td");
            const countryCell = document.createElement("td");
            const productTypeCell = document.createElement("td");
            const imageUrlCell = document.createElement("td");
            const manufacturedOnCell = document.createElement("td");
            
            nameCell.textContent = product.name
            descriptionCell.textContent = product.description;
            unitPriceCell.textContent = product.unitPrice;
            countryCell.textContent = product.country;
            productTypeCell.textContent = product.productType;
            imageUrlCell.innerHTML = `<img src="${product.imageUrl}" alt="Product Image">`;
            manufacturedOnCell.textContent = new Date(product.manufacturedOn).toLocaleString();

            row.appendChild(nameCell);
            row.appendChild(descriptionCell);
            row.appendChild(unitPriceCell);
            row.appendChild(countryCell);
            row.appendChild(productTypeCell);
            row.appendChild(imageUrlCell);
            row.appendChild(manufacturedOnCell);
            tbody.appendChild(row);

        })
        .catch(function (error) {
            console.error(error);
        });
}

function fetchReviews(productId, ratingFilter = null, orderFilter = 'reviewDate') {
    const token = localStorage.getItem("token");
    
    let url = `/products/${productId}/reviews`

    if (ratingFilter || orderFilter)
        url += `?`;
    if (orderFilter)
        url += `order=${orderFilter}&`;
    if (ratingFilter)
        url += `rating=${ratingFilter}`;

    return fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
        .then(function (response) {
            return response.json();
        })
        .then(function (body) {
            if (body.error) throw new Error(body.error);
            const reviews = body.reviews;

            const reviewsContainer = document.querySelector('#reviews-container');

            reviews.forEach(function (review) {
                const reviewDiv = document.createElement('div');
                reviewDiv.classList.add('review-row');
                let ratingStars = '';
                for (let i = 0; i < review.rating; i++) {
                    ratingStars += '⭐';
                }

                reviewDiv.innerHTML += `            
                    <h3>Member Username: ${review.username}</h3>
                    <p>Sale Order Id: ${review.saleOrderId}</p>
                    <p>Rating: ${ratingStars}</p>
                    <p>Review Text: ${review.reviewText}</p>
                    <p>Review Date: ${review.reviewDate ? review.reviewDate.slice(0, 10) : ""} </p>
                `;

                reviewsContainer.appendChild(reviewDiv);        
            });

        })
        .catch(function (error) {
            console.error(error);
        });
}

document.addEventListener('DOMContentLoaded', function () {

    
    // Add form and submit button
    // const form = document.createElement('form');
    const form = document.querySelector('#reviews-form');


    // Generate select filter for rating
    const ratingFilter = document.createElement('select');
    ratingFilter.innerHTML = `
                <option value="">All Ratings</option>
                <option value="5">⭐⭐⭐⭐⭐</option>
                <option value="4">⭐⭐⭐⭐</option>
                <option value="3">⭐⭐⭐</option>
                <option value="2">⭐⭐</option>                
                <option value="1">⭐</option>
            `;
    form.appendChild(ratingFilter);

    // Generate select filter for order
    const orderFilter = document.createElement('select');
    orderFilter.innerHTML = `        
                <option value="reviewDate">Most Recent</option>
                <option value="rating">Highest Rating</option>
            `;
    form.appendChild(orderFilter);

    // Add submit button
    const submitButton = document.createElement('button');
    submitButton.textContent = 'Submit';
    form.appendChild(submitButton);
    // document.body.appendChild(form);

    submitButton.addEventListener('click', function (e) {
        e.preventDefault(); // prevent the default form submission behavior
        const rating = ratingFilter.value;
        const order = orderFilter.value;

        const reviewsContainer = document.querySelector('#reviews-container');
        reviewsContainer.innerHTML = '';
        fetchReviews(productId, rating, order);
    });


    const productId = localStorage.getItem("productId");

    fetchProduct(productId)
        .then(function (moduleData) {
            // Process module data
            console.log(moduleData);
            return fetchReviews(productId);
        })
        .then(function () {
            // Both fetchProduct and fetchReviews have been called
            console.log('Both fetchProduct and fetchReviews have been called');
        })
        .catch(function (error) {
            // Handle error
            console.error(error);
        });
});


