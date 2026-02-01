-- Instant Booking System Migration
-- Создание таблиц для системы мгновенного бронирования

-- Настройки доступности мастеров
CREATE TABLE IF NOT EXISTS master_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_id UUID NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration INTEGER DEFAULT 60, -- minutes
    buffer_time INTEGER DEFAULT 15, -- minutes between slots
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_master_availability_master_id (master_id),
    INDEX idx_master_availability_day (day_of_week),
    
    -- Constraints
    CONSTRAINT fk_master_availability_master FOREIGN KEY (master_id) REFERENCES master_profiles(id) ON DELETE CASCADE,
    CONSTRAINT chk_time_order CHECK (start_time < end_time),
    CONSTRAINT chk_slot_duration CHECK (slot_duration >= 15 AND slot_duration <= 480),
    CONSTRAINT chk_buffer_time CHECK (buffer_time >= 0 AND buffer_time <= 60)
);

-- Исключения в расписании (праздники, отпуск, etc.)
CREATE TABLE IF NOT EXISTS availability_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_id UUID NOT NULL,
    exception_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    is_available BOOLEAN DEFAULT false, -- false = недоступен, true = доступен в исключительном порядке
    reason VARCHAR(200),
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_availability_exceptions_master_date (master_id, exception_date),
    
    -- Constraints
    CONSTRAINT fk_availability_exceptions_master FOREIGN KEY (master_id) REFERENCES master_profiles(id) ON DELETE CASCADE,
    CONSTRAINT chk_exception_time_order CHECK (start_time IS NULL OR end_time IS NULL OR start_time < end_time)
);

-- Мгновенные бронирования
CREATE TABLE IF NOT EXISTS instant_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_id UUID NOT NULL,
    client_id UUID NOT NULL,
    service_id UUID NOT NULL,
    
    -- Время бронирования
    booking_datetime TIMESTAMP NOT NULL,
    duration_minutes INTEGER NOT NULL,
    end_datetime TIMESTAMP GENERATED ALWAYS AS (booking_datetime + INTERVAL duration_minutes MINUTE) STORED,
    
    -- Цена и оплата
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'KGS',
    payment_method ENUM('on_meeting', 'direct_transfer', 'cash', 'card_to_master', 'online') NOT NULL DEFAULT 'on_meeting',
    payment_status ENUM('pending', 'paid', 'cancelled', 'refunded') NOT NULL DEFAULT 'pending',
    
    -- Статус бронирования
    status ENUM('confirmed', 'in_progress', 'completed', 'cancelled', 'no_show_client', 'no_show_master') NOT NULL DEFAULT 'confirmed',
    
    -- Дополнительная информация
    client_notes TEXT,
    master_notes TEXT,
    address TEXT,
    
    -- Отмена
    cancelled_at TIMESTAMP NULL,
    cancelled_by UUID NULL,
    cancellation_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_instant_bookings_master_id (master_id),
    INDEX idx_instant_bookings_client_id (client_id),
    INDEX idx_instant_bookings_service_id (service_id),
    INDEX idx_instant_bookings_datetime (booking_datetime),
    INDEX idx_instant_bookings_status (status),
    INDEX idx_instant_bookings_master_datetime (master_id, booking_datetime),
    
    -- Constraints
    CONSTRAINT fk_instant_bookings_master FOREIGN KEY (master_id) REFERENCES master_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_instant_bookings_client FOREIGN KEY (client_id) REFERENCES client_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_instant_bookings_service FOREIGN KEY (service_id) REFERENCES master_services(id) ON DELETE CASCADE,
    CONSTRAINT fk_instant_bookings_cancelled_by FOREIGN KEY (cancelled_by) REFERENCES users(id),
    CONSTRAINT chk_duration CHECK (duration_minutes >= 15 AND duration_minutes <= 480),
    CONSTRAINT chk_price CHECK (price >= 0),
    CONSTRAINT chk_booking_future CHECK (booking_datetime > NOW() - INTERVAL 1 HOUR) -- Allow 1 hour grace period
);

-- Доступные слоты (кэш для быстрого поиска)
CREATE TABLE IF NOT EXISTS available_slots_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_id UUID NOT NULL,
    service_id UUID NOT NULL,
    slot_datetime TIMESTAMP NOT NULL,
    duration_minutes INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    is_available BOOLEAN DEFAULT true,
    expires_at TIMESTAMP NOT NULL, -- TTL for cache
    
    -- Indexes
    INDEX idx_available_slots_master_service (master_id, service_id),
    INDEX idx_available_slots_datetime (slot_datetime),
    INDEX idx_available_slots_expires (expires_at),
    
    -- Constraints
    CONSTRAINT fk_available_slots_master FOREIGN KEY (master_id) REFERENCES master_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_available_slots_service FOREIGN KEY (service_id) REFERENCES master_services(id) ON DELETE CASCADE,
    CONSTRAINT chk_slot_duration CHECK (duration_minutes >= 15 AND duration_minutes <= 480),
    CONSTRAINT chk_slot_price CHECK (price >= 0)
);

