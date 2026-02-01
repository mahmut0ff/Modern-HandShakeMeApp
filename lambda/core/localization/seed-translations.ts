/**
 * Seed Translations
 * Скрипт для импорта переводов в DynamoDB
 */

import { LocalizationService } from '../shared/services/localization.service';
import { SupportedLocale } from '../shared/types/localization';

// Импортируем JSON файлы
import enTranslations from './locales/en.json';
import ruTranslations from './locales/ru.json';
import kyTranslations from './locales/ky.json';

const localizationService = new LocalizationService();

/**
 * Преобразовать вложенный объект в плоский с точечной нотацией
 */
function flattenObject(obj: any, prefix: string = ''): Record<string, string> {
  const flattened: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(flattened, flattenObject(value, newKey));
    } else {
      flattened[newKey] = String(value);
    }
  }
  
  return flattened;
}

/**
 * Импортировать переводы для одной локали
 */
async function importLocaleTranslations(
  locale: SupportedLocale,
  translations: any,
  overwrite: boolean = false
): Promise<void> {
  console.log(`Importing translations for locale: ${locale}`);
  
  try {
    const flatTranslations = flattenObject(translations);
    
    const result = await localizationService.importTranslations(
      locale,
      flatTranslations,
      'general',
      overwrite
    );
    
    console.log(`✅ Locale ${locale}:`, {
      imported: result.imported,
      skipped: result.skipped,
      errors: result.errors.length
    });
    
    if (result.errors.length > 0) {
      console.log('Errors:', result.errors.slice(0, 5)); // Показываем первые 5 ошибок
    }
    
  } catch (error) {
    console.error(`❌ Error importing translations for ${locale}:`, error);
  }
}

/**
 * Основная функция импорта
 */
async function seedTranslations(overwrite: boolean = false): Promise<void> {
  console.log('🌱 Starting translation seeding...');
  console.log(`Overwrite existing: ${overwrite}`);
  
  try {
    // Импортируем переводы для всех локалей
    await Promise.all([
      importLocaleTranslations('en', enTranslations, overwrite),
      importLocaleTranslations('ru', ruTranslations, overwrite),
      importLocaleTranslations('ky', kyTranslations, overwrite)
    ]);
    
    // Получаем статистику
    const stats = await localizationService.getStats();
    console.log('\n📊 Translation Statistics:');
    console.log('Total translations:', stats.totalTranslations);
    console.log('By locale:', stats.byLocale);
    console.log('Completeness:', 
      Object.entries(stats.completeness).map(([locale, percent]) => 
        `${locale}: ${percent.toFixed(1)}%`
      ).join(', ')
    );
    
    console.log('\n✅ Translation seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during translation seeding:', error);
    process.exit(1);
  }
}

/**
 * Предварительная загрузка кэша для всех локалей
 */
async function preloadCache(): Promise<void> {
  console.log('🚀 Preloading translation cache...');
  
  try {
    await Promise.all([
      localizationService.preloadCache('en'),
      localizationService.preloadCache('ru'),
      localizationService.preloadCache('ky')
    ]);
    
    console.log('✅ Cache preloaded successfully!');
  } catch (error) {
    console.error('❌ Error preloading cache:', error);
  }
}

/**
 * Экспорт переводов для проверки
 */
async function exportTranslationsForVerification(): Promise<void> {
  console.log('📤 Exporting translations for verification...');
  
  try {
    const locales: SupportedLocale[] = ['en', 'ru', 'ky'];
    
    for (const locale of locales) {
      const translations = await localizationService.exportTranslations(locale);
      const count = Object.keys(translations).length;
      console.log(`${locale}: ${count} translations exported`);
      
      // Сохраняем в файл для проверки (опционально)
      // const fs = require('fs');
      // fs.writeFileSync(`./exported_${locale}.json`, JSON.stringify(translations, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error exporting translations:', error);
  }
}

// Обработка аргументов командной строки
const args = process.argv.slice(2);
const overwrite = args.includes('--overwrite') || args.includes('-o');
const cacheOnly = args.includes('--cache-only');
const exportOnly = args.includes('--export-only');

// Запуск соответствующей функции
if (cacheOnly) {
  preloadCache().then(() => process.exit(0));
} else if (exportOnly) {
  exportTranslationsForVerification().then(() => process.exit(0));
} else {
  seedTranslations(overwrite)
    .then(() => preloadCache())
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

// Экспортируем функции для использования в других модулях
export {
  seedTranslations,
  preloadCache,
  exportTranslationsForVerification,
  flattenObject
};