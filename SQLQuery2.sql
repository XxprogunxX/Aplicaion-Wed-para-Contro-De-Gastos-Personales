-- Sakila Database Schema para SQL Server con sufijo _jhm
-- Versión completa migrada de MySQL a SQL Server
-- CORREGIDA: Sin ciclos de cascada múltiples

USE master;
GO

-- Crear la base de datos si no existe
IF EXISTS (SELECT name FROM sys.databases WHERE name = 'sakila_jhm')
BEGIN
    ALTER DATABASE sakila_jhm SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE sakila_jhm;
END
GO

CREATE DATABASE sakila_jhm;
GO

USE sakila_jhm;
GO

-- Configurar collation si es necesario
ALTER DATABASE sakila_jhm COLLATE SQL_Latin1_General_CP1_CI_AS;
GO

-- ============================================
-- PRIMERO: Crear todas las tablas SIN FOREIGN KEYS
-- ============================================

-- Tablas BASE sin dependencias
CREATE TABLE country_jhm (
  country_id SMALLINT IDENTITY(1,1) NOT NULL,
  country VARCHAR(50) NOT NULL,
  last_update DATETIME2 NOT NULL DEFAULT GETDATE(),
  CONSTRAINT PK_country_jhm PRIMARY KEY (country_id)
);
GO

CREATE TABLE language_jhm (
  language_id TINYINT IDENTITY(1,1) NOT NULL,
  name CHAR(20) NOT NULL,
  last_update DATETIME2 NOT NULL DEFAULT GETDATE(),
  CONSTRAINT PK_language_jhm PRIMARY KEY (language_id)
);
GO

-- Tabla para ratings (reemplazo de ENUM)
CREATE TABLE film_rating_jhm (
  rating_code CHAR(5) PRIMARY KEY,
  description VARCHAR(50)
);
GO

INSERT INTO film_rating_jhm (rating_code, description) VALUES 
('G', 'General Audiences'),
('PG', 'Parental Guidance'),
('PG-13', 'Parents Strongly Cautioned'),
('R', 'Restricted'),
('NC-17', 'Adults Only');
GO

-- Tablas que dependen de country_jhm
CREATE TABLE city_jhm (
  city_id SMALLINT IDENTITY(1,1) NOT NULL,
  city VARCHAR(50) NOT NULL,
  country_id SMALLINT NOT NULL,
  last_update DATETIME2 NOT NULL DEFAULT GETDATE(),
  CONSTRAINT PK_city_jhm PRIMARY KEY (city_id)
);
GO

-- Tablas que dependen de city_jhm
CREATE TABLE address_jhm (
  address_id SMALLINT IDENTITY(1,1) NOT NULL,
  address VARCHAR(50) NOT NULL,
  address2 VARCHAR(50) NULL,
  district VARCHAR(20) NOT NULL,
  city_id SMALLINT NOT NULL,
  postal_code VARCHAR(10) NULL,
  phone VARCHAR(20) NOT NULL,
  last_update DATETIME2 NOT NULL DEFAULT GETDATE(),
  CONSTRAINT PK_address_jhm PRIMARY KEY (address_id)
);
GO

-- Tablas que dependen de address_jhm (sin FKs por ahora)
CREATE TABLE staff_jhm (
  staff_id TINYINT IDENTITY(1,1) NOT NULL,
  first_name VARCHAR(45) NOT NULL,
  last_name VARCHAR(45) NOT NULL,
  address_id SMALLINT NOT NULL,
  picture VARBINARY(MAX) NULL,
  email VARCHAR(50) NULL,
  store_id TINYINT NOT NULL,
  active BIT NOT NULL DEFAULT 1,
  username VARCHAR(16) NOT NULL,
  password VARCHAR(40) NULL,
  last_update DATETIME2 NOT NULL DEFAULT GETDATE(),
  CONSTRAINT PK_staff_jhm PRIMARY KEY (staff_id)
);
GO

