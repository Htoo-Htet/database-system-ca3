function fetchCartItems(token) {
    return fetch('/carts', {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
    .then(function (response) {
        return response.json();
    })
    .then(function (body) {
        if (body.error) throw new Error(body.error);
        const cartItems = body.cartItems;
        const tbody = document.querySelector("#cart-items-tbody");
        cartItems.forEach(function (cartItem) {
            const row = document.createElement("tr");
            
            row.classList.add("product");
            const descriptionCell = document.createElement("td");
            const countryCell = document.createElement("td");
            const quantityCell = document.createElement("td");
            const unitPriceCell = document.createElement("td");
            const subTotalCell = document.createElement("td");
            const updateButtonCell = document.createElement("td");
            const deleteButtonCell = document.createElement("td");
            const checkboxCell = document.createElement("td");
            const updateButton = document.createElement("button");
            const deleteButton = document.createElement("button");
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.setAttribute('cartItemId', cartItem.id);
            checkbox.setAttribute('productName', cartItem.product.name);
            checkbox.setAttribute('stockQuantity', cartItem.product.stockQuantity);
            
            descriptionCell.textContent = cartItem.product.description;
            countryCell.textContent = cartItem.product.country;
            unitPriceCell.textContent = cartItem.product.unitPrice;                
            updateButtonCell.appendChild(updateButton);
            deleteButtonCell.appendChild(deleteButton);
            checkboxCell.appendChild(checkbox);

            // Make quantityCell an editable input field
            const quantityInput = document.createElement("input");
            quantityInput.type = "number";
            quantityInput.value = cartItem.quantity;
            quantityInput.classList.add('quantityInput');
            quantityInput.addEventListener("input", function () {
                // Only allow numeric values
                this.value = this.value.replace(/[^0-9]/g, "");
            });
            quantityCell.appendChild(quantityInput);
            subTotalCell.textContent = cartItem.product.unitPrice * cartItem.quantity;

            updateButton.textContent = "Update";
            deleteButton.textContent = "Delete";

            // Add event listener to updateButton
            updateButton.classList.add('button-update-cart-item');
            updateButton.addEventListener("click", function () {
                const updatedQuantity = Number(quantityInput.value);

                if(!Number.isInteger(updatedQuantity) || updatedQuantity <= 0) {
                    alert('Quantity must be a positive integer.');
                    return;
                }

                const updatedCartItem = {
                    quantity: Number(updatedQuantity)
                };

                fetch(`/carts/update/${cartItem.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(updatedCartItem)
                })
                .then(function (response) {
                    if (response.ok) {
                        alert("Cart item updated.");
                        location.reload();
                        
                    } else {
                        response.json().then(function (data) {
                            alert(data.error);
                        });
                    }
                })
                .catch(function (error) {
                    console.error(error);
                    alert('Error updating cart item.')
                });
            });

            // Add event listener to updateButton
            deleteButton.classList.add('button-delete-cart-item')
            deleteButton.addEventListener("click", function () {
                
                fetch(`/carts/remove/${cartItem.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    }
                })
                .then(function (response) {
                    if (response.ok) {
                        alert("Cart item deleted.");
                        location.reload();
                        
                    } else {
                        response.json().then(function (data) {
                            alert(data.error);
                        });
                    }
                })
                .catch(function (error) {
                    console.error(error);
                    alert('Error removing from cart.');
                });
            });

            row.appendChild(checkboxCell);
            row.appendChild(descriptionCell);
            row.appendChild(countryCell);
            row.appendChild(subTotalCell);
            row.appendChild(unitPriceCell);
            row.appendChild(quantityCell);
            row.appendChild(updateButtonCell);
            row.appendChild(deleteButtonCell);

            tbody.appendChild(row);
        });
    })
    .catch(function (error) {
        console.error(error);
    });
}

function fetchCartSummary(token) {
    return fetch('/carts/summary', {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
    .then(function (response) {
        return response.json();
    })
    .then(function (body) {
        if (body.error) throw new Error(body.error);
        const cartSummary = body.cartSummary;
        const cartSummaryDiv = document.querySelector("#cart-summary");
        const cartSummaryLabel1 = document.createElement("label");
        cartSummaryLabel1.textContent = "Total Quantity: ";
        cartSummaryLabel1.classList.add("label");
        const cartSummaryValue1 = document.createElement("span");
        cartSummaryValue1.textContent = cartSummary.totalQuantity;
        cartSummaryValue1.classList.add("value");
        const cartSummaryLabel2 = document.createElement("label");
        cartSummaryLabel2.textContent = "Total Checkout Price: ";
        cartSummaryLabel2.classList.add("label");
        const cartSummaryValue2 = document.createElement("span");
        cartSummaryValue2.textContent = cartSummary.totalPrice;
        cartSummaryValue2.classList.add("value");
        const cartSummaryLabel3 = document.createElement("label");
        cartSummaryLabel3.textContent = "Total Unique Products: ";
        cartSummaryLabel3.classList.add("label");
        const cartSummaryValue3 = document.createElement("span");
        cartSummaryValue3.textContent = cartSummary.totalProduct;
        cartSummaryValue3.classList.add("value");

        cartSummaryDiv.appendChild(cartSummaryLabel1);
        cartSummaryDiv.appendChild(cartSummaryValue1);
        cartSummaryDiv.appendChild(document.createElement("br"));
        cartSummaryDiv.appendChild(cartSummaryLabel2);
        cartSummaryDiv.appendChild(cartSummaryValue2);
        cartSummaryDiv.appendChild(document.createElement("br"));
        cartSummaryDiv.appendChild(cartSummaryLabel3);
        cartSummaryDiv.appendChild(cartSummaryValue3);
    })
    .catch(function (error) {
        console.error(error);
        alert("Error getting cart summary - ", error.message);
    });
}

function bulkUpdate(token){
    bulkUpdateButton = document.querySelector('#bulk-update');
    bulkUpdateButton.addEventListener("click", function() {
        const checkedCheckBoxes = document.querySelectorAll('#cart-items-tbody input[type="checkbox"]:checked');
        selectedCartItems = [];
        let hasValidationError = false;
        
        if (checkedCheckBoxes.length === 0) {
            alert("No cart items to bulk update.");
            return;
        }
    
        for (let i = 0; i < checkedCheckBoxes.length; i++){
            const currentCheckedCheckBox = checkedCheckBoxes[i];
            const cartItemId = parseInt(currentCheckedCheckBox.getAttribute('cartItemId'), 10);
            const productName = currentCheckedCheckBox.getAttribute('productName');
            const stockQuantity = parseInt(currentCheckedCheckBox.getAttribute('stockQuantity'), 10);
            const quantityInput = currentCheckedCheckBox.closest('tr').querySelector('.quantityInput');
            const quantity = parseInt(quantityInput.value, 10);
    
            if (!Number.isInteger(quantity) || quantity <= 0) {
                alert(`Quantity for product "${productName}" must be a positive integer.`);
                hasValidationError = true;
                break;
            }
    
            selectedCartItems.push({
                cartItemId: cartItemId,
                quantity: quantity
            });
        };

        if (hasValidationError) {
            return;
        }
    
        fetch('/carts/bulk-update', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ cartItems: selectedCartItems })
        })
        .then(function(response) {
            if (response.ok) {
                alert("Bulk update successful.");
                location.reload();
            } else {
                response.json().then(function(data) {
                    alert(data.error);
                });
            }
        })
        .catch(function(error) {
            console.error(error);
            alert('Error during bulk update.');
        });
    })
}

