-- Create the users table
CREATE TABLE users (
    id UUID PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    profile_pic TEXT,
    role VARCHAR(10) CHECK (role IN ('user', 'admin')) NOT NULL
);

-- Create the categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

-- Insert the possible categories
INSERT INTO categories (name) VALUES
('Cat'),
('Inspiration'),
('General');

-- Create the statuses table
CREATE TABLE statuses (
    id SERIAL PRIMARY KEY,
    status VARCHAR(10) UNIQUE NOT NULL
);

-- Insert the possible statuses
INSERT INTO statuses (status) VALUES
('draft'),
('publish');

-- Create the posts table
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    image TEXT NOT NULL,
    category_id INT REFERENCES categories(id) ON DELETE SET NULL, -- Linked to categories table
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date TIMESTAMP DEFAULT CURRENT_DATE,
    content TEXT NOT NULL,
    status_id INT REFERENCES statuses(id) ON DELETE SET NULL, -- Reference to statuses table
    likes_count INT DEFAULT 0
);

-- Create the comments table
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    post_id INT REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- User who made the comment, changed to UUID
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create the likes table
CREATE TABLE likes (
    id SERIAL PRIMARY KEY,
    post_id INT REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- User who liked the post, changed to UUID
    liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (post_id, user_id) -- Prevents duplicate likes
);

INSERT INTO posts (image, category_id, title, description, date, content, status_id, likes_count) VALUES
('https://res.cloudinary.com/dcbpjtd1r/image/upload/v1728449771/my-blog-post/e739huvlalbfz9eynysc.jpg', 1, 'The Art of Mindfulness: Finding Peace in a Busy World', 'Discover the transformative power of mindfulness and how it can help you navigate the challenges of modern life with greater ease and contentment.', '2024-09-11 00:00:00', '## 1. Understanding Mindfulness

Mindfulness is the practice of being fully present and engaged in the moment, aware of your thoughts and feelings without distraction or judgment.

## 2. Benefits of Mindfulness

Regular mindfulness practice can reduce stress, improve focus, enhance emotional regulation, and boost overall well-being.

## 3. Simple Mindfulness Techniques

Learn easy-to-implement mindfulness exercises, from deep breathing to body scans, that you can incorporate into your daily routine.

## 4. Mindfulness in Daily Life

Discover how to bring mindfulness into everyday activities, from eating to working, to create a more balanced and fulfilling life.

## 5. Overcoming Challenges

Address common obstacles to mindfulness practice and learn strategies to maintain consistency in your mindfulness journey.', 2, 0),

('https://res.cloudinary.com/dcbpjtd1r/image/upload/v1728449771/my-blog-post/gsutzgam24abrvgee9r4.jpg', 2, 'The Secret Language of Cats: Decoding Feline Communication', 'Unravel the mysteries of cat communication and learn how to better understand your feline friend''s needs and desires.', '2024-08-21 00:00:00', '## 1. Vocal Communications

Explore the various meows, purrs, and other vocalizations cats use to express themselves.

## 2. Body Language

Learn to read your cat''s posture, tail position, and ear movements to understand their mood and intentions.

## 3. Scent Marking

Discover why cats use scent to communicate and mark their territory.

## 4. Facial Expressions

Understand the subtle facial cues cats use to convey emotions and intentions.

## 5. Interspecies Communication

Learn how cats have adapted their communication methods to interact with humans and other animals.', 1, 0),

('https://res.cloudinary.com/dcbpjtd1r/image/upload/v1728449771/my-blog-post/zzye4nxfm3pmh81z7hni.jpg', 3, 'Embracing Change: How to Thrive in Times of Transition', 'Learn powerful strategies to navigate life''s changes with grace and emerge stronger on the other side.', '2024-03-23 00:00:00', '## 1. Understanding Change

Explore the nature of change and why it''s an essential part of personal growth and development.

## 2. Overcoming Fear of Change

Learn techniques to confront and overcome the anxiety often associated with major life transitions.

## 3. Adapting to New Situations

Discover strategies for quickly adapting to new environments, roles, or circumstances.

## 4. Finding Opportunities in Change

Learn how to identify and capitalize on the opportunities that often arise during periods of transition.

## 5. Building Resilience

Develop the mental and emotional resilience needed to thrive in an ever-changing world.', 2, 0),

('https://res.cloudinary.com/dcbpjtd1r/image/upload/v1728449771/my-blog-post/e0haxst38li4g8i0vpsr.jpg', 1, 'The Future of Work: Adapting to a Digital-First Economy', 'Explore how technology is reshaping the workplace and learn skills to succeed in the evolving job market.', '2024-05-23 00:00:00', '## 1. The Digital Transformation

Understand how digital technologies are revolutionizing industries and job roles.

## 2. Remote Work Revolution

Explore the benefits and challenges of remote work and how to thrive in a distributed team.

## 3. Essential Digital Skills

Discover the key digital competencies that will be crucial for career success in the coming years.

## 4. AI and Automation

Learn how artificial intelligence and automation are changing job landscapes and how to adapt.

## 5. Continuous Learning

Understand the importance of lifelong learning and how to stay relevant in a rapidly evolving job market.', 1, 0),

('https://res.cloudinary.com/dcbpjtd1r/image/upload/v1728449771/my-blog-post/g8qpepvgnz6gioylyhrz.jpg', 3, 'The Power of Habits: Small Changes, Big Results', 'Discover how small, consistent habits can lead to significant personal and professional growth over time.', '2024-06-23 00:00:00', '## 1. Understanding Habit Formation

Learn the science behind habit formation and why habits are so powerful in shaping our lives.

## 2. Identifying Key Habits

Discover how to identify the habits that will have the most significant impact on your goals.

## 3. Building Positive Habits

Explore strategies for successfully implementing and maintaining positive habits.

## 4. Breaking Bad Habits

Learn effective techniques for identifying and breaking detrimental habits.

## 5. Habit Stacking

Understand how to use habit stacking to make new habits easier to adopt and maintain.', 2, 0),

('https://res.cloudinary.com/dcbpjtd1r/image/upload/v1728449771/my-blog-post/koydfh6jpmzhtxvwein3.jpg', 2, 'Cat Nutrition: A Guide to Feeding Your Feline Friend', 'Learn about the nutritional needs of cats and how to provide a balanced diet for optimal health and longevity.', '2024-07-21 00:00:00', '## 1. Understanding Feline Nutritional Needs

Explore the unique dietary requirements of cats as obligate carnivores.

## 2. Choosing the Right Cat Food

Learn how to read cat food labels and select high-quality options for your pet.

## 3. Wet vs. Dry Food

Understand the pros and cons of wet and dry cat food and how to incorporate both into your cat''s diet.

## 4. Portion Control and Feeding Schedule

Discover how to determine the right portion sizes and establish a healthy feeding routine.

## 5. Special Dietary Considerations

Learn about nutrition for cats with specific health conditions or at different life stages.', 1, 0);