-- Add rich fields to menu_items for product detail page
ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS ingredients TEXT,
  ADD COLUMN IF NOT EXISTS calories INTEGER,
  ADD COLUMN IF NOT EXISTS prep_time INTEGER,  -- in minutes
  ADD COLUMN IF NOT EXISTS spice_level TEXT DEFAULT 'mild' CHECK (spice_level IN ('mild', 'medium', 'spicy')),
  ADD COLUMN IF NOT EXISTS is_bestseller BOOLEAN DEFAULT FALSE;

-- Update existing items with sample data
UPDATE menu_items SET
  ingredients = CASE name
    WHEN 'Classic Veg Burger' THEN 'Fresh patty, lettuce, tomato, onion, special sauce, sesame bun'
    WHEN 'Cheese Burger' THEN 'Grilled vegetables, cheddar cheese, lettuce, mayo, bun'
    WHEN 'Margherita Pizza' THEN 'Mozzarella cheese, tomato sauce, Italian herbs, olive oil'
    WHEN 'Farmhouse Pizza' THEN 'Capsicum, onion, tomato, sweet corn, olives, mozzarella'
    WHEN 'Chocolate Shake' THEN 'Chocolate ice cream, milk, chocolate syrup, whipped cream'
    WHEN 'Strawberry Shake' THEN 'Fresh strawberries, vanilla ice cream, milk, sugar'
    WHEN 'Oreo Shake' THEN 'Oreo cookies, vanilla ice cream, milk, chocolate syrup'
    WHEN 'White Sauce Pasta' THEN 'Penne pasta, cream, garlic, cheese, mixed veggies, herbs'
    WHEN 'Red Sauce Pasta' THEN 'Penne pasta, tomato, basil, garlic, olive oil, parmesan'
    WHEN 'Grilled Sandwich' THEN 'Bread, cheese, cucumber, tomato, onion, butter'
    WHEN 'Club Sandwich' THEN 'Toasted bread, lettuce, cheese, tomato, mayo, potato chips'
    WHEN 'Cold Coffee' THEN 'Espresso, milk, vanilla ice cream, chocolate shavings'
    WHEN 'Fresh Lime Soda' THEN 'Lemon juice, soda water, sugar, salt, mint leaves'
    WHEN 'Mango Juice' THEN 'Fresh mango pulp, sugar, water, ice cubes'
    WHEN 'French Fries' THEN 'Potatoes, salt, pepper, herbs'
    WHEN 'Veg Nuggets (6 pcs)' THEN 'Mixed vegetables, breadcrumbs, spices, cornmeal'
  END,
  calories = CASE name
    WHEN 'Classic Veg Burger' THEN 350
    WHEN 'Cheese Burger' THEN 420
    WHEN 'Margherita Pizza' THEN 600
    WHEN 'Farmhouse Pizza' THEN 540
    WHEN 'Chocolate Shake' THEN 380
    WHEN 'Strawberry Shake' THEN 290
    WHEN 'Oreo Shake' THEN 410
    WHEN 'White Sauce Pasta' THEN 480
    WHEN 'Red Sauce Pasta' THEN 390
    WHEN 'Grilled Sandwich' THEN 280
    WHEN 'Club Sandwich' THEN 350
    WHEN 'Cold Coffee' THEN 220
    WHEN 'Fresh Lime Soda' THEN 80
    WHEN 'Mango Juice' THEN 150
    WHEN 'French Fries' THEN 310
    WHEN 'Veg Nuggets (6 pcs)' THEN 280
  END,
  prep_time = CASE name
    WHEN 'Classic Veg Burger' THEN 12
    WHEN 'Cheese Burger' THEN 14
    WHEN 'Margherita Pizza' THEN 18
    WHEN 'Farmhouse Pizza' THEN 20
    WHEN 'Chocolate Shake' THEN 8
    WHEN 'Strawberry Shake' THEN 8
    WHEN 'Oreo Shake' THEN 10
    WHEN 'White Sauce Pasta' THEN 15
    WHEN 'Red Sauce Pasta' THEN 15
    WHEN 'Grilled Sandwich' THEN 10
    WHEN 'Club Sandwich' THEN 12
    WHEN 'Cold Coffee' THEN 6
    WHEN 'Fresh Lime Soda' THEN 4
    WHEN 'Mango Juice' THEN 5
    WHEN 'French Fries' THEN 8
    WHEN 'Veg Nuggets (6 pcs)' THEN 10
  END,
  spice_level = CASE name
    WHEN 'Classic Veg Burger' THEN 'mild'
    WHEN 'Cheese Burger' THEN 'mild'
    WHEN 'Margherita Pizza' THEN 'mild'
    WHEN 'Farmhouse Pizza' THEN 'medium'
    WHEN 'Red Sauce Pasta' THEN 'medium'
    ELSE 'mild'
  END,
  is_bestseller = name IN ('Classic Veg Burger', 'Margherita Pizza', 'Chocolate Shake', 'French Fries');