-- Crear store_jhm sin FKs por ahora
CREATE TABLE store_jhm (
  store_id TINYINT IDENTITY(1,1) NOT NULL,
  manager_staff_id TINYINT NOT NULL,
  address_id SMALLINT NOT NULL,
  last_update DATETIME2 NOT NULL DEFAULT GETDATE(),
  CONSTRAINT PK_store_jhm PRIMARY KEY (store_id),
  CONSTRAINT UQ_store_jhm_manager UNIQUE (manager_staff_id)
);
GO

-- Más tablas base
CREATE TABLE actor_jhm (
  actor_id SMALLINT IDENTITY(1,1) NOT NULL,
  first_name VARCHAR(45) NOT NULL,
  last_name VARCHAR(45) NOT NULL,
  last_update DATETIME2 NOT NULL DEFAULT GETDATE(),
  CONSTRAINT PK_actor_jhm PRIMARY KEY (actor_id)
);
GO

CREATE TABLE category_jhm (
  category_id TINYINT IDENTITY(1,1) NOT NULL,
  name VARCHAR(25) NOT NULL,
  last_update DATETIME2 NOT NULL DEFAULT GETDATE(),
  CONSTRAINT PK_category_jhm PRIMARY KEY (category_id)
);
GO

-- Tablas que dependen de address_jhm y store_jhm
CREATE TABLE customer_jhm (
  customer_id SMALLINT IDENTITY(1,1) NOT NULL,
  store_id TINYINT NOT NULL,
  first_name VARCHAR(45) NOT NULL,
  last_name VARCHAR(45) NOT NULL,
  email VARCHAR(50) NULL,
  address_id SMALLINT NOT NULL,
  active BIT NOT NULL DEFAULT 1,
  create_date DATETIME2 NOT NULL,
  last_update DATETIME2 NOT NULL DEFAULT GETDATE(),
  CONSTRAINT PK_customer_jhm PRIMARY KEY (customer_id)
);
GO

-- Tablas que dependen de language_jhm
CREATE TABLE film_jhm (
  film_id SMALLINT IDENTITY(1,1) NOT NULL,
  title VARCHAR(128) NOT NULL,
  description TEXT NULL,
  release_year SMALLINT NULL,
  language_id TINYINT NOT NULL,
  original_language_id TINYINT NULL,
  rental_duration TINYINT NOT NULL DEFAULT 3,
  rental_rate DECIMAL(4,2) NOT NULL DEFAULT 4.99,
  length SMALLINT NULL,
  replacement_cost DECIMAL(5,2) NOT NULL DEFAULT 19.99,
  rating CHAR(5) NULL DEFAULT 'G',
  special_features VARCHAR(100) NULL,
  last_update DATETIME2 NOT NULL DEFAULT GETDATE(),
  CONSTRAINT PK_film_jhm PRIMARY KEY (film_id),
  CONSTRAINT CHK_film_jhm_rating CHECK (rating IN ('G','PG','PG-13','R','NC-17'))
);
GO

-- Tablas que dependen de actor_jhm y film_jhm
CREATE TABLE film_actor_jhm (
  actor_id SMALLINT NOT NULL,
  film_id SMALLINT NOT NULL,
  last_update DATETIME2 NOT NULL DEFAULT GETDATE(),
  CONSTRAINT PK_film_actor_jhm PRIMARY KEY (actor_id, film_id)
);
GO

-- Tablas que dependen de film_jhm y category_jhm
CREATE TABLE film_category_jhm (
  film_id SMALLINT NOT NULL,
  category_id TINYINT NOT NULL,
  last_update DATETIME2 NOT NULL DEFAULT GETDATE(),
  CONSTRAINT PK_film_category_jhm PRIMARY KEY (film_id, category_id)
);
GO

