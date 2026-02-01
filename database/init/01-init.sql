-- HandShakeMe Database Initialization Script
-- Local Development Environment

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('CLIENT', 'MASTER', 'ADMIN');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION');
CREATE TYPE order_status AS ENUM ('DRAFT', 'PUBLISHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE application_status AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');
CREATE TYPE project_status AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED', 'DISPUTED');
CREATE TYPE payment_status AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
CREATE TYPE notification_type AS ENUM ('ORDER', 'APPLICATION', 'PROJECT', 'PAYMENT', 'SYSTEM');
CREATE TYPE service_unit AS ENUM ('HOUR', 'PROJECT', 'SQUARE_METER', 'ITEM', 'DAY');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    role user_role NOT NULL DEFAULT 'CLIENT',
    status user_status NOT NULL DEFAULT 'ACTIVE',
    avatar_url TEXT,
    language_code VARCHAR(10) DEFAULT 'ru',
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_active_at TIMESTAMP DEFAULT NOW()
);

-- Master profiles
CREATE TABLE master_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255),
    description TEXT,
    experience_years INTEGER DEFAULT 0,
    hourly_rate_from DECIMAL(10,2),
    hourly_rate_to DECIMAL(10,2),
    location JSONB,
    skills TEXT[],
    portfolio_urls TEXT[],
    verification_status VARCHAR(50) DEFAULT 'UNVERIFIED',
    rating DECIMAL(3,2) DEFAULT 0.00,
    reviews_count INTEGER DEFAULT 0,
    completed_orders INTEGER DEFAULT 0,
    response_time_hours INTEGER DEFAULT 24,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Client profiles
CREATE TABLE client_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255),
    description TEXT,
    location JSONB,
    orders_count INTEGER DEFAULT 0,
    total_spent DECIMAL(12,2) DEFAULT 0.00,
    rating DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon_url TEXT,
    parent_id UUID REFERENCES categories(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Services
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    master_id UUID NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price_from DECIMAL(10,2) NOT NULL,
    price_to DECIMAL(10,2),
    unit service_unit NOT NULL DEFAULT 'HOUR',
    duration_hours DECIMAL(4,2),
    images TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    budget_from DECIMAL(10,2),
    budget_to DECIMAL(10,2),
    location JSONB,
    deadline TIMESTAMP,
    status order_status NOT NULL DEFAULT 'DRAFT',
    images TEXT[],
    files TEXT[],
    requirements JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    published_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- Applications
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    master_id UUID NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    proposed_price DECIMAL(10,2) NOT NULL,
    estimated_duration_hours INTEGER,
    status application_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    responded_at TIMESTAMP
);

-- Projects
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    master_id UUID NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    agreed_price DECIMAL(10,2) NOT NULL,
    status project_status NOT NULL DEFAULT 'ACTIVE',
    started_at TIMESTAMP DEFAULT NOW(),
    deadline TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Reviews
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Chat rooms
CREATE TABLE chat_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    participants UUID[] NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Chat messages
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT,
    message_type VARCHAR(50) DEFAULT 'text',
    file_url TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_master_profiles_user_id ON master_profiles(user_id);
CREATE INDEX idx_master_profiles_rating ON master_profiles(rating DESC);
CREATE INDEX idx_client_profiles_user_id ON client_profiles(user_id);
CREATE INDEX idx_orders_client_id ON orders(client_id);
CREATE INDEX idx_orders_category_id ON orders(category_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_applications_order_id ON applications(order_id);
CREATE INDEX idx_applications_master_id ON applications(master_id);
CREATE INDEX idx_projects_master_id ON projects(master_id);
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_chat_messages_room_id ON chat_messages(room_id);

-- Insert sample categories
INSERT INTO categories (id, name, description, sort_order) VALUES
(uuid_generate_v4(), 'Ремонт и строительство', 'Все виды ремонтных и строительных работ', 1),
(uuid_generate_v4(), 'IT и программирование', 'Разработка сайтов, приложений, настройка ПК', 2),
(uuid_generate_v4(), 'Дизайн', 'Графический дизайн, веб-дизайн, интерьер', 3),
(uuid_generate_v4(), 'Красота и здоровье', 'Парикмахерские услуги, массаж, косметология', 4),
(uuid_generate_v4(), 'Транспорт', 'Грузоперевозки, такси, курьерские услуги', 5),
(uuid_generate_v4(), 'Уборка', 'Клининг, уборка квартир и офисов', 6),
(uuid_generate_v4(), 'Обучение', 'Репетиторство, курсы, тренинги', 7),
(uuid_generate_v4(), 'Фото и видео', 'Фотосъемка, видеосъемка, монтаж', 8);

-- Create admin user
INSERT INTO users (id, telegram_id, username, first_name, role, status) VALUES
(uuid_generate_v4(), 123456789, 'admin', 'Admin', 'ADMIN', 'ACTIVE');

COMMIT;