-- Уведомления о бронированиях
CREATE TABLE IF NOT EXISTS booking_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL,
    recipient_id UUID NOT NULL,
    notification_type ENUM('booking_created', 'booking_confirmed', 'booking_cancelled', 'booking_reminder', 'booking_completed') NOT NULL,
    sent_at TIMESTAMP DEFAULT NOW(),
    delivery_method ENUM('push', 'sms', 'email') NOT NULL,
    delivery_status ENUM('pending', 'sent', 'delivered', 'failed') DEFAULT 'pending',
    
    -- Indexes
    INDEX idx_booking_notifications_booking_id (booking_id),
    INDEX idx_booking_notifications_recipient_id (recipient_id),
    INDEX idx_booking_notifications_type (notification_type),
    
    -- Constraints
    CONSTRAINT fk_booking_notifications_booking FOREIGN KEY (booking_id) REFERENCES instant_bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_booking_notifications_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Статистика бронирований
CREATE TABLE IF NOT EXISTS booking_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_id UUID NOT NULL,
    date DATE NOT NULL,
    total_bookings INTEGER DEFAULT 0,
    completed_bookings INTEGER DEFAULT 0,
    cancelled_bookings INTEGER DEFAULT 0,
    no_show_bookings INTEGER DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    average_rating DECIMAL(3,2),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_booking_statistics_master_date (master_id, date),
    UNIQUE KEY uk_booking_statistics_master_date (master_id, date),
    
    -- Constraints
    CONSTRAINT fk_booking_statistics_master FOREIGN KEY (master_id) REFERENCES master_profiles(id) ON DELETE CASCADE,
    CONSTRAINT chk_bookings_positive CHECK (total_bookings >= 0 AND completed_bookings >= 0 AND cancelled_bookings >= 0),
    CONSTRAINT chk_revenue_positive CHECK (total_revenue >= 0),
    CONSTRAINT chk_rating_range CHECK (average_rating IS NULL OR (average_rating >= 1 AND average_rating <= 5))
);

-- Triggers для автоматического обновления статистики
DELIMITER //

CREATE TRIGGER update_booking_statistics_after_insert
AFTER INSERT ON instant_bookings
FOR EACH ROW
BEGIN
    INSERT INTO booking_statistics (master_id, date, total_bookings, total_revenue)
    VALUES (NEW.master_id, DATE(NEW.booking_datetime), 1, NEW.price)
    ON DUPLICATE KEY UPDATE
        total_bookings = total_bookings + 1,
        total_revenue = total_revenue + NEW.price,
        updated_at = NOW();
END//

CREATE TRIGGER update_booking_statistics_after_update
AFTER UPDATE ON instant_bookings
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        -- Update completed bookings
        IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
            UPDATE booking_statistics 
            SET completed_bookings = completed_bookings + 1, updated_at = NOW()
            WHERE master_id = NEW.master_id AND date = DATE(NEW.booking_datetime);
        ELSEIF OLD.status = 'completed' AND NEW.status != 'completed' THEN
            UPDATE booking_statistics 
            SET completed_bookings = completed_bookings - 1, updated_at = NOW()
            WHERE master_id = NEW.master_id AND date = DATE(NEW.booking_datetime);
        END IF;
        
        -- Update cancelled bookings
        IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
            UPDATE booking_statistics 
            SET cancelled_bookings = cancelled_bookings + 1, updated_at = NOW()
            WHERE master_id = NEW.master_id AND date = DATE(NEW.booking_datetime);
        ELSEIF OLD.status = 'cancelled' AND NEW.status != 'cancelled' THEN
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
        ELSEIF (OLD.status = 'no_show_client' OR OLD.status = 'no_show_master') AND 
               (NEW.status != 'no_show_client' AND NEW.status != 'no_show_master') THEN
            UPDATE booking_statistics 
            SET no_show_bookings = no_show_bookings - 1, updated_at = NOW()
            WHERE master_id = NEW.master_id AND date = DATE(NEW.booking_datetime);
        END IF;
    END IF;
END//

DELIMITER ;

-- Процедура для очистки устаревшего кэша слотов
DELIMITER //

CREATE PROCEDURE CleanExpiredSlots()
BEGIN
    DELETE FROM available_slots_cache WHERE expires_at < NOW();
END//

DELIMITER ;

-- Event для автоматической очистки кэша каждые 15 минут
CREATE EVENT IF NOT EXISTS clean_expired_slots_event
ON SCHEDULE EVERY 15 MINUTE
DO
    CALL CleanExpiredSlots();

-- Включить event scheduler
SET GLOBAL event_scheduler = ON;

-- Индексы для оптимизации производительности
CREATE INDEX idx_instant_bookings_master_status_datetime ON instant_bookings(master_id, status, booking_datetime);
CREATE INDEX idx_instant_bookings_client_status_datetime ON instant_bookings(client_id, status, booking_datetime);
CREATE INDEX idx_master_availability_master_day_available ON master_availability(master_id, day_of_week, is_available);

-- Комментарии к таблицам
ALTER TABLE master_availability COMMENT = 'Настройки доступности мастеров по дням недели';
ALTER TABLE availability_exceptions COMMENT = 'Исключения в расписании мастеров (праздники, отпуск)';
ALTER TABLE instant_bookings COMMENT = 'Мгновенные бронирования услуг';
ALTER TABLE available_slots_cache COMMENT = 'Кэш доступных слотов для быстрого поиска';
ALTER TABLE booking_notifications COMMENT = 'Уведомления о бронированиях';
ALTER TABLE booking_statistics COMMENT = 'Статистика бронирований по мастерам и датам';