-- Tablas que dependen de film_jhm y store_jhm
CREATE TABLE inventory_jhm (
  inventory_id INT IDENTITY(1,1) NOT NULL,
  film_id SMALLINT NOT NULL,
  store_id TINYINT NOT NULL,
  last_update DATETIME2 NOT NULL DEFAULT GETDATE(),
  CONSTRAINT PK_inventory_jhm PRIMARY KEY (inventory_id)
);
GO

-- Tablas que dependen de inventory_jhm, customer_jhm y staff_jhm
CREATE TABLE rental_jhm (
  rental_id INT IDENTITY(1,1) NOT NULL,
  rental_date DATETIME2 NOT NULL,
  inventory_id INT NOT NULL,
  customer_id SMALLINT NOT NULL,
  return_date DATETIME2 NULL,
  staff_id TINYINT NOT NULL,
  last_update DATETIME2 NOT NULL DEFAULT GETDATE(),
  CONSTRAINT PK_rental_jhm PRIMARY KEY (rental_id),
  CONSTRAINT UQ_rental_jhm UNIQUE (rental_date, inventory_id, customer_id)
);
GO

-- Tablas que dependen de customer_jhm, staff_jhm y rental_jhm
CREATE TABLE payment_jhm (
  payment_id SMALLINT IDENTITY(1,1) NOT NULL,
  customer_id SMALLINT NOT NULL,
  staff_id TINYINT NOT NULL,
  rental_id INT NULL,
  amount DECIMAL(5,2) NOT NULL,
  payment_date DATETIME2 NOT NULL,
  last_update DATETIME2 NOT NULL DEFAULT GETDATE(),
  CONSTRAINT PK_payment_jhm PRIMARY KEY (payment_id)
);
GO

-- Tabla film_text_jhm (para búsqueda full-text)
CREATE TABLE film_text_jhm (
  film_id SMALLINT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  CONSTRAINT PK_film_text_jhm PRIMARY KEY (film_id)
);
GO

-- ============================================
-- SEGUNDO: Agregar FOREIGN KEYS en orden correcto
-- ============================================

-- 1. Agregar FKs simples sin ciclos
ALTER TABLE city_jhm
ADD CONSTRAINT FK_city_jhm_country_jhm 
  FOREIGN KEY (country_id) REFERENCES country_jhm(country_id);
GO

ALTER TABLE address_jhm
ADD CONSTRAINT FK_address_jhm_city_jhm 
  FOREIGN KEY (city_id) REFERENCES city_jhm(city_id);
GO

-- 2. Primero agregar FK de staff a address (sin ciclo)
ALTER TABLE staff_jhm
ADD CONSTRAINT FK_staff_jhm_address_jhm 
  FOREIGN KEY (address_id) REFERENCES address_jhm(address_id);
GO

-- 3. Agregar FK de store a address
ALTER TABLE store_jhm
ADD CONSTRAINT FK_store_jhm_address_jhm 
  FOREIGN KEY (address_id) REFERENCES address_jhm(address_id);
GO

-- 4. Ahora podemos agregar la FK de store a staff (manager)
-- IMPORTANTE: SIN CASCADE para evitar ciclos
ALTER TABLE store_jhm
ADD CONSTRAINT FK_store_jhm_staff_jhm 
  FOREIGN KEY (manager_staff_id) REFERENCES staff_jhm(staff_id)
  ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

-- 5. Ahora agregar FK de staff a store
ALTER TABLE staff_jhm
ADD CONSTRAINT FK_staff_jhm_store_jhm 
  FOREIGN KEY (store_id) REFERENCES store_jhm(store_id);
GO

-- 6. FKs de customer
ALTER TABLE customer_jhm
ADD CONSTRAINT FK_customer_jhm_address_jhm 
  FOREIGN KEY (address_id) REFERENCES address_jhm(address_id);
GO

ALTER TABLE customer_jhm
ADD CONSTRAINT FK_customer_jhm_store_jhm 
  FOREIGN KEY (store_id) REFERENCES store_jhm(store_id);
GO

