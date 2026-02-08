-- Instant Booking System Migration (PostgreSQL)
-- CRITICAL FIX: Rewritten from MySQL to PostgreSQL syntax
-- Date: 2026-02-07

-- Create ENUM types for instant booking
CREATE TYPE IF NOT EXISTS payment_method_type AS ENUM (
    'on_meeting', 
    'direct_transfer', 
    'cash', 
    'card_to_master', 
    'online'
);

CREATE TYPE IF NOT EXISTS payment_status_type AS ENUM (
    'pending', 
    'paid', 
    'cancelled', 
    'refunded'
);

CREATE TYPE IF NOT EXISTS booking_status_type AS ENUM (
    'confirmed', 
    'in_progress', 
    'completed', 
    'cancelled', 
    'no_show_client', 
    'no_show_master'
);

CREATE TYPE IF NOT EXISTS notification_type_booking AS ENUM (
    'booking_created', 
    'booking_confirmed', 
    'booking_cancelled', 
    'booking_reminder', 
    'booking_completed'
);

CREATE TYPE IF NOT EXISTS delivery_method_type AS ENUM (
    'push', 
    'sms', 
    'email'
);

CREATE TYPE IF NOT EXISTS delivery_status_type AS ENUM (
    'pending', 
    'sent', 
    'delivered', 
    'failed'
);

-- Настройки доступности мастеров
CREATE TABLE IF NOT EXISTS master_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_id UUID NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration INTEGER DEFAULT 60, -- minutes
    buffer_time INTEGER DEFAULT 15, -- minutes between slots
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_time_order CHECK (start_time < end_time),
    CONSTRAINT chk_slot_duration CHECK (slot_duration >= 15 AND slot_duration <= 480),
    CONSTRAINT chk_buffer_time CHECK (buffer_time >= 0 AND buffer_time <= 60)
);

-- Indexes for master_availability
CREATE INDEX IF NOT EXISTS idx_master_availability_master_id ON master_availability(master_id);
CREATE INDEX IF NOT EXISTS idx_master_availability_day ON master_availability(day_of_week);
CREATE INDEX IF NOT EXISTS idx_master_availability_master_day_available ON master_availability(master_id, day_of_week, is_available);

-- Исключения в расписании (праздники, отпуск, etc.)
CREATE TABLE IF NOT EXISTS availability_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_id UUID NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
    exception_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    is_available BOOLEAN DEFAULT false, -- false = недоступен, true = доступен в исключительном порядке
    reason VARCHAR(200),
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_exception_time_order CHECK (start_time IS NULL OR end_time IS NULL OR start_time < end_time)
);

-- Indexes for availability_exceptions
CREATE INDEX IF NOT EXISTS idx_availability_exceptions_master_date ON availability_exceptions(master_id, exception_date);

-- Мгновенные бронирования
CREATE TABLE IF NOT EXISTS instant_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_id UUID NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE, -- CRITICAL FIX: Changed from master_services to services
    
    -- Время бронирования
    booking_datetime TIMESTAMP NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes >= 15 AND duration_minutes <= 480),
    end_datetime TIMESTAMP GENERATED ALWAYS AS (booking_datetime + (duration_minutes || ' minutes')::INTERVAL) STORED,
    
    -- Цена и оплата
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    currency VARCHAR(3) DEFAULT 'KGS',
    payment_method payment_method_type NOT NULL DEFAULT 'on_meeting',
    payment_status payment_status_type NOT NULL DEFAULT 'pending',
    
    -- Статус бронирования
    status booking_status_type NOT NULL DEFAULT 'confirmed',
    
    -- Дополнительная информация
    client_notes TEXT,
    master_notes TEXT,
    address TEXT,
    
    -- Отмена
    cancelled_at TIMESTAMP NULL,
    cancelled_by UUID NULL REFERENCES users(id),
    cancellation_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraint: booking must be in future (with 1 hour grace period)
    CONSTRAINT chk_booking_future CHECK (booking_datetime > NOW() - INTERVAL '1 hour')
);

-- Indexes for instant_bookings
CREATE INDEX IF NOT EXISTS idx_instant_bookings_master_id ON instant_bookings(master_id);
CREATE INDEX IF NOT EXISTS idx_instant_bookings_client_id ON instant_bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_instant_bookings_service_id ON instant_bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_instant_bookings_datetime ON instant_bookings(booking_datetime);
CREATE INDEX IF NOT EXISTS idx_instant_bookings_status ON instant_bookings(status);
CREATE INDEX IF NOT EXISTS idx_instant_bookings_master_datetime ON instant_bookings(master_id, booking_datetime);
CREATE INDEX IF NOT EXISTS idx_instant_bookings_master_status_datetime ON instant_bookings(master_id, status, booking_datetime);
CREATE INDEX IF NOT EXISTS idx_instant_bookings_client_status_datetime ON instant_bookings(client_id, status, booking_datetime);

-- Доступные слоты (кэш для быстрого поиска)
CREATE TABLE IF NOT EXISTS available_slots_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_id UUID NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE, -- CRITICAL FIX: Changed from master_services to services
    slot_datetime TIMESTAMP NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes >= 15 AND duration_minutes <= 480),
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    is_available BOOLEAN DEFAULT true,
    expires_at TIMESTAMP NOT NULL -- TTL for cache
);

-- Indexes for available_slots_cache
CREATE INDEX IF NOT EXISTS idx_available_slots_master_service ON available_slots_cache(master_id, service_id);
CREATE INDEX IF NOT EXISTS idx_available_slots_datetime ON available_slots_cache(slot_datetime);
CREATE INDEX IF NOT EXISTS idx_available_slots_expires ON available_slots_cache(expires_at);

