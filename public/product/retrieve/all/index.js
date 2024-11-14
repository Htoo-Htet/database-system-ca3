function fetchProducts (token) {
    return fetch('/products', {
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

        fetch('/favourites', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        .then(function (response) {
            return response.json();
        })
        .then(function (favoriteBody) {
            if (favoriteBody.error) throw new Error(favoriteBody.error);
            const favoriteProducts = favoriteBody.products;

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
                const checkboxCell = document.createElement("td");
                const toggleFavouriteCell = document.createElement("td");
                const addToCartCell = document.createElement("td");
                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.setAttribute('productId', product.id);
                
                nameCell.textContent = product.name
                descriptionCell.textContent = product.description;
                unitPriceCell.textContent = product.unitPrice;
                countryCell.textContent = product.country;
                productTypeCell.textContent = product.productType;
                imageUrlCell.innerHTML = `<img src="${product.imageUrl}" alt="Product Image">`;
                manufacturedOnCell.textContent = new Date(product.manufacturedOn).toLocaleString();
                checkboxCell.appendChild(checkbox);
                
                const viewProductButton = document.createElement("button");
                viewProductButton.textContent = "View Product";
                viewProductButton.addEventListener('click', function () {
                    localStorage.setItem("productId", product.id);
                    window.location.href = `/product/retrieve`;
                });
                viewProductCell.appendChild(viewProductButton);

                const toggleFavouriteButton = document.createElement("button");
                const isFavorite = favoriteProducts.some(favorite => favorite.id === product.id);
                if (isFavorite) {
                    toggleFavouriteButton.textContent = "Remove from Favourite";
                    toggleFavouriteButton.classList.add("button-remove-favourite");
                    toggleFavouriteButton.addEventListener('click', function () {
                        localStorage.setItem("productId", product.id);
                        localStorage.setItem("previousUrl", window.location.href); 
                        window.location.href = `/favourite/delete`;
                    });
                    toggleFavouriteCell.appendChild(toggleFavouriteButton);

                } else {
                    toggleFavouriteButton.textContent = "Add To Favourite";
                    toggleFavouriteButton.classList.add("button-add-favourite");
                    toggleFavouriteButton.addEventListener('click', function () {
                        localStorage.setItem("productId", product.id);
                        window.location.href = `/favourite/create`;
                    });
                    toggleFavouriteCell.appendChild(toggleFavouriteButton);
                }
                
                
                const addToCartButton = document.createElement("button");
                addToCartButton.textContent = "Add to Cart";
                addToCartButton.addEventListener('click', function () {
                    localStorage.setItem("cartProductId", product.id);
                    window.location.href = `/cart/create`;
                });
                addToCartCell.appendChild(addToCartButton);

                row.appendChild(checkboxCell);
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

            document.querySelectorAll('button').forEach(button => {
                button.addEventListener('click', function () {
                    localStorage.setItem('previousUrl', window.location.href);
                });
            });

            selectAll();
            multipleAddToCart(token, products);

        })
        .catch(function (error) {
            console.error(error);
        });
    })
    .catch(function (error) {
        console.error(error);
    });
}

function selectAll() {
    const selectAllCheckbox = document.getElementById('selectAll');
    const productCheckboxes = document.querySelectorAll('#product-tbody input[type="checkbox"]');

    selectAllCheckbox.addEventListener('change', function() {
        productCheckboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
        });
    });

    productCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const allChecked = Array.from(productCheckboxes).every(cb => cb.checked);
            selectAllCheckbox.checked = allChecked;
            selectAllCheckbox.indeterminate = !allChecked && Array.from(productCheckboxes).some(cb => cb.checked);
        });
    });
}

function multipleAddToCart(token, products) {
    const multipleAddToCartButton = document.querySelector('#multiple-add-to-cart');
    multipleAddToCartButton.addEventListener("click", function() {
        const checkedCheckBoxes = document.querySelectorAll('#product-tbody input[type="checkbox"]:checked');
        const selectedProducts = [];

        if (checkedCheckBoxes.length === 0) {
            alert("No products to add to cart.");
            return;
        }

        checkedCheckBoxes.forEach(function(currentCheckedCheckBox) {
            const productId = parseInt(currentCheckedCheckBox.getAttribute('productId'), 10);
            selectedProducts.push({productId: productId});
        });

        fetch('/carts/multiple-add-to-cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ products: selectedProducts })
        })
        .then(function(response) {
            if (response.ok) {
                response.json().then(function(data) {
                    let addedProductNames = [];
                    let notAddedProductNames = [];
                    let message = "";
                    
                    if (data.addedProducts) {
                        data.addedProducts.forEach((product) => {
                            productName = products.find(a => a.id === product).name;
                            addedProductNames.push(productName);
                        })
                    }
                    if (data.notAddedProducts) {
                        data.notAddedProducts.forEach((product) => {
                            productName = products.find(b => b.id === product).name;
                            notAddedProductNames.push(productName);
                        })
                    }

                    if (addedProductNames.length > 0) {
                        message = "\nThese products are added to the cart:\n"
                        addedProductNames.forEach(productName => {
                            message += productName + "\n";
                        })
                    }

                    if (notAddedProductNames.length > 0) {
                        message += "\nThese products are not added since they are already in the cart:\n"
                        notAddedProductNames.forEach(productName => {
                            message += productName + "\n";
                        })
                    }
                    
                    alert(message);

                    if (addedProductNames.length > 0) {
                        location.reload();
                    }
                });
            } else {
                response.json().then(function(data) {
                    alert(data.error);
                });
            }
        })
        .catch(function(error) {
            console.error(error);
            alert('Error during adding to cart.');
        });
    });
}

window.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem("token");
    fetchProducts(token)
});