-- 7. FKs de film (sin cascade en original_language para evitar ciclo)
ALTER TABLE film_jhm
ADD CONSTRAINT FK_film_jhm_language_jhm 
  FOREIGN KEY (language_id) REFERENCES language_jhm(language_id);
GO

ALTER TABLE film_jhm
ADD CONSTRAINT FK_film_jhm_language_original 
  FOREIGN KEY (original_language_id) REFERENCES language_jhm(language_id)
  ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

ALTER TABLE film_jhm
ADD CONSTRAINT FK_film_jhm_rating 
  FOREIGN KEY (rating) REFERENCES film_rating_jhm(rating_code);
GO

-- 8. FKs de film_actor
ALTER TABLE film_actor_jhm
ADD CONSTRAINT FK_film_actor_jhm_actor_jhm 
  FOREIGN KEY (actor_id) REFERENCES actor_jhm(actor_id);
GO

ALTER TABLE film_actor_jhm
ADD CONSTRAINT FK_film_actor_jhm_film_jhm 
  FOREIGN KEY (film_id) REFERENCES film_jhm(film_id);
GO

-- 9. FKs de film_category
ALTER TABLE film_category_jhm
ADD CONSTRAINT FK_film_category_jhm_film_jhm 
  FOREIGN KEY (film_id) REFERENCES film_jhm(film_id);
GO

ALTER TABLE film_category_jhm
ADD CONSTRAINT FK_film_category_jhm_category_jhm 
  FOREIGN KEY (category_id) REFERENCES category_jhm(category_id);
GO

-- 10. FKs de inventory
ALTER TABLE inventory_jhm
ADD CONSTRAINT FK_inventory_jhm_store_jhm 
  FOREIGN KEY (store_id) REFERENCES store_jhm(store_id);
GO

ALTER TABLE inventory_jhm
ADD CONSTRAINT FK_inventory_jhm_film_jhm 
  FOREIGN KEY (film_id) REFERENCES film_jhm(film_id);
GO

-- 11. FKs de rental
ALTER TABLE rental_jhm
ADD CONSTRAINT FK_rental_jhm_staff_jhm 
  FOREIGN KEY (staff_id) REFERENCES staff_jhm(staff_id);
GO

ALTER TABLE rental_jhm
ADD CONSTRAINT FK_rental_jhm_inventory_jhm 
  FOREIGN KEY (inventory_id) REFERENCES inventory_jhm(inventory_id);
GO

ALTER TABLE rental_jhm
ADD CONSTRAINT FK_rental_jhm_customer_jhm 
  FOREIGN KEY (customer_id) REFERENCES customer_jhm(customer_id);
GO

-- 12. FKs de payment
ALTER TABLE payment_jhm
ADD CONSTRAINT FK_payment_jhm_rental_jhm 
  FOREIGN KEY (rental_id) REFERENCES rental_jhm(rental_id)
  ON DELETE SET NULL ON UPDATE NO ACTION;
GO

ALTER TABLE payment_jhm
ADD CONSTRAINT FK_payment_jhm_customer_jhm 
  FOREIGN KEY (customer_id) REFERENCES customer_jhm(customer_id);
GO

ALTER TABLE payment_jhm
ADD CONSTRAINT FK_payment_jhm_staff_jhm 
  FOREIGN KEY (staff_id) REFERENCES staff_jhm(staff_id);
GO

-- 13. FK de film_text
ALTER TABLE film_text_jhm
ADD CONSTRAINT FK_film_text_jhm_film 
  FOREIGN KEY (film_id) REFERENCES film_jhm(film_id)
  ON DELETE CASCADE ON UPDATE CASCADE;
GO

-- ============================================
-- TERCERO: Crear índices
-- ============================================

