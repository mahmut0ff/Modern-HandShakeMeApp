/**
 * Сервис для работы с региональными особенностями Кыргызстана
 */

import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

// Региональные настройки
export interface RegionalSettings {
  region: 'bishkek' | 'osh' | 'jalal_abad' | 'karakol' | 'naryn' | 'talas' | 'batken' | 'other';
  language: 'ru' | 'ky';
  currency: 'KGS';
  timezone: 'Asia/Bishkek';
  paymentPreferences: string[];
  serviceCategories: string[];
  workingHours: {
    start: string;
    end: string;
    weekends: boolean;
  };
  culturalSettings: {
    respectForElders: boolean;
    familyOriented: boolean;
    hospitalityImportant: boolean;
    timeFlexibility: boolean;
  };
}

// Настройки по регионам
const REGIONAL_CONFIGS: Record<string, Partial<RegionalSettings>> = {
  bishkek: {
    region: 'bishkek',
    language: 'ru', // Русский преобладает в столице
    paymentPreferences: ['card', 'bank_transfer', 'o_money', 'cash'],
    serviceCategories: [
      'it_services', 'beauty_services', 'education', 'repair',
      'cleaning', 'delivery', 'design', 'consulting'
    ],
    workingHours: { start: '08:00', end: '22:00', weekends: true },
    culturalSettings: {
      respectForElders: true,
      familyOriented: true,
      hospitalityImportant: true,
      timeFlexibility: false // В столице более строгое отношение ко времени
    }
  },

  osh: {
    region: 'osh',
    language: 'ky', // Кыргызский важнее на юге
    paymentPreferences: ['cash', 'bank_transfer', 'mega_pay', 'card'],
    serviceCategories: [
      'construction', 'agriculture', 'transport', 'trade',
      'repair', 'cleaning', 'education', 'healthcare'
    ],
    workingHours: { start: '07:00', end: '21:00', weekends: true },
    culturalSettings: {
      respectForElders: true,
      familyOriented: true,
      hospitalityImportant: true,
      timeFlexibility: true // Более гибкое отношение ко времени
    }
  },

  jalal_abad: {
    region: 'jalal_abad',
    language: 'ky',
    paymentPreferences: ['cash', 'bank_transfer', 'card'],
    serviceCategories: [
      'agriculture', 'construction', 'transport', 'trade',
      'repair', 'healthcare', 'education'
    ],
    workingHours: { start: '07:00', end: '20:00', weekends: false },
    culturalSettings: {
      respectForElders: true,
      familyOriented: true,
      hospitalityImportant: true,
      timeFlexibility: true
    }
  },

  karakol: {
    region: 'karakol',
    language: 'ru',
    paymentPreferences: ['cash', 'card', 'bank_transfer'],
    serviceCategories: [
      'tourism', 'agriculture', 'construction', 'transport',
      'repair', 'education', 'healthcare'
    ],
    workingHours: { start: '08:00', end: '19:00', weekends: false },
    culturalSettings: {
      respectForElders: true,
      familyOriented: true,
      hospitalityImportant: true,
      timeFlexibility: true
    }
  }
};

// Сезонные особенности
const SEASONAL_SERVICES = {
  winter: {
    popular: ['heating_repair', 'snow_removal', 'indoor_repair', 'tutoring'],
    restricted: ['construction', 'gardening', 'outdoor_events']
  },
  spring: {
    popular: ['cleaning', 'gardening', 'construction_prep', 'renovation'],
    restricted: []
  },
  summer: {
    popular: ['construction', 'gardening', 'outdoor_events', 'ac_repair'],
    restricted: ['heating_repair']
  },
  autumn: {
    popular: ['harvest_help', 'preparation_winter', 'indoor_repair'],
    restricted: ['outdoor_construction']
  }
};

export class KyrgyzstanRegionalService {
  private static instance: KyrgyzstanRegionalService;
  private currentSettings: RegionalSettings | null = null;

  static getInstance(): KyrgyzstanRegionalService {
    if (!KyrgyzstanRegionalService.instance) {
      KyrgyzstanRegionalService.instance = new KyrgyzstanRegionalService();
    }
    return KyrgyzstanRegionalService.instance;
  }

