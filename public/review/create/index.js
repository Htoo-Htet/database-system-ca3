window.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem("token");

    fetch('/saleOrders', {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
        .then(function (response) {
            return response.json();
        })
        .then(function (body) {
            if (body.error) throw new Error(body.error);
            const saleOrders = body.saleOrders;
            const tbody = document.querySelector("#product-tbody");
            saleOrders.forEach(function (saleOrder) {
                const row = document.createElement("tr");
                row.classList.add("product");
                const nameCell = document.createElement("td");
                const descriptionCell = document.createElement("td");
                const unitPriceCell = document.createElement("td");
                const quantityCell = document.createElement("td");
                const countryCell = document.createElement("td");
                const imageUrlCell = document.createElement("td");
                const orderId = document.createElement("td");
                const orderDatetimeCell = document.createElement("td");
                const statusCell = document.createElement("td");
                const createReviewCell = document.createElement("td");
                
                nameCell.textContent = saleOrder.name;
                descriptionCell.textContent = saleOrder.description;
                unitPriceCell.textContent = saleOrder.unitPrice;
                quantityCell.textContent = saleOrder.quantity;
                countryCell.textContent = saleOrder.country;
                imageUrlCell.innerHTML = `<img src="${saleOrder.imageUrl}" alt="Product Image">`;
                orderId.textContent = saleOrder.saleOrderId;
                orderDatetimeCell.textContent = new Date(saleOrder.orderDatetime).toLocaleString();            
                statusCell.textContent = saleOrder.status;
                const viewProductButton = document.createElement("button");
                viewProductButton.textContent = "Create Review";
                viewProductButton.addEventListener('click', function () {
                    const reviewSaleOrderIdSpan = document.querySelector("#review-sale-order-id");
                    reviewSaleOrderIdSpan.innerHTML = saleOrder.saleOrderId;
                    const saleOrderIdInput = document.querySelector("input[name='saleOrderId']");
                    saleOrderIdInput.value = saleOrder.saleOrderId; 
                    const reviewProductSpan = document.querySelector("#review-product-id");
                    reviewProductSpan.innerHTML = saleOrder.name;
                    const productIdInput = document.querySelector("input[name='productId']");
                    productIdInput.value = saleOrder.productId;                
                });
                createReviewCell.appendChild(viewProductButton);

                row.appendChild(nameCell);
                row.appendChild(descriptionCell);
                row.appendChild(imageUrlCell);                
                row.appendChild(unitPriceCell);
                row.appendChild(quantityCell);
                row.appendChild(countryCell);
                row.appendChild(orderId);
                row.appendChild(orderDatetimeCell);
                row.appendChild(statusCell);
                row.appendChild(createReviewCell);
                tbody.appendChild(row);                
            });
        })
        .catch(function (error) {
            console.error(error);
        });
});

window.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector('form'); 
    form.onsubmit = function (e) {
        e.preventDefault();        
        
        // Get form inputs
        let saleOrderId = document.querySelector('#saleOrderId').value;
        let productId = document.querySelector('#productId').value;
        let rating = document.querySelector('#rating').value;
        let reviewText = document.querySelector('#reviewText').value;

        // Create review object
        const review = {
            saleOrderId: saleOrderId,
            productId: productId,
            rating: rating,
            reviewText: reviewText
        };

        const token = localStorage.getItem('token');

        // Send POST request to "/create" endpoint
        fetch('/reviews/create', {
            method: 'POST',
            headers: {
                authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(review)
        }).then(function (response) {
            if (response.ok) {
                alert(`Review for the product is created`);
            } else {
                // If fail, show the error message
                response.json().then(function (data) {
                    alert(data.error);
                });
            }
        })
        .catch(function (error) {
            alert(`Error creating review`);
        });  
    };
})