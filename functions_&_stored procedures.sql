--
-- PostgreSQL database dump
--

-- Dumped from database version 16.3
-- Dumped by pg_dump version 16.3

-- Started on 2024-08-12 04:08:44 +08

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 238 (class 1255 OID 16395)
-- Name: add_product_to_favourites(integer, integer); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.add_product_to_favourites(IN p_member_id integer, IN p_product_id integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
	-- Validate if the product exists
	IF NOT EXISTS (SELECT * FROM product WHERE id = p_product_id) THEN
		RAISE EXCEPTION 'This product does not exist';

	-- Validate if the product is already added by the member
	ELSIF EXISTS (SELECT * FROM favourite WHERE member_id = p_member_id AND product_id = p_product_id) THEN
		RAISE EXCEPTION 'This product is already in your favourites; you cannot add it again to your favourites';
	END IF;

	-- Add the product into favourites
	INSERT INTO favourite(member_id, product_id)
		VALUES(p_member_id, p_product_id);
END;
$$;


--
-- TOC entry 239 (class 1255 OID 16396)
-- Name: calculate_favourited_percentage_of_products(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_favourited_percentage_of_products() RETURNS TABLE(pd_id integer, pd_name character varying, favourited_percentage numeric, price numeric, stock numeric)
    LANGUAGE plpgsql
    AS $$
DECLARE 
	product_no RECORD;
	favourite_count NUMERIC;
	member_count NUMERIC;
	favourite_to_all_ratio NUMERIC;
BEGIN
	DROP TABLE IF EXISTS temp_product;
	CREATE TEMP TABLE temp_product AS (
		SELECT id AS "p_id", name AS "p_name",
			unit_price AS "p_price", stock_quantity AS "p_stock"
		FROM product
	);
	ALTER TABLE temp_product
		ADD COLUMN IF NOT EXISTS favourite_to_all_percentage NUMERIC(10,2) DEFAULT NULL;
	FOR product_no IN SELECT * from temp_product
	LOOP
		SELECT COUNT(*) INTO favourite_count FROM favourite WHERE product_id = product_no.p_id;
		SELECT COUNT(*) INTO member_count FROM member WHERE username != 'user' AND username!= 'admin';
		IF member_count = 0 THEN
			favourite_to_all_ratio := 0;
		ELSE 
			favourite_to_all_ratio := favourite_count / member_count;
		END IF;

		UPDATE temp_product
		SET favourite_to_all_percentage = favourite_to_all_ratio * 100
		WHERE p_id = product_no.p_id;
	END LOOP;
	
	RETURN QUERY
		SELECT 
			p_id, p_name, favourite_to_all_percentage,
			p_price, p_stock
		FROM temp_product
		ORDER BY favourite_to_all_percentage DESC, p_id;
		DROP TABLE IF EXISTS temp_product;
END;
$$;


--
-- TOC entry 240 (class 1255 OID 16397)
-- Name: compute_customer_lifetime_value(); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.compute_customer_lifetime_value()
    LANGUAGE plpgsql
    AS $$
DECLARE
    member_record RECORD;
    first_order_datetime TIMESTAMP;
    last_order_datetime TIMESTAMP;
    total_spending NUMERIC;
    total_number_of_orders INTEGER;
    customer_lifetime NUMERIC;
    average_purchase_value NUMERIC;
    purchase_frequency NUMERIC;
    retention_period INTEGER := 2;
    customer_lifetime_value NUMERIC;
BEGIN
    FOR member_record IN
        SELECT id
        FROM member
    LOOP
        -- Calculate first and last order datetimes
        SELECT MIN(order_datetime), MAX(order_datetime)
        INTO first_order_datetime, last_order_datetime
        FROM sale_order
        WHERE member_id = member_record.id AND status = 'COMPLETED';
        
        -- Calculate total spending and total number of orders
        SELECT COALESCE(SUM(p.unit_price * i.quantity), 0), COUNT(DISTINCT o.id)
        INTO total_spending, total_number_of_orders
        FROM sale_order o
        JOIN sale_order_item i ON i.sale_order_id = o.id
        JOIN product p ON i.product_id = p.id
        WHERE o.member_id = member_record.id AND o.status = 'COMPLETED';
        
        -- Calculate customer lifetime in years
        IF first_order_datetime IS NOT NULL AND last_order_datetime IS NOT NULL THEN
            SELECT EXTRACT(YEAR FROM AGE(last_order_datetime, first_order_datetime)) +
				EXTRACT(MONTH FROM AGE(last_order_datetime, first_order_datetime))/12 +
				EXTRACT(DAY FROM AGE(last_order_datetime, first_order_datetime))/365
            INTO customer_lifetime;
        ELSE
            customer_lifetime := 0;
        END IF;

        -- Calculate customer lifetime value from the results of average purchase value and purchase frequency calculations
        IF total_number_of_orders > 1 AND customer_lifetime > 0 THEN
            average_purchase_value := total_spending / total_number_of_orders;
            purchase_frequency := total_number_of_orders / customer_lifetime;
            customer_lifetime_value := average_purchase_value * purchase_frequency * retention_period;
        ELSE
            customer_lifetime_value := NULL;
        END IF;

        -- Update the member's CLV
        UPDATE member
        SET clv = customer_lifetime_value
        WHERE id = member_record.id;
    END LOOP;
END;
$$;


--
-- TOC entry 241 (class 1255 OID 16398)
-- Name: compute_running_total_spending(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.compute_running_total_spending() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
	-- Update the running total spending for active members
	UPDATE member
	SET running_total_spending = (
		SELECT COALESCE(SUM(p.unit_price * i.quantity), 0)
		FROM sale_order o
		JOIN sale_order_item i
		ON i.sale_order_id = o.id
		JOIN product p
		ON i.product_id = p.id
		WHERE o.member_id = member.id AND
			o.status = 'COMPLETED'
	)
	WHERE last_login >= (CURRENT_DATE - INTERVAL '6 months'); 

	-- Update the running total spending to null for non-active members
	UPDATE member
	SET running_total_spending = NULL
	WHERE last_login < (CURRENT_DATE - INTERVAL '6 months');

END;
$$;


--
-- TOC entry 253 (class 1255 OID 16399)
-- Name: create_review(integer, integer, integer, integer, text); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.create_review(IN p_member_id integer, IN p_sale_order_id integer, IN p_product_id integer, IN p_rating integer, IN p_review_text text)
    LANGUAGE plpgsql
    AS $$
DECLARE
	soi_id INTEGER;
BEGIN
	-- Validate if sale order id, product id or rating is inputed
	IF (p_sale_order_id IS NULL OR p_product_id IS NULL OR p_rating IS NULL OR p_review_text IS NULL) THEN
		IF (p_sale_order IS NULL) THEN
			RAISE EXCEPTION 'Enter the sale order id in correct format';
		ELSIF (p_product_id IS NULL) THEN
			RAISE EXCEPTION 'Enter the product id in correct format';
		ELSIF (p_rating IS NULL) THEN
			RAISE EXCEPTION 'Enter the rating (1 to 5)';
		ELSIF (p_review_text IS NULL) THEN
			RAISE EXCEPTION 'Enter the review text';
		ELSE
			RAISE EXCEPTION 'Enter all the required information in the correct format';
		END IF;

	-- Validate if rating is between 1 and 5
	ELSIF p_rating NOT BETWEEN 1 AND 5 THEN
		RAISE EXCEPTION 'The rating must be between 1 and 5';

	-- Validate if the sale order exists
	ELSIF NOT EXISTS (SELECT * FROM sale_order WHERE id = p_sale_order_id) THEN
		RAISE EXCEPTION 'This sale order does not exist';

	-- Validate if the sale order is the member's
	ELSIF NOT EXISTS (SELECT * FROM sale_order WHERE id = p_sale_order_id AND member_id = p_member_id) THEN
		RAISE EXCEPTION 'This sale order does not belong to you';

	-- Validate if the product exists
	ELSIF NOT EXISTS (SELECT * FROM product WHERE id = p_product_id) THEN
		RAISE EXCEPTION 'This product does not exist';
	
	-- Validate if the member has ordered the product before and has completed the order
	ELSIF NOT EXISTS (
		SELECT *
		FROM sale_order_item i
		JOIN sale_order o
		ON i.sale_order_id = o.id
		WHERE o.member_id = p_member_id AND
			i.product_id = p_product_id AND
			o.id = p_sale_order_id AND
			o.status = 'COMPLETED'
	) THEN
		RAISE EXCEPTION 'You have no completed order of this product; You must have at least 1 order completion of it to write a review for it';
		
	-- Validate if the member has made a review for the product before
	ELSIF EXISTS (
		SELECT * FROM review r
		JOIN sale_order_item i ON r.sale_order_item_id = i.id
		JOIN sale_order o ON i.sale_order_id = o.id
		WHERE o.member_id = p_member_id AND
			i.product_id = p_product_id AND
			i.sale_order_id = p_sale_order_id AND
			o.status = 'COMPLETED'
	) THEN
		RAISE EXCEPTION 'You have already made a review for this product; You can only make one review per one product for each completed sale order';

	ELSE
		-- Retrieve sale order item id using sale order id and product id
		SELECT i.id
		INTO soi_id
		FROM sale_order_item i
		JOIN sale_order o ON i.sale_order_id = o.id
		WHERE i.sale_order_id = p_sale_order_id AND i.product_id = p_product_id AND o.member_id = p_member_id;

		-- Insert review data into review table
		INSERT INTO review (sale_order_item_id, rating, review_text)
		VALUES (soi_id, p_rating, p_review_text);
	
	END IF;

END;
$$;


--
-- TOC entry 254 (class 1255 OID 16400)
-- Name: delete_review(integer, integer); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.delete_review(IN p_member_id integer, IN p_review_id integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
	-- Validate if the review exists
	IF NOT EXISTS (SELECT * FROM review WHERE id = p_review_id) THEN
		RAISE EXCEPTION 'The review does not exist';

	-- Validate if the review belongs to the member
	ELSIF NOT EXISTS (
		SELECT * 
		FROM review r 
		JOIN sale_order_item i ON r.sale_order_item_id = i.id
		JOIN sale_order o ON i.sale_order_id = o.id
		WHERE o.member_id = p_member_id AND r.id = p_review_id
	) THEN
		RAISE EXCEPTION 'The review does not belong to you';

	-- Delete the review
	ELSE
		DELETE FROM review
		WHERE id = p_review_id;
		
	END IF;

END;
$$;


--
-- TOC entry 255 (class 1255 OID 16401)
-- Name: get_age_group_spending(character, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_age_group_spending(p_gender character DEFAULT NULL::bpchar, p_min_total_spending text DEFAULT NULL::text, p_min_member_total_spending text DEFAULT NULL::text) RETURNS TABLE(age_group text, total_spending numeric, num_of_members bigint)
    LANGUAGE plpgsql
    AS $$
DECLARE
    min_total_spending NUMERIC;
    min_member_total_spending NUMERIC;
BEGIN
	-- Convert empty strings to NULL
    IF p_gender = '' THEN
        p_gender := NULL;
    END IF;

    IF p_min_total_spending = '' THEN
        p_min_total_spending := NULL;
	ELSE
		min_total_spending := p_min_total_spending::NUMERIC;
    END IF;

    IF p_min_member_total_spending = '' THEN
        p_min_member_total_spending := NULL;
	ELSE
        min_member_total_spending := p_min_member_total_spending::NUMERIC;
    END IF;

    RETURN QUERY
	-- (3) subqueries created to return the main query
	-- 1. member_spending retrieves each member's data with their total spending
    WITH member_spending AS (
        SELECT 
            m.id,
            m.dob,
            m.gender,
            COALESCE(SUM(p.unit_price * i.quantity), 0) AS member_total_spending
        FROM member m
        JOIN sale_order o ON m.id = o.member_id
        JOIN sale_order_item i ON o.id = i.sale_order_id
        JOIN product p ON i.product_id = p.id
        GROUP BY m.id
		ORDER BY m.id
    ),
	-- 2. filtered_members filters the member_spending table by gender and their total spending that equals or succeeds the minimum
    filtered_members AS (
        SELECT *
        FROM member_spending
        WHERE (p_gender IS NULL OR gender = p_gender)
          AND (p_min_member_total_spending IS NULL OR member_total_spending >= min_member_total_spending)
    ),
	-- 3. age_grouped categorizes the filtered_members table by age groups and add average spending for each age group
    age_grouped AS (
        SELECT 
            CASE
                WHEN EXTRACT(YEAR FROM AGE(filtered_members.dob)) BETWEEN 18 AND 29 THEN '18-29'
                WHEN EXTRACT(YEAR FROM AGE(filtered_members.dob)) BETWEEN 30 AND 39 THEN '30-39'
                WHEN EXTRACT(YEAR FROM AGE(filtered_members.dob)) BETWEEN 40 AND 49 THEN '40-49'
                WHEN EXTRACT(YEAR FROM AGE(filtered_members.dob)) BETWEEN 50 AND 59 THEN '50-59'
                ELSE '60+'
            END AS grouped_ages,
            SUM(member_total_spending) AS all_total_spending,
            COUNT(*) AS total_no_of_members,
			AVG(member_total_spending) AS average_spending
        FROM filtered_members
        GROUP BY grouped_ages
    )
	
	-- Retrieve the age groups that succeed the minimum average spending
    SELECT grouped_ages "age_group", all_total_spending "total_spending", total_no_of_members "num_of_members"
    FROM age_grouped
	WHERE p_min_total_spending IS NULL OR average_spending >= min_total_spending
	ORDER BY age_group;
END;
$$;


--
-- TOC entry 219 (class 1259 OID 16402)
-- Name: product; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product (
    id integer NOT NULL,
    name character varying(255),
    description text,
    unit_price numeric NOT NULL,
    stock_quantity numeric DEFAULT 0 NOT NULL,
    country character varying(100),
    product_type character varying(50),
    image_url character varying(255) DEFAULT '/images/product.png'::character varying,
    manufactured_on timestamp without time zone
);


--
-- TOC entry 256 (class 1255 OID 16409)
-- Name: get_all_favourites(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_all_favourites(p_member_id integer) RETURNS SETOF public.product
    LANGUAGE plpgsql
    AS $$
BEGIN
	-- Retrieve all favourites by id
	RETURN QUERY
		SELECT p.*
		FROM favourite f
		JOIN product p ON f.product_id = p.id
		WHERE f.member_id = p_member_id;
END;
$$;


--
-- TOC entry 257 (class 1255 OID 16410)
-- Name: get_all_reviews(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_all_reviews(p_member_id integer) RETURNS TABLE(review_id integer, name character varying, sale_order_id integer, rating integer, review_text text, review_date date)
    LANGUAGE plpgsql
    AS $$
BEGIN
	RETURN QUERY
		-- Retrieve all reviews of the member
		SELECT r.id AS "review_id", 
			p.name, i.sale_order_id AS "sale_order_id", r.rating,
			r.review_text, r.review_date
		FROM review r
		JOIN sale_order_item i ON r.sale_order_item_id = i.id
		JOIN sale_order o ON i.sale_order_id = o.id
		JOIN product p ON i.product_id = p.id
		WHERE o.member_id = 1
		ORDER BY r.id;
END;
$$;


--
-- TOC entry 258 (class 1255 OID 16411)
-- Name: get_all_reviews_by_product_id(integer, character, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_all_reviews_by_product_id(p_product_id integer, p_rating character, p_order text) RETURNS TABLE(review_id integer, username character varying, sale_order_id integer, rating integer, review_text text, review_date date)
    LANGUAGE plpgsql
    AS $$
BEGIN
	-- Create a temporary table to store common data
	CREATE TEMP TABLE reviews_of_product AS (
		SELECT r.id AS "r_id", m.username AS "name", i.sale_order_id AS "so_id", 
			r.rating AS "r_rating", r.review_text AS "r_text", r.review_date AS "r_date"
		FROM review r
	    JOIN sale_order_item i ON r.sale_order_item_id = i.id
  	    JOIN sale_order o ON o.id = i.sale_order_id
		JOIN member m ON m.id = o.member_id
		WHERE i.product_id = p_product_id
	);

	-- Filter the data by using the filters in the parameters
	IF p_rating = '' THEN
        IF p_order = 'reviewDate' THEN
            RETURN QUERY
                SELECT *
                FROM reviews_of_product
                ORDER BY review_date DESC;
        ELSIF p_order = 'rating' THEN
            RETURN QUERY
                SELECT *
                FROM reviews_of_product
                ORDER BY rating DESC, review_date DESC;
        END IF;
    ELSE
        IF p_order = 'reviewDate' THEN
            RETURN QUERY
                SELECT *
                FROM reviews_of_product
                WHERE r_rating = p_rating::INTEGER
                ORDER BY review_date DESC;
        ELSIF p_order = 'rating' THEN
            RETURN QUERY
                SELECT *
                FROM reviews_of_product
                WHERE r_rating = p_rating::INTEGER
                ORDER BY rating DESC, review_date DESC;
        END IF;
    END IF;
	DROP TABLE IF EXISTS reviews_of_product;
END;
$$;


--
-- TOC entry 259 (class 1255 OID 16412)
-- Name: get_favourite_by_id(integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_favourite_by_id(p_member_id integer, p_product_id integer) RETURNS SETOF public.product
    LANGUAGE plpgsql
    AS $$
BEGIN
	-- Validate if the product is added by the member before
	IF NOT EXISTS (SELECT * FROM favourite WHERE member_id = p_member_id AND product_id = p_product_id) THEN
		RAISE EXCEPTION 'This product is not in your favourites; add it to your favourites first';
	END IF;

	-- Retrieve favourite by id
	RETURN QUERY
		SELECT p.*
		FROM favourite f
		JOIN product p ON f.product_id = p.id
		WHERE f.member_id = p_member_id AND f.product_id = p_product_id;
END;
$$;


--
-- TOC entry 260 (class 1255 OID 16413)
-- Name: get_review(integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_review(p_member_id integer, p_review_id integer) RETURNS TABLE(review_id integer, name character varying, sale_order_id integer, rating integer, review_text text, review_date date)
    LANGUAGE plpgsql
    AS $$
BEGIN
	RETURN QUERY
		-- Retrieve single review of the member
		SELECT r.id AS "review_id", 
			p.name, i.sale_order_id AS "sale_order_id", r.rating, 
			r.review_text, r.review_date
		FROM review r
		JOIN sale_order_item i ON r.sale_order_item_id = i.id
		JOIN sale_order o ON i.sale_order_id = o.id
		JOIN product p ON i.product_id = p.id
		WHERE o.member_id = p_member_id AND r.id = p_review_id;
END;
$$;


--
-- TOC entry 263 (class 1255 OID 20497)
-- Name: place_orders(integer); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.place_orders(IN current_member_id integer, OUT failed_items text[])
    LANGUAGE plpgsql
    AS $$
DECLARE
    item RECORD;
    sale_order_id INT;
	total_items INT  := 0;
	processed_items INT := 0;
BEGIN
    failed_items := '{}';

	INSERT INTO sale_order(member_id, order_datetime, status)
	VALUES (current_member_id, CURRENT_TIMESTAMP, 'PACKING')
	RETURNING id INTO sale_order_id;

	FOR item IN
		SELECT * FROM cart_item WHERE member_id = current_member_id
	LOOP
		total_items := total_items + 1;
		
		IF (SELECT stock_quantity FROM product WHERE id = item.product_id) >= item.quantity THEN
			UPDATE product
			SET stock_quantity = stock_quantity - item.quantity
			WHERE id = item.product_id;

			INSERT INTO sale_order_item (sale_order_id, product_id, quantity)
			VALUES (sale_order_id, item.product_id, item.quantity);

			DELETE FROM cart_item
			WHERE id = item.id;

			processed_items := processed_items + 1;

		ELSE
			failed_items := array_append(failed_items, (SELECT name FROM product WHERE id = item.product_id));
		END IF;
	
	END LOOP;

	IF processed_items = 0 THEN
		ROLLBACK;
		RAISE EXCEPTION 'All items failed to process. Rolling back the entire transaction.';
	ELSE
		IF array_length(failed_items, 1) = 0 THEN
			RAISE NOTICE 'Check out successfully';
		END IF;
	END IF;
	COMMIT;
END;
$$;


--
-- TOC entry 261 (class 1255 OID 16414)
-- Name: remove_product_from_favourites(integer, integer); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.remove_product_from_favourites(IN p_member_id integer, IN p_product_id integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
	-- Validate if the product exists
	IF NOT EXISTS (SELECT * FROM product WHERE id = p_product_id) THEN
		RAISE EXCEPTION 'This product does not exist';

	-- Validate if the product is added by the member before
	ELSIF NOT EXISTS (SELECT * FROM favourite WHERE member_id = p_member_id AND product_id = p_product_id) THEN
		RAISE EXCEPTION 'This product is not in your favourites; add it to your favourites first';
	END IF;

	-- Add the product into favourites
	DELETE FROM favourite
	WHERE member_id = p_member_id AND product_id = p_product_id;
END;
$$;


--
-- TOC entry 262 (class 1255 OID 16415)
-- Name: update_review(integer, integer, integer, text); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.update_review(IN p_member_id integer, IN p_review_id integer, IN p_rating integer, IN p_review_text text)
    LANGUAGE plpgsql
    AS $$
BEGIN
	-- Validate if rating is between 1 and 5
	IF p_rating NOT BETWEEN 1 AND 5 THEN
		RAISE EXCEPTION 'The rating must be between 1 and 5';

	-- Validate if the review text is not null
    ELSIF p_review_text IS NULL THEN
        RAISE EXCEPTION 'The review text cannot be empty';

	-- Validate if the review exists
	ELSIF NOT EXISTS (SELECT * FROM review r WHERE id = p_review_id) THEN
		RAISE EXCEPTION 'The review does not exist';

	-- Validate if the review belongs to the member
	ELSIF NOT EXISTS (
		SELECT * 
		FROM review r 
		JOIN sale_order_item i ON r.sale_order_item_id = i.id
		JOIN sale_order o ON i.sale_order_id = o.id
		WHERE o.member_id = p_member_id AND r.id = p_review_id
	) THEN
		RAISE EXCEPTION 'The review does not belong to you';

	-- Update the review
	ELSE
		UPDATE review
		SET rating = p_rating,
			review_text = p_review_text,
			review_date = CURRENT_DATE
		WHERE id = p_review_id;
		
	END IF;

END;
$$;


--
-- TOC entry 235 (class 1259 OID 20013)
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- TOC entry 237 (class 1259 OID 20451)
-- Name: cart_item; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cart_item (
    id integer NOT NULL,
    member_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity integer NOT NULL,
    created_on timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    last_updated_on timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 236 (class 1259 OID 20450)
-- Name: cart_item_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cart_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3708 (class 0 OID 0)
-- Dependencies: 236
-- Name: cart_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cart_item_id_seq OWNED BY public.cart_item.id;


--
-- TOC entry 220 (class 1259 OID 16416)
-- Name: favourite; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.favourite (
    id integer NOT NULL,
    member_id integer NOT NULL,
    product_id integer NOT NULL,
    added_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 221 (class 1259 OID 16420)
-- Name: favourite_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.favourite_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3709 (class 0 OID 0)
-- Dependencies: 221
-- Name: favourite_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.favourite_id_seq OWNED BY public.favourite.id;


--
-- TOC entry 222 (class 1259 OID 16421)
-- Name: member; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.member (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(50) NOT NULL,
    dob date NOT NULL,
    password character varying(255) NOT NULL,
    role integer NOT NULL,
    gender character(1) NOT NULL,
    last_login_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    clv numeric(10,3),
    running_total_spending numeric(10,3)
);


--
-- TOC entry 223 (class 1259 OID 16425)
-- Name: member_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.member_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3710 (class 0 OID 0)
-- Dependencies: 223
-- Name: member_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.member_id_seq OWNED BY public.member.id;


--
-- TOC entry 224 (class 1259 OID 16426)
-- Name: member_role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.member_role (
    id integer NOT NULL,
    name character varying(25)
);


--
-- TOC entry 225 (class 1259 OID 16429)
-- Name: member_role_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.member_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3711 (class 0 OID 0)
-- Dependencies: 225
-- Name: member_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.member_role_id_seq OWNED BY public.member_role.id;


--
-- TOC entry 226 (class 1259 OID 16430)
-- Name: product_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3712 (class 0 OID 0)
-- Dependencies: 226
-- Name: product_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.product_id_seq OWNED BY public.product.id;


--
-- TOC entry 227 (class 1259 OID 16431)
-- Name: review; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review (
    id integer NOT NULL,
    sale_order_item_id integer NOT NULL,
    rating integer NOT NULL,
    review_text text NOT NULL,
    review_date date DEFAULT CURRENT_DATE NOT NULL
);


--
-- TOC entry 228 (class 1259 OID 16437)
-- Name: review_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.review_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3713 (class 0 OID 0)
-- Dependencies: 228
-- Name: review_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.review_id_seq OWNED BY public.review.id;


--
-- TOC entry 229 (class 1259 OID 16438)
-- Name: sale_order; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sale_order (
    id integer NOT NULL,
    member_id integer,
    order_datetime timestamp without time zone NOT NULL,
    status character varying(10)
);


--
-- TOC entry 230 (class 1259 OID 16441)
-- Name: sale_order_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sale_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3714 (class 0 OID 0)
-- Dependencies: 230
-- Name: sale_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sale_order_id_seq OWNED BY public.sale_order.id;


--
-- TOC entry 231 (class 1259 OID 16442)
-- Name: sale_order_item; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sale_order_item (
    id integer NOT NULL,
    sale_order_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity numeric NOT NULL
);


--
-- TOC entry 232 (class 1259 OID 16447)
-- Name: sale_order_item_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sale_order_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3715 (class 0 OID 0)
-- Dependencies: 232
-- Name: sale_order_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sale_order_item_id_seq OWNED BY public.sale_order_item.id;


--
-- TOC entry 234 (class 1259 OID 20001)
-- Name: supplier; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supplier (
    id integer NOT NULL,
    company_name character varying(255) NOT NULL,
    descriptor text,
    address character varying(255),
    country character varying(100) NOT NULL,
    contact_email character varying(50) NOT NULL,
    company_url character varying(255),
    founded_date date,
    staff_size integer,
    specialization character varying(100),
    is_active boolean
);


--
-- TOC entry 233 (class 1259 OID 20000)
-- Name: supplier_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.supplier_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3716 (class 0 OID 0)
-- Dependencies: 233
-- Name: supplier_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.supplier_id_seq OWNED BY public.supplier.id;


--
-- TOC entry 3521 (class 2604 OID 20454)
-- Name: cart_item id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_item ALTER COLUMN id SET DEFAULT nextval('public.cart_item_id_seq'::regclass);


--
-- TOC entry 3509 (class 2604 OID 16448)
-- Name: favourite id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favourite ALTER COLUMN id SET DEFAULT nextval('public.favourite_id_seq'::regclass);


--
-- TOC entry 3511 (class 2604 OID 16449)
-- Name: member id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member ALTER COLUMN id SET DEFAULT nextval('public.member_id_seq'::regclass);


--
-- TOC entry 3513 (class 2604 OID 16450)
-- Name: member_role id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_role ALTER COLUMN id SET DEFAULT nextval('public.member_role_id_seq'::regclass);


--
-- TOC entry 3506 (class 2604 OID 16451)
-- Name: product id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product ALTER COLUMN id SET DEFAULT nextval('public.product_id_seq'::regclass);


--
-- TOC entry 3514 (class 2604 OID 16452)
-- Name: review id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review ALTER COLUMN id SET DEFAULT nextval('public.review_id_seq'::regclass);


--
-- TOC entry 3516 (class 2604 OID 16453)
-- Name: sale_order id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order ALTER COLUMN id SET DEFAULT nextval('public.sale_order_id_seq'::regclass);


--
-- TOC entry 3517 (class 2604 OID 16454)
-- Name: sale_order_item id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order_item ALTER COLUMN id SET DEFAULT nextval('public.sale_order_item_id_seq'::regclass);


--
-- TOC entry 3518 (class 2604 OID 20004)
-- Name: supplier id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier ALTER COLUMN id SET DEFAULT nextval('public.supplier_id_seq'::regclass);


--
-- TOC entry 3548 (class 2606 OID 20021)
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 3550 (class 2606 OID 20458)
-- Name: cart_item cart_item_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_item
    ADD CONSTRAINT cart_item_pkey PRIMARY KEY (id);


--
-- TOC entry 3527 (class 2606 OID 16456)
-- Name: favourite favourite_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favourite
    ADD CONSTRAINT favourite_pkey PRIMARY KEY (id);


--
-- TOC entry 3529 (class 2606 OID 16458)
-- Name: member member_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member
    ADD CONSTRAINT member_email_key UNIQUE (email);


--
-- TOC entry 3531 (class 2606 OID 16460)
-- Name: member member_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member
    ADD CONSTRAINT member_pkey PRIMARY KEY (id);


--
-- TOC entry 3535 (class 2606 OID 16462)
-- Name: member_role member_role_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_role
    ADD CONSTRAINT member_role_pkey PRIMARY KEY (id);


--
-- TOC entry 3533 (class 2606 OID 16464)
-- Name: member member_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member
    ADD CONSTRAINT member_username_key UNIQUE (username);


--
-- TOC entry 3525 (class 2606 OID 16466)
-- Name: product product_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_pkey PRIMARY KEY (id);


--
-- TOC entry 3537 (class 2606 OID 16468)
-- Name: review review_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review
    ADD CONSTRAINT review_pkey PRIMARY KEY (id);


--
-- TOC entry 3541 (class 2606 OID 16470)
-- Name: sale_order_item sale_order_item_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order_item
    ADD CONSTRAINT sale_order_item_pkey PRIMARY KEY (id);


--
-- TOC entry 3539 (class 2606 OID 16472)
-- Name: sale_order sale_order_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order
    ADD CONSTRAINT sale_order_pkey PRIMARY KEY (id);


--
-- TOC entry 3544 (class 2606 OID 20008)
-- Name: supplier supplier_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier
    ADD CONSTRAINT supplier_pkey PRIMARY KEY (id);


--
-- TOC entry 3542 (class 1259 OID 20508)
-- Name: supplier_country_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX supplier_country_active_idx ON public.supplier USING btree (country, is_active);


--
-- TOC entry 3545 (class 1259 OID 20518)
-- Name: supplier_spec_size_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX supplier_spec_size_idx ON public.supplier USING btree (specialization, staff_size);


--
-- TOC entry 3546 (class 1259 OID 20516)
-- Name: supplier_year_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX supplier_year_date_idx ON public.supplier USING btree (EXTRACT(year FROM founded_date));


--
-- TOC entry 3558 (class 2606 OID 20459)
-- Name: cart_item fk_cart_item_member; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_item
    ADD CONSTRAINT fk_cart_item_member FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3559 (class 2606 OID 20464)
-- Name: cart_item fk_cart_item_product; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_item
    ADD CONSTRAINT fk_cart_item_product FOREIGN KEY (product_id) REFERENCES public.product(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3551 (class 2606 OID 16473)
-- Name: favourite fk_favourite_member; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favourite
    ADD CONSTRAINT fk_favourite_member FOREIGN KEY (member_id) REFERENCES public.member(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3552 (class 2606 OID 16478)
-- Name: favourite fk_favourite_product; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favourite
    ADD CONSTRAINT fk_favourite_product FOREIGN KEY (product_id) REFERENCES public.product(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3553 (class 2606 OID 16483)
-- Name: member fk_member_role_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member
    ADD CONSTRAINT fk_member_role_id FOREIGN KEY (role) REFERENCES public.member_role(id);


--
-- TOC entry 3554 (class 2606 OID 16488)
-- Name: review fk_review_soi; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review
    ADD CONSTRAINT fk_review_soi FOREIGN KEY (sale_order_item_id) REFERENCES public.sale_order_item(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3556 (class 2606 OID 16493)
-- Name: sale_order_item fk_sale_order_item_product; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order_item
    ADD CONSTRAINT fk_sale_order_item_product FOREIGN KEY (product_id) REFERENCES public.product(id);


--
-- TOC entry 3557 (class 2606 OID 16498)
-- Name: sale_order_item fk_sale_order_item_sale_order; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order_item
    ADD CONSTRAINT fk_sale_order_item_sale_order FOREIGN KEY (sale_order_id) REFERENCES public.sale_order(id);


--
-- TOC entry 3555 (class 2606 OID 16503)
-- Name: sale_order fk_sale_order_member; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order
    ADD CONSTRAINT fk_sale_order_member FOREIGN KEY (member_id) REFERENCES public.member(id);


-- Completed on 2024-08-12 04:08:44 +08

--
-- PostgreSQL database dump complete
--