function bulkDelete(token) {
    const bulkDeleteButton = document.querySelector('#bulk-delete');
    bulkDeleteButton.addEventListener("click", function() {
        const checkedCheckBoxes = document.querySelectorAll('#cart-items-tbody input[type="checkbox"]:checked');
        const selectedCartItems = [];

        if (checkedCheckBoxes.length === 0) {
            alert("No cart items to bulk delete.");
            return;
        }

        checkedCheckBoxes.forEach(function(currentCheckedCheckBox) {
            const cartItemId = parseInt(currentCheckedCheckBox.getAttribute('cartItemId'), 10);
            selectedCartItems.push({cartItemId: cartItemId});
        });

        fetch('/carts/bulk-delete', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ cartItems: selectedCartItems })
        })
        .then(function(response) {
            if (response.ok) {
                alert("Bulk delete successful.");
                location.reload();
            } else {
                response.json().then(function(data) {
                    alert(data.error);
                });
            }
        })
        .catch(function(error) {
            console.error(error);
            alert('Error during bulk delete.');
        });
    });
}

function selectAll() {
    const selectAllCheckbox = document.getElementById('selectAll');
    const cartItemCheckboxes = document.querySelectorAll('#cart-items-tbody input[type="checkbox"]');

    selectAllCheckbox.addEventListener('change', function() {
        cartItemCheckboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
        });
    });

    cartItemCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const allChecked = Array.from(cartItemCheckboxes).every(cb => cb.checked);
            selectAllCheckbox.checked = allChecked;
            selectAllCheckbox.indeterminate = !allChecked && Array.from(cartItemCheckboxes).some(cb => cb.checked);
        });
    });
}

function checkOut(token) {
    const checkOutButton = document.querySelector('#checkout-button');
    checkOutButton.addEventListener("click", function() {
        fetch('/carts/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            }
        })
        .then(function(response) {
            if (response.ok) {
                response.json().then(function(data) {
                    if (data.failedItems) {
                        let message = "Checkout successful!";
                        if (data.failedItems.length > 0) {
                            message += "\n\nThese items failed to process due to requested quantities higher than the stock quantities: ";
                            data.failedItems.forEach(failedItem => {
                                message += `\n${failedItem}`;
                            });
                        }
                        alert(message);
                        location.reload();
                    }
                })
            } else {
                response.json().then(function(data) {
                    alert(data.error);
                });
            }
        })
        .catch(function(error) {
            console.error(error);
            alert('Error during checkout');
        });
    });
}

window.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem("token");
    fetchCartItems(token)
    .then(function () {
        fetchCartSummary(token);
        selectAll();
        bulkUpdate(token);
        bulkDelete(token);
        checkOut(token);
    });
});