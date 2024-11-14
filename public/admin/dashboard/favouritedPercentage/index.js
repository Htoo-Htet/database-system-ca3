window.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem("token");

    fetch(`/dashboard/favouritedPercentage`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
        .then(function (response) {
            return response.json();
        })
        .then(function (body) {
            if (body.error) throw new Error(body.error);
            const products = body.products;
            const tbody = document.querySelector("#product-tbody");
            tbody.innerHTML = '';
            products.forEach(function (product) {
                const row = document.createElement("tr");

                const productIdCell = document.createElement("td");
                const productNameCell = document.createElement("td");
                const favouritedPercentageCell = document.createElement("td");
                const unitPriceCell = document.createElement("td");
                const stockQuantityCell = document.createElement("td");
                productIdCell.textContent = product.pdId;
                productNameCell.textContent = product.pdName;
                favouritedPercentageCell.textContent = product.favouritedPercentage;
                unitPriceCell.textContent = product.price;
                stockQuantityCell.textContent = product.stock;

                row.appendChild(productIdCell);
                row.appendChild(productNameCell);
                row.appendChild(favouritedPercentageCell);
                row.appendChild(unitPriceCell);
                row.appendChild(stockQuantityCell);

                tbody.appendChild(row);
            });
        })
        .catch(function (error) {
            console.error(error);
        });

    // fetchAgeGroupSpending();

    // const form = document.querySelector("form");
    // const button = document.querySelector("button");

    // function fetchAgeGroupSpending(queryParams = "") {

        
    // }

    // function handleFormSubmission(event) {
    //     event.preventDefault();

    //     const gender = form.elements.gender.value;
    //     const minTotalSpending = form.elements.minTotalSpending.value;
    //     const minMemberTotalSpending = form.elements.minMemberTotalSpending.value;
    //     const queryParams = new URLSearchParams({
    //         gender,
    //         minTotalSpending,
    //         minMemberTotalSpending
    //     }).toString();

    //     fetchAgeGroupSpending(queryParams);
    // }

    // button.addEventListener("click", handleFormSubmission);


});