-- Уведомления о бронированиях
CREATE TABLE IF NOT EXISTS booking_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES instant_bookings(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type notification_type_booking NOT NULL,
    sent_at TIMESTAMP DEFAULT NOW(),
    delivery_method delivery_method_type NOT NULL,
    delivery_status delivery_status_type DEFAULT 'pending'
);

-- Indexes for booking_notifications
CREATE INDEX IF NOT EXISTS idx_booking_notifications_booking_id ON booking_notifications(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_notifications_recipient_id ON booking_notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_booking_notifications_type ON booking_notifications(notification_type);

-- Статистика бронирований
CREATE TABLE IF NOT EXISTS booking_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_id UUID NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_bookings INTEGER DEFAULT 0 CHECK (total_bookings >= 0),
    completed_bookings INTEGER DEFAULT 0 CHECK (completed_bookings >= 0),
    cancelled_bookings INTEGER DEFAULT 0 CHECK (cancelled_bookings >= 0),
    no_show_bookings INTEGER DEFAULT 0 CHECK (no_show_bookings >= 0),
    total_revenue DECIMAL(12,2) DEFAULT 0 CHECK (total_revenue >= 0),
    average_rating DECIMAL(3,2) CHECK (average_rating IS NULL OR (average_rating >= 1 AND average_rating <= 5)),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Unique constraint
    CONSTRAINT uk_booking_statistics_master_date UNIQUE (master_id, date)
);

-- Index for booking_statistics
CREATE INDEX IF NOT EXISTS idx_booking_statistics_master_date ON booking_statistics(master_id, date);

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_instant_booking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER trigger_master_availability_updated_at
    BEFORE UPDATE ON master_availability
    FOR EACH ROW
    EXECUTE FUNCTION update_instant_booking_updated_at();

CREATE TRIGGER trigger_instant_bookings_updated_at
    BEFORE UPDATE ON instant_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_instant_booking_updated_at();

CREATE TRIGGER trigger_booking_statistics_updated_at
    BEFORE UPDATE ON booking_statistics
    FOR EACH ROW
    EXECUTE FUNCTION update_instant_booking_updated_at();

-- Function to update booking statistics
CREATE OR REPLACE FUNCTION update_booking_statistics()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Insert or update statistics on new booking
        INSERT INTO booking_statistics (master_id, date, total_bookings, total_revenue)
        VALUES (NEW.master_id, DATE(NEW.booking_datetime), 1, NEW.price)
        ON CONFLICT (master_id, date) 
        DO UPDATE SET
            total_bookings = booking_statistics.total_bookings + 1,
            total_revenue = booking_statistics.total_revenue + NEW.price,
            updated_at = NOW();
            
    ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        -- Update completed bookings
        IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
            UPDATE booking_statistics 
            SET completed_bookings = completed_bookings + 1, updated_at = NOW()
            WHERE master_id = NEW.master_id AND date = DATE(NEW.booking_datetime);
        ELSIF OLD.status = 'completed' AND NEW.status != 'completed' THEN
            UPDATE booking_statistics 
            SET completed_bookings = completed_bookings - 1, updated_at = NOW()
            WHERE master_id = NEW.master_id AND date = DATE(NEW.booking_datetime);
        END IF;
        
        -- Update cancelled bookings
        IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
            UPDATE booking_statistics 
            SET cancelled_bookings = cancelled_bookings + 1, updated_at = NOW()
            WHERE master_id = NEW.master_id AND date = DATE(NEW.booking_datetime);
        ELSIF OLD.status = 'cancelled' AND NEW.status != 'cancelled' THEN
            UPDATE booking_statistics 
            SET cancelled_bookings = cancelled_bookings - 1, updated_at = NOW()
            WHERE master_id = NEW.master_id AND date = DATE(NEW.booking_datetime);
        END IF;
        
        -- Update no-show bookings
        IF (NEW.status = 'no_show_client' OR NEW.status = 'no_show_master') AND 
           (OLD.status != 'no_show_client' AND OLD.status != 'no_show_master') THEN
            UPDATE booking_statistics 
            SET no_show_bookings = no_show_bookings + 1, updated_at = NOW()
            WHERE master_id = NEW.master_id AND date = DATE(NEW.booking_datetime);
        ELSIF (OLD.status = 'no_show_client' OR OLD.status = 'no_show_master') AND 
              (NEW.status != 'no_show_client' AND NEW.status != 'no_show_master') THEN
            UPDATE booking_statistics 
            SET no_show_bookings = no_show_bookings - 1, updated_at = NOW()
            WHERE master_id = NEW.master_id AND date = DATE(NEW.booking_datetime);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for booking statistics
CREATE TRIGGER trigger_update_booking_statistics
    AFTER INSERT OR UPDATE ON instant_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_booking_statistics();

-- Function to clean expired slots cache
CREATE OR REPLACE FUNCTION clean_expired_slots()
RETURNS void AS $$
BEGIN
    DELETE FROM available_slots_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE master_availability IS 'Настройки доступности мастеров по дням недели';
COMMENT ON TABLE availability_exceptions IS 'Исключения в расписании мастеров (праздники, отпуск)';
COMMENT ON TABLE instant_bookings IS 'Мгновенные бронирования услуг';
COMMENT ON TABLE available_slots_cache IS 'Кэш доступных слотов для быстрого поиска';
COMMENT ON TABLE booking_notifications IS 'Уведомления о бронированиях';
COMMENT ON TABLE booking_statistics IS 'Статистика бронирований по мастерам и датам';

-- Note: PostgreSQL doesn't have MySQL's EVENT scheduler
-- Use pg_cron extension or external cron job to call clean_expired_slots() periodically
-- Example with pg_cron:
-- SELECT cron.schedule('clean-expired-slots', '*/15 * * * *', 'SELECT clean_expired_slots()');
