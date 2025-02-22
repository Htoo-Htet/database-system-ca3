window.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem("token");

    fetch('/favourites', {
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

            products.forEach(function (product) {
                const row = document.createElement("tr");
                row.classList.add("product");
                const nameCell = document.createElement("td");
                const descriptionCell = document.createElement("td");
                const unitPriceCell = document.createElement("td");
                const countryCell = document.createElement("td");
                const productTypeCell = document.createElement("td");
                const imageUrlCell = document.createElement("td");
                const manufacturedOnCell = document.createElement("td");
                const viewProductCell = document.createElement("td");
                const toggleFavouriteCell = document.createElement("td");
                const addToCartCell = document.createElement("td");
                
                nameCell.textContent = product.name
                descriptionCell.textContent = product.description;
                unitPriceCell.textContent = product.unitPrice;
                countryCell.textContent = product.country;
                productTypeCell.textContent = product.productType;
                imageUrlCell.innerHTML = `<img src="${product.imageUrl}" alt="Product Image">`;
                manufacturedOnCell.textContent = new Date(product.manufacturedOn).toLocaleString();
                
                const viewProductButton = document.createElement("button");
                viewProductButton.textContent = "View Product";
                viewProductButton.addEventListener('click', function () {
                    localStorage.setItem("productId", product.id);
                    window.location.href = `/product/retrieve`;
                });
                viewProductCell.appendChild(viewProductButton);

                const toggleFavouriteButton = document.createElement("button");
                toggleFavouriteButton.textContent = "Remove from Favourite";
                    toggleFavouriteButton.classList.add("button-remove-favourite");
                    toggleFavouriteButton.addEventListener('click', function () {
                        localStorage.setItem("productId", product.id);
                        localStorage.setItem('previousUrl', window.location.href);
                        window.location.href = `/favourite/delete`;
                    });
                    toggleFavouriteCell.appendChild(toggleFavouriteButton);
                     
                const addToCartButton = document.createElement("button");
                addToCartButton.textContent = "Add to Cart";
                addToCartButton.addEventListener('click', function () {
                    localStorage.setItem("cartProductId", product.id);
                    window.location.href = `/cart/create`;
                });
                addToCartCell.appendChild(addToCartButton);
                row.appendChild(nameCell);
                row.appendChild(descriptionCell);
                row.appendChild(unitPriceCell);
                row.appendChild(countryCell);
                row.appendChild(productTypeCell);
                row.appendChild(imageUrlCell);
                row.appendChild(manufacturedOnCell);
                row.appendChild(viewProductCell);
                row.appendChild(toggleFavouriteCell);
                row.appendChild(addToCartCell);
                tbody.appendChild(row);
            });

        })
        .catch(function (error) {
            console.error(error);
        });
});