  // Определение региона по GPS координатам
  async detectRegionByLocation(): Promise<string> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return 'other';
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Координаты основных городов КР
      const cityCoordinates = {
        bishkek: { lat: 42.8746, lng: 74.5698, radius: 50 }, // 50км радиус
        osh: { lat: 40.5283, lng: 72.7985, radius: 30 },
        jalal_abad: { lat: 40.9333, lng: 73.0000, radius: 25 },
        karakol: { lat: 42.4906, lng: 78.3931, radius: 20 },
        naryn: { lat: 41.4286, lng: 76.0000, radius: 15 },
        talas: { lat: 42.5228, lng: 72.2428, radius: 15 },
        batken: { lat: 40.0617, lng: 70.8156, radius: 15 }
      };

      // Находим ближайший город
      for (const [city, coords] of Object.entries(cityCoordinates)) {
        const distance = this.calculateDistance(
          latitude, longitude,
          coords.lat, coords.lng
        );

        if (distance <= coords.radius) {
          return city;
        }
      }

      return 'other';

    } catch (error) {
      console.error('Failed to detect region by location:', error);
      return 'other';
    }
  }

  // Расчет расстояния между координатами
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Радиус Земли в км
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Получение настроек региона
  async getRegionalSettings(region?: string): Promise<RegionalSettings> {
    if (this.currentSettings && !region) {
      return this.currentSettings;
    }

    // Пытаемся получить сохраненные настройки
    const savedSettings = await AsyncStorage.getItem('regional_settings');
    if (savedSettings && !region) {
      this.currentSettings = JSON.parse(savedSettings);
      return this.currentSettings as RegionalSettings;
    }

    // Определяем регион автоматически если не указан
    const detectedRegion = region || await this.detectRegionByLocation();

    // Получаем базовые настройки
    const baseSettings: RegionalSettings = {
      region: 'other',
      language: 'ru',
      currency: 'KGS',
      timezone: 'Asia/Bishkek',
      paymentPreferences: ['cash', 'bank_transfer'],
      serviceCategories: ['repair', 'cleaning', 'transport'],
      workingHours: { start: '08:00', end: '18:00', weekends: false },
      culturalSettings: {
        respectForElders: true,
        familyOriented: true,
        hospitalityImportant: true,
        timeFlexibility: true
      }
    };

    // Применяем региональные настройки
    const regionalConfig = REGIONAL_CONFIGS[detectedRegion] || {};
    this.currentSettings = { ...baseSettings, ...regionalConfig };

    // Сохраняем настройки
    await AsyncStorage.setItem('regional_settings', JSON.stringify(this.currentSettings));

    return this.currentSettings;
  }

  // Обновление региональных настроек
  async updateRegionalSettings(updates: Partial<RegionalSettings>): Promise<void> {
    const currentSettings = await this.getRegionalSettings();
    this.currentSettings = { ...currentSettings, ...updates };

    await AsyncStorage.setItem('regional_settings', JSON.stringify(this.currentSettings));
  }

  // Получение сезонных услуг
  getCurrentSeasonServices(): { popular: string[]; restricted: string[] } {
    const month = new Date().getMonth();

    let season: keyof typeof SEASONAL_SERVICES;
    if (month >= 11 || month <= 1) season = 'winter';
    else if (month >= 2 && month <= 4) season = 'spring';
    else if (month >= 5 && month <= 7) season = 'summer';
    else season = 'autumn';

    return SEASONAL_SERVICES[season];
  }

  // Получение локализованного приветствия
  getLocalizedGreeting(timeOfDay?: 'morning' | 'afternoon' | 'evening'): string {
    const settings = this.currentSettings;
    if (!settings) return 'Добро пожаловать!';

    const greetings = {
      ru: {
        morning: 'Доброе утро!',
        afternoon: 'Добро пожаловать!',
        evening: 'Добрый вечер!'
      },
      ky: {
        morning: 'Кутман таң!',
        afternoon: 'Кош келиңиз!',
        evening: 'Кутман кеч!'
      }
    };

    const time = timeOfDay || this.getTimeOfDay();
    return greetings[settings.language][time];
  }

  private getTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }

  // Получение предпочтительных способов оплаты для региона
  getPreferredPaymentMethods(): Array<{
    id: string;
    name: string;
    description: string;
    popular: boolean;
  }> {
    const settings = this.currentSettings;
    if (!settings) return [];

    const paymentMethods = {
      cash: {
        name: settings.language === 'ky' ? 'Накт акча' : 'Наличные',
        description: settings.language === 'ky' ? 'Жолугушууда төлөө' : 'Оплата при встрече'
      },
      card: {
        name: settings.language === 'ky' ? 'Карта' : 'Банковская карта',
        description: settings.language === 'ky' ? 'Банк картасы менен' : 'Оплата картой'
      },
      bank_transfer: {
        name: settings.language === 'ky' ? 'Банк которуу' : 'Банковский перевод',
        description: settings.language === 'ky' ? 'Банк аркылуу которуу' : 'Перевод через банк'
      },
      o_money: {
        name: 'O!Money',
        description: settings.language === 'ky' ? 'Beeline мобилдик төлөм' : 'Мобильные платежи Beeline'
      },
      mega_pay: {
        name: 'MegaPay',
        description: settings.language === 'ky' ? 'MegaCom мобилдик төлөм' : 'Мобильные платежи MegaCom'
      }
    };

    return settings.paymentPreferences.map((methodId, index) => ({
      id: methodId,
      ...(paymentMethods as any)[methodId],
      popular: index < 2 // Первые два метода считаем популярными
    }));
  }

  // Получение рабочих часов с учетом региона
  getWorkingHours(): { start: string; end: string; weekends: boolean } {
    const settings = this.currentSettings;
    return settings?.workingHours || { start: '08:00', end: '18:00', weekends: false };
  }

  // Проверка, является ли время подходящим для работы
  isWorkingTime(datetime: Date): boolean {
    const settings = this.currentSettings;
    if (!settings) return true;

    const { workingHours } = settings;
    const dayOfWeek = datetime.getDay();
    const hour = datetime.getHours();
    const minute = datetime.getMinutes();
    const timeInMinutes = hour * 60 + minute;

    // Проверяем выходные дни
    if (!workingHours.weekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
      return false;
    }

    // Проверяем рабочие часы
    const [startHour, startMinute] = workingHours.start.split(':').map(Number);
    const [endHour, endMinute] = workingHours.end.split(':').map(Number);

    const startTimeInMinutes = startHour * 60 + startMinute;
    const endTimeInMinutes = endHour * 60 + endMinute;

    return timeInMinutes >= startTimeInMinutes && timeInMinutes <= endTimeInMinutes;
  }

  // Получение культурных особенностей
  getCulturalSettings() {
    const settings = this.currentSettings;
    return settings?.culturalSettings || {
      respectForElders: true,
      familyOriented: true,
      hospitalityImportant: true,
      timeFlexibility: true
    };
  }

  // Форматирование цены с учетом региона
  formatPrice(amount: number): string {
    const settings = this.currentSettings;
    const region = settings?.region || 'other';

    // Региональные коэффициенты для отображения цен
    const displayMultipliers = {
      bishkek: 1.0,
      osh: 0.8,
      jalal_abad: 0.7,
      karakol: 0.9,
      other: 0.6
    };

    const adjustedAmount = amount * ((displayMultipliers as any)[region] || 1.0);

    return new Intl.NumberFormat('ru-KG', {
      style: 'currency',
      currency: 'KGS',
      minimumFractionDigits: 0
    }).format(adjustedAmount);
  }
}

// Экспорт синглтона
export const regionalService = KyrgyzstanRegionalService.getInstance();

// Хук для использования в компонентах
export function useKyrgyzstanRegion() {
  const [settings, setSettings] = React.useState<RegionalSettings | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const regionalSettings = await regionalService.getRegionalSettings();
        setSettings(regionalSettings);
      } catch (error) {
        console.error('Failed to load regional settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const updateSettings = async (updates: Partial<RegionalSettings>) => {
    await regionalService.updateRegionalSettings(updates);
    const newSettings = await regionalService.getRegionalSettings();
    setSettings(newSettings);
  };

  return {
    settings,
    loading,
    updateSettings,
    seasonalServices: regionalService.getCurrentSeasonServices(),
    paymentMethods: regionalService.getPreferredPaymentMethods(),
    workingHours: regionalService.getWorkingHours(),
    culturalSettings: regionalService.getCulturalSettings(),
    formatPrice: regionalService.formatPrice.bind(regionalService),
    isWorkingTime: regionalService.isWorkingTime.bind(regionalService)
  };
}

export { REGIONAL_CONFIGS, SEASONAL_SERVICES };