CREATE INDEX idx_fk_country_id ON city_jhm(country_id);
CREATE INDEX idx_fk_city_id ON address_jhm(city_id);
CREATE INDEX idx_fk_store_id_staff ON staff_jhm(store_id);
CREATE INDEX idx_fk_address_id_staff ON staff_jhm(address_id);
CREATE INDEX idx_fk_address_id_store ON store_jhm(address_id);
CREATE INDEX idx_actor_last_name ON actor_jhm(last_name);
CREATE INDEX idx_fk_store_id_cust ON customer_jhm(store_id);
CREATE INDEX idx_fk_address_id_cust ON customer_jhm(address_id);
CREATE INDEX idx_last_name ON customer_jhm(last_name);
CREATE INDEX idx_title ON film_jhm(title);
CREATE INDEX idx_fk_language_id ON film_jhm(language_id);
CREATE INDEX idx_fk_original_language_id ON film_jhm(original_language_id);
CREATE INDEX idx_fk_film_id_fa ON film_actor_jhm(film_id);
CREATE INDEX idx_fk_film_id_inv ON inventory_jhm(film_id);
CREATE INDEX idx_store_id_film_id ON inventory_jhm(store_id, film_id);
CREATE INDEX idx_fk_inventory_id ON rental_jhm(inventory_id);
CREATE INDEX idx_fk_customer_id_rent ON rental_jhm(customer_id);
CREATE INDEX idx_fk_staff_id_rent ON rental_jhm(staff_id);
CREATE INDEX idx_fk_staff_id_pay ON payment_jhm(staff_id);
CREATE INDEX idx_fk_customer_id_pay ON payment_jhm(customer_id);
GO

-- ============================================
-- CUARTO: Configurar Full-Text Search
-- ============================================

-- Crear catálogo e índice full-text
CREATE FULLTEXT CATALOG ft_catalog AS DEFAULT;
GO

CREATE FULLTEXT INDEX ON film_text_jhm(title, description) 
KEY INDEX PK_film_text_jhm
ON ft_catalog
WITH CHANGE_TRACKING AUTO;
GO

-- ============================================
-- QUINTO: Crear Triggers (AHORA las tablas existen)
-- ============================================

CREATE TRIGGER ins_film_jhm 
ON film_jhm
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO film_text_jhm (film_id, title, description)
    SELECT film_id, title, description
    FROM inserted;
END;
GO

CREATE TRIGGER upd_film_jhm
ON film_jhm
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF UPDATE(title) OR UPDATE(description) OR UPDATE(film_id)
    BEGIN
        UPDATE ft
        SET ft.title = i.title,
            ft.description = i.description,
            ft.film_id = i.film_id
        FROM film_text_jhm ft
        INNER JOIN inserted i ON ft.film_id = i.film_id
        INNER JOIN deleted d ON ft.film_id = d.film_id
        WHERE i.title != d.title 
           OR i.description != d.description
           OR i.film_id != d.film_id;
    END
END;
GO

CREATE TRIGGER del_film_jhm
ON film_jhm
AFTER DELETE
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM film_text_jhm 
    WHERE film_id IN (SELECT film_id FROM deleted);
END;
GO

-- ============================================
-- SEXTO: Crear Vistas
-- ============================================

CREATE VIEW customer_list_jhm
AS
SELECT 
    cu.customer_id AS ID, 
    CONCAT(cu.first_name, ' ', cu.last_name) AS name,
    a.address AS address,
    a.postal_code AS [zip code],
    a.phone AS phone,
    city.city AS city,
    country.country AS country,
    CASE WHEN cu.active = 1 THEN 'active' ELSE '' END AS notes,
    cu.store_id AS SID
FROM customer_jhm AS cu 
INNER JOIN address_jhm AS a ON cu.address_id = a.address_id 
INNER JOIN city_jhm AS city ON a.city_id = city.city_id
INNER JOIN country_jhm AS country ON city.country_id = country.country_id;
GO

