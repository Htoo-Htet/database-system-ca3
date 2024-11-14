# DBS CA2 of HTOO HTET

## Overview of the project

The "Database System" assignment 2 is a partial functional school assignment project which involves proper back-end structures with working PostgresSQl functions and procedures.

## Setup of the app

1. Clone this repository
2. Create a .env file with the following content
    ```
    DB_USER=
    DB_PASSWORD=
    DB_HOST=
    DB_DATABASE=ecommerce
    DB_CONNECTION_LIMIT=1
    PORT=3000

    JWT_SECRET_KEY=your-secret-key
    JWT_EXPIRES_IN=1d
    JWT_ALGORITHM=HS256
    ```
3. Update the .env content with your database credentials accordingly.
4. Install dependencies by running `npm install`
6. Make sure your node is at the latest version (If you have Node Version Manager or NVM installed, run `nvm install node` first before you run `npm intsall`.) and the postgresql pgadmin 4 is running (If you have not installed it, refer to the next section for installation and restoration of the data file.)
5. Start the app by running `npm start`. Alternatively to use hot reload, start the app by running `npm run dev`.
6. You should see `App listening on port 3000`

## Installation of postgreSQL and initializing data in the server.

1. Search postgresql pgadmin 4 in a web browser and download the latest-versioned package.
2. Install the package and set up every step as given defaults during the installation.
3. Set the password easy and rememberable so that it can be easily accessed by the user
4. After installation, open pgadmin 4 and "restore" the file ending in db.sql in any schema with options such as owner and privileges under "do not save" section to be 'ON'.

## Instructions to run the web

Open the page, `http://localhost:3000`, replace the port number accordingly if you app is not listening to port 3000

## Application structure

* All these front-end implementations are in the `/public` folder.
`/login` Enter username and password to access the application

There are 2 parts in this application that serve different functions: admin and member.

Admins have the access to these features:
1. `/admin/dashboard` Dashboard Managements
    1. `/admin/dashboard/ageGroupSpending`
    - Displays of various member age groups with their total spendings and the number of members in that specific age group
    - Filters such as gender, minimum total spending and minimum total spending of the members are included

    2. `/admin/dashboard/customerLifetimeValue`
    - Calculates the customer lifetime values of each member

    3. `/admin/dashboard/favouritedPercentage`
    - Calculates the percentages of how many people adding each product to their favourites compared with the number of members
    - Displays other information of the products with their favourited percentage, unit price and stock quantity to make own's personal analysis on various products

2. `/admin/saleOrder` Sale Orders
    1/ `/admin/saleOrder/retrieve/all`
    - Displays the sale orders ordered by all the members
    - Filters to search various results of the sale orders

3. `/admin/supplier` Supplier (!! This feature is not fully implemented !!)


Members have the access to these features:
1. `/product` Product
    1. `/product/retrieve/all` Show All Products
    - Displays all the products available with their information such as unit price, originated country and product type
    
    2. `/product/retrieve `
    - Views a product to see various reviews made by all the members
    - Adds the desired product to favourites to check later or removes the unwanted product from the favourites
    
    3. `/favourite/create` to add to favourite using the product id which is automatically retrieved from the product list

    4. `/favourite/delete` to remove from favourites which does the same retrieval function
    
    5. `/carts/create` to add an item to the cart by entering a number which will be reflected in the cart

2. `/review` Reviews
    1. `/review/create` Create reviews
    - Displays the previously ordered products by the member
    - Creates a review by giving ratings from 1 to 5 and a review text, when the 'create review' button on the products is tapped, the desired product's id and order id appears on the inputs respectively

    2. `/review/retrieve/all` Retrieve All Reviews
    - Retrieves all the reviews made by the logged in member
    - Allows to update and delete own's existing reviews
    `/review/update` to update review
    `/review/delete` to delete review
    - Updating review is the same process as creating a review but instead of asking for a sale order id or product id, review id is now required

3. `/favourite` Favourite
    - Displays all the favourited product added by the member
    - Allows the member to remove it from the favourites list

4. `/carts` Cart
    1. `/carts/retrieve/all` Show all cart items
    - Display all cart items in the cart section reflecting to whatever products added from the products page
    - Update cart items either singularly or multiply by adjusting their quantities
    - Delete single cart item or multiple ones by selecting the checkboxes of the desired ones
    - Checkout button which will processes the cart items by doing required validations and compairing with stock quantities


* Back-end structure
1. Controllers `/controllers` contain the controllers which act as application logics
    1. cartsControllers `/controllers/cartControllers` 
    2. favouriteControllers `/controllers/favouritesController.js`
    3. membersControllers `controllers/membersController.js`
    4. productsControllers `controllers/productsController.js`
    5. reviewsControllers `controllers/reviewsController.js`
    6. saleOrdersControllers `controllers/saleOrdersController.js`

2. Middlewares `/middleware` contain the middlewares that act as a passing function that handles verification of the users
    1. bcryptMiddleware `/middleware/bcryptMiddleware.js`
    2. jwtMiddleware `/middleware/jwtMiddleware.js`

3. Models `/models` contain the models which retrieves and manipulates the data from the database
    1. carts `/models/carts`
    2. favourites `/models/favourites`
    3. members `/models/members`
    4. products `/models/products`
    5. reviews `/models/reviews`
    6. saleOrders `/models/saleOrders`

4. Routes `/routes` contain the routes which defines the URLs in the app and map them to various functions
    1. auth `/routes/auth.js`
    2. carts `/routes/carts.js`
    3. dashBoard `/routes/dashBoard.js`
    4. favourites `/routes/favourites.js`
    5. members `/routes/members.js`
    6. products `/routes/products.js`
    7. reviews `/routes/reviews.js`
    8. saleOrders `/routes/saleOrders.js`

5. app.js which is the main file for the application

6. database.js which connects the PostgresSQL to the back-end

7. error.js which links the error codes from the PostgresSQL to the back-end to properly display the errors to the front-end

8. server.js which initiates to run the whole app

9. prisma folder which is the ORM or object relational model of our project which acts as a third party to connect the database and the backend increasing the work flow and efficiency of the project

10. ERD.png which is the structure of the entities' relationships in our project

11. functions_&_stored procedures.sql which is our backup sql file of the project which can be used to create entities in the server