CREATE VIEW film_list_jhm
AS
SELECT 
    film.film_id AS FID,
    film.title AS title,
    film.description AS description,
    category.name AS category,
    film.rental_rate AS price,
    film.length AS length,
    film.rating AS rating,
    STUFF((
        SELECT ', ' + CONCAT(actor.first_name, ' ', actor.last_name)
        FROM film_actor_jhm fa
        INNER JOIN actor_jhm actor ON fa.actor_id = actor.actor_id
        WHERE fa.film_id = film.film_id
        FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 2, '') AS actors
FROM film_jhm AS film
LEFT JOIN film_category_jhm fc ON fc.film_id = film.film_id
LEFT JOIN category_jhm AS category ON category.category_id = fc.category_id;
GO

CREATE VIEW nicer_but_slower_film_list_jhm
AS
SELECT 
    film.film_id AS FID,
    film.title AS title,
    film.description AS description,
    category.name AS category,
    film.rental_rate AS price,
    film.length AS length,
    film.rating AS rating,
    STUFF((
        SELECT ', ' + 
               CONCAT(UPPER(LEFT(actor.first_name, 1)) + LOWER(SUBSTRING(actor.first_name, 2, LEN(actor.first_name))),
               ' ',
               UPPER(LEFT(actor.last_name, 1)) + LOWER(SUBSTRING(actor.last_name, 2, LEN(actor.last_name))))
        FROM film_actor_jhm fa
        INNER JOIN actor_jhm actor ON fa.actor_id = actor.actor_id
        WHERE fa.film_id = film.film_id
        FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 2, '') AS actors
FROM film_jhm AS film
LEFT JOIN film_category_jhm fc ON fc.film_id = film.film_id
LEFT JOIN category_jhm AS category ON category.category_id = fc.category_id;
GO

CREATE VIEW staff_list_jhm
AS
SELECT 
    s.staff_id AS ID,
    CONCAT(s.first_name, ' ', s.last_name) AS name,
    a.address AS address,
    a.postal_code AS [zip code],
    a.phone AS phone,
    city.city AS city,
    country.country AS country,
    s.store_id AS SID
FROM staff_jhm AS s 
INNER JOIN address_jhm AS a ON s.address_id = a.address_id 
INNER JOIN city_jhm AS city ON a.city_id = city.city_id
INNER JOIN country_jhm AS country ON city.country_id = country.country_id;
GO

CREATE VIEW sales_by_store_jhm
AS
SELECT
    CONCAT(c.city, ',', cy.country) AS store,
    CONCAT(m.first_name, ' ', m.last_name) AS manager,
    SUM(p.amount) AS total_sales
FROM payment_jhm AS p
INNER JOIN rental_jhm AS r ON p.rental_id = r.rental_id
INNER JOIN inventory_jhm AS i ON r.inventory_id = i.inventory_id
INNER JOIN store_jhm AS s ON i.store_id = s.store_id
INNER JOIN address_jhm AS a ON s.address_id = a.address_id
INNER JOIN city_jhm AS c ON a.city_id = c.city_id
INNER JOIN country_jhm AS cy ON c.country_id = cy.country_id
INNER JOIN staff_jhm AS m ON s.manager_staff_id = m.staff_id
GROUP BY s.store_id, c.city, cy.country, m.first_name, m.last_name;
GO

CREATE VIEW sales_by_film_category_jhm
AS
SELECT
    c.name AS category,
    SUM(p.amount) AS total_sales
FROM payment_jhm AS p
INNER JOIN rental_jhm AS r ON p.rental_id = r.rental_id
INNER JOIN inventory_jhm AS i ON r.inventory_id = i.inventory_id
INNER JOIN film_jhm AS f ON i.film_id = f.film_id
INNER JOIN film_category_jhm AS fc ON f.film_id = fc.film_id
INNER JOIN category_jhm AS c ON fc.category_id = c.category_id
GROUP BY c.name;
GO

CREATE VIEW actor_info_jhm
AS
SELECT
    a.actor_id,
    a.first_name,
    a.last_name,
    STUFF((
        SELECT '; ' + c.name + ': ' + 
            STUFF((
                SELECT ', ' + f.title
                FROM film_jhm f
                INNER JOIN film_category_jhm fc ON f.film_id = fc.film_id
                INNER JOIN film_actor_jhm fa ON f.film_id = fa.film_id
                WHERE fc.category_id = c.category_id
                AND fa.actor_id = a.actor_id
                ORDER BY f.title
                FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 2, '')
        FROM category_jhm c
        INNER JOIN film_category_jhm fc ON c.category_id = fc.category_id
        INNER JOIN film_actor_jhm fa ON fc.film_id = fa.film_id
        WHERE fa.actor_id = a.actor_id
        GROUP BY c.category_id, c.name
        ORDER BY c.name
        FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 2, '') AS film_info
FROM actor_jhm a;
GO

-- ============================================
-- SÉPTIMO: Crear Procedimientos y Funciones
-- ============================================

CREATE FUNCTION get_customer_balance_jhm(
    @p_customer_id INT,
    @p_effective_date DATETIME
)
RETURNS DECIMAL(5,2)
AS
BEGIN
    DECLARE @v_rentfees DECIMAL(5,2);
    DECLARE @v_overfees DECIMAL(5,2);
    DECLARE @v_payments DECIMAL(5,2);
    
    -- Calculate rental fees
    SELECT @v_rentfees = ISNULL(SUM(film.rental_rate), 0)
    FROM film_jhm AS film
    INNER JOIN inventory_jhm ON film.film_id = inventory_jhm.film_id
    INNER JOIN rental_jhm ON inventory_jhm.inventory_id = rental_jhm.inventory_id
    WHERE rental_jhm.rental_date <= @p_effective_date
      AND rental_jhm.customer_id = @p_customer_id;
    
    -- Calculate overdue fees
    SELECT @v_overfees = ISNULL(SUM(
        CASE 
            WHEN DATEDIFF(DAY, rental.rental_date, ISNULL(rental.return_date, @p_effective_date)) > film.rental_duration
            THEN (DATEDIFF(DAY, rental.rental_date, ISNULL(rental.return_date, @p_effective_date)) - film.rental_duration)
            ELSE 0 
        END
    ), 0)
    FROM rental_jhm AS rental
    INNER JOIN inventory_jhm ON rental.inventory_id = inventory_jhm.inventory_id
    INNER JOIN film_jhm AS film ON inventory_jhm.film_id = film.film_id
    WHERE rental.rental_date <= @p_effective_date
      AND rental.customer_id = @p_customer_id;
    
    -- Calculate payments
    SELECT @v_payments = ISNULL(SUM(payment.amount), 0)
    FROM payment_jhm AS payment
    WHERE payment.payment_date <= @p_effective_date
      AND payment.customer_id = @p_customer_id;
    
    RETURN @v_rentfees + @v_overfees - @v_payments;
END;
GO

CREATE FUNCTION inventory_in_stock_jhm(@p_inventory_id INT)
RETURNS BIT
AS
BEGIN
    DECLARE @v_rentals INT;
    DECLARE @v_out INT;
    
    SELECT @v_rentals = COUNT(*)
    FROM rental_jhm
    WHERE inventory_id = @p_inventory_id;
    
    IF @v_rentals = 0
        RETURN 1;
    
    SELECT @v_out = COUNT(rental_id)
    FROM inventory_jhm 
    LEFT JOIN rental_jhm ON inventory_jhm.inventory_id = rental_jhm.inventory_id
    WHERE inventory_jhm.inventory_id = @p_inventory_id
      AND rental_jhm.return_date IS NULL;
    
    IF @v_out > 0
        RETURN 0;
    
    RETURN 1;
END;
GO

CREATE FUNCTION inventory_held_by_customer_jhm(@p_inventory_id INT)
RETURNS INT
AS
BEGIN
    DECLARE @v_customer_id INT;
    
    SELECT TOP 1 @v_customer_id = customer_id
    FROM rental_jhm
    WHERE return_date IS NULL
      AND inventory_id = @p_inventory_id;
    
    RETURN @v_customer_id;
END;
GO

CREATE PROCEDURE rewards_report_jhm
    @min_monthly_purchases TINYINT,
    @min_dollar_amount_purchased DECIMAL(10,2),
    @count_rewardees INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @last_month_start DATE;
    DECLARE @last_month_end DATE;
    
    -- Some sanity checks...
    IF @min_monthly_purchases = 0
    BEGIN
        RAISERROR('Minimum monthly purchases parameter must be > 0', 16, 1);
        RETURN;
    END
    
    IF @min_dollar_amount_purchased = 0.00
    BEGIN
        RAISERROR('Minimum monthly dollar amount purchased parameter must be > $0.00', 16, 1);
        RETURN;
    END
    
    -- Determine start and end time periods
    SET @last_month_start = DATEADD(MONTH, -1, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1));
    SET @last_month_end = EOMONTH(@last_month_start);
    
    -- Create a temporary table for Customer IDs
    CREATE TABLE #tmpCustomer (customer_id SMALLINT PRIMARY KEY);
    
    -- Find all customers meeting the monthly purchase requirements
    INSERT INTO #tmpCustomer (customer_id)
    SELECT p.customer_id
    FROM payment_jhm AS p
    WHERE CAST(p.payment_date AS DATE) BETWEEN @last_month_start AND @last_month_end
    GROUP BY p.customer_id
    HAVING SUM(p.amount) > @min_dollar_amount_purchased
       AND COUNT(*) > @min_monthly_purchases;
    
    -- Populate OUTPUT parameter with count of found customers
    SELECT @count_rewardees = COUNT(*) FROM #tmpCustomer;
    
    -- Output ALL customer information of matching rewardees
    SELECT c.*
    FROM #tmpCustomer AS t
    INNER JOIN customer_jhm AS c ON t.customer_id = c.customer_id;
END;
GO

CREATE PROCEDURE film_in_stock_jhm
    @p_film_id INT,
    @p_store_id INT,
    @p_film_count INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT inventory_id
    FROM inventory_jhm
    WHERE film_id = @p_film_id
      AND store_id = @p_store_id
      AND dbo.inventory_in_stock_jhm(inventory_id) = 1;
    
    SELECT @p_film_count = COUNT(*)
    FROM inventory_jhm
    WHERE film_id = @p_film_id
      AND store_id = @p_store_id
      AND dbo.inventory_in_stock_jhm(inventory_id) = 1;
END;
GO

CREATE PROCEDURE film_not_in_stock_jhm
    @p_film_id INT,
    @p_store_id INT,
    @p_film_count INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT inventory_id
    FROM inventory_jhm
    WHERE film_id = @p_film_id
      AND store_id = @p_store_id
      AND dbo.inventory_in_stock_jhm(inventory_id) = 0;
    
    SELECT @p_film_count = COUNT(*)
    FROM inventory_jhm
    WHERE film_id = @p_film_id
      AND store_id = @p_store_id
      AND dbo.inventory_in_stock_jhm(inventory_id) = 0;
END;
GO

-- ============================================
-- FINAL: Mensaje de confirmación
-- ============================================

PRINT '============================================';
PRINT 'Esquema Sakila para SQL Server creado exitosamente.';
PRINT 'Base de datos: sakila_jhm';
PRINT '============================================';
PRINT 'Tablas creadas: 16';
PRINT 'Vistas creadas: 7';
PRINT 'Procedimientos almacenados: 4';
PRINT 'Funciones: 3';
PRINT 'Triggers: 3';
PRINT '============================================';
PRINT 'NOTA: Las relaciones circulares staff/store se manejaron con ON DELETE NO ACTION';
PRINT '============================================';
GO