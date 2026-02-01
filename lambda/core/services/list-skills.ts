// List all skills Lambda function

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { successResponse } from '../shared/utils/unified-response';
import { logger } from '../shared/utils/logger';

// All available skills across categories
const ALL_SKILLS = [
  // Ремонт и строительство
  { id: 'skill-1', name: 'Кладка кирпича', categoryId: 'cat-1', category: 'Ремонт и строительство' },
  { id: 'skill-2', name: 'Штукатурка', categoryId: 'cat-1', category: 'Ремонт и строительство' },
  { id: 'skill-3', name: 'Стяжка пола', categoryId: 'cat-1', category: 'Ремонт и строительство' },
  { id: 'skill-4', name: 'Монтаж гипсокартона', categoryId: 'cat-1', category: 'Ремонт и строительство' },
  { id: 'skill-5', name: 'Кровельные работы', categoryId: 'cat-1', category: 'Ремонт и строительство' },
  { id: 'skill-6', name: 'Фундаментные работы', categoryId: 'cat-1', category: 'Ремонт и строительство' },
  
  // Электрика
  { id: 'skill-7', name: 'Монтаж проводки', categoryId: 'cat-2', category: 'Электрика' },
  { id: 'skill-8', name: 'Установка розеток', categoryId: 'cat-2', category: 'Электрика' },
  { id: 'skill-9', name: 'Подключение люстр', categoryId: 'cat-2', category: 'Электрика' },
  { id: 'skill-10', name: 'Электрощиты', categoryId: 'cat-2', category: 'Электрика' },
  { id: 'skill-11', name: 'Заземление', categoryId: 'cat-2', category: 'Электрика' },
  { id: 'skill-12', name: 'Диагностика электросетей', categoryId: 'cat-2', category: 'Электрика' },
  
  // Сантехника
  { id: 'skill-13', name: 'Установка смесителей', categoryId: 'cat-3', category: 'Сантехника' },
  { id: 'skill-14', name: 'Замена труб', categoryId: 'cat-3', category: 'Сантехника' },
  { id: 'skill-15', name: 'Монтаж сантехники', categoryId: 'cat-3', category: 'Сантехника' },
  { id: 'skill-16', name: 'Прочистка канализации', categoryId: 'cat-3', category: 'Сантехника' },
  { id: 'skill-17', name: 'Установка счетчиков', categoryId: 'cat-3', category: 'Сантехника' },
  { id: 'skill-18', name: 'Ремонт водонагревателей', categoryId: 'cat-3', category: 'Сантехника' },
  
  // Отделочные работы
  { id: 'skill-19', name: 'Поклейка обоев', categoryId: 'cat-4', category: 'Отделочные работы' },
  { id: 'skill-20', name: 'Покраска стен', categoryId: 'cat-4', category: 'Отделочные работы' },
  { id: 'skill-21', name: 'Укладка плитки', categoryId: 'cat-4', category: 'Отделочные работы' },
  { id: 'skill-22', name: 'Ламинат', categoryId: 'cat-4', category: 'Отделочные работы' },
  { id: 'skill-23', name: 'Натяжные потолки', categoryId: 'cat-4', category: 'Отделочные работы' },
  { id: 'skill-24', name: 'Декоративная штукатурка', categoryId: 'cat-4', category: 'Отделочные работы' },
  
  // Уборка
  { id: 'skill-25', name: 'Генеральная уборка', categoryId: 'cat-5', category: 'Уборка' },
  { id: 'skill-26', name: 'Мытье окон', categoryId: 'cat-5', category: 'Уборка' },
  { id: 'skill-27', name: 'Химчистка мебели', categoryId: 'cat-5', category: 'Уборка' },
  { id: 'skill-28', name: 'Уборка после ремонта', categoryId: 'cat-5', category: 'Уборка' },
  { id: 'skill-29', name: 'Клининг офисов', categoryId: 'cat-5', category: 'Уборка' },
  { id: 'skill-30', name: 'Дезинфекция', categoryId: 'cat-5', category: 'Уборка' },
  
  // Грузоперевозки
  { id: 'skill-31', name: 'Квартирный переезд', categoryId: 'cat-6', category: 'Грузоперевозки' },
  { id: 'skill-32', name: 'Офисный переезд', categoryId: 'cat-6', category: 'Грузоперевозки' },
  { id: 'skill-33', name: 'Грузчики', categoryId: 'cat-6', category: 'Грузоперевозки' },
  { id: 'skill-34', name: 'Доставка мебели', categoryId: 'cat-6', category: 'Грузоперевозки' },
  { id: 'skill-35', name: 'Вывоз мусора', categoryId: 'cat-6', category: 'Грузоперевозки' },
  { id: 'skill-36', name: 'Междугородние перевозки', categoryId: 'cat-6', category: 'Грузоперевозки' },
  
  // Мебель
  { id: 'skill-37', name: 'Сборка мебели', categoryId: 'cat-7', category: 'Мебель' },
  { id: 'skill-38', name: 'Ремонт мебели', categoryId: 'cat-7', category: 'Мебель' },
  { id: 'skill-39', name: 'Перетяжка мебели', categoryId: 'cat-7', category: 'Мебель' },
  { id: 'skill-40', name: 'Изготовление на заказ', categoryId: 'cat-7', category: 'Мебель' },
  { id: 'skill-41', name: 'Реставрация', categoryId: 'cat-7', category: 'Мебель' },
  { id: 'skill-42', name: 'Установка кухни', categoryId: 'cat-7', category: 'Мебель' },
  
  // Техника
  { id: 'skill-43', name: 'Ремонт холодильников', categoryId: 'cat-8', category: 'Техника' },
  { id: 'skill-44', name: 'Ремонт стиральных машин', categoryId: 'cat-8', category: 'Техника' },
  { id: 'skill-45', name: 'Ремонт телевизоров', categoryId: 'cat-8', category: 'Техника' },
  { id: 'skill-46', name: 'Ремонт микроволновок', categoryId: 'cat-8', category: 'Техника' },
  { id: 'skill-47', name: 'Установка техники', categoryId: 'cat-8', category: 'Техника' },
  { id: 'skill-48', name: 'Диагностика', categoryId: 'cat-8', category: 'Техника' },
  
  // Компьютеры
  { id: 'skill-49', name: 'Ремонт компьютеров', categoryId: 'cat-9', category: 'Компьютеры' },
  { id: 'skill-50', name: 'Установка ПО', categoryId: 'cat-9', category: 'Компьютеры' },
  { id: 'skill-51', name: 'Настройка сетей', categoryId: 'cat-9', category: 'Компьютеры' },
  { id: 'skill-52', name: 'Восстановление данных', categoryId: 'cat-9', category: 'Компьютеры' },
  { id: 'skill-53', name: 'Сборка ПК', categoryId: 'cat-9', category: 'Компьютеры' },
  { id: 'skill-54', name: 'IT консультации', categoryId: 'cat-9', category: 'Компьютеры' },
  
  // Автомобили
  { id: 'skill-55', name: 'Диагностика авто', categoryId: 'cat-10', category: 'Автомобили' },
  { id: 'skill-56', name: 'Замена масла', categoryId: 'cat-10', category: 'Автомобили' },
  { id: 'skill-57', name: 'Ремонт двигателя', categoryId: 'cat-10', category: 'Автомобили' },
  { id: 'skill-58', name: 'Кузовной ремонт', categoryId: 'cat-10', category: 'Автомобили' },
  { id: 'skill-59', name: 'Шиномонтаж', categoryId: 'cat-10', category: 'Автомобили' },
  { id: 'skill-60', name: 'Автоэлектрика', categoryId: 'cat-10', category: 'Автомобили' },
];

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const categoryId = event.queryStringParameters?.categoryId;
    const search = event.queryStringParameters?.search;
    
    logger.info('List skills request', { categoryId, search });
    
    let filteredSkills = ALL_SKILLS;
    
    // Filter by category if provided
    if (categoryId) {
      filteredSkills = filteredSkills.filter(skill => skill.categoryId === categoryId);
    }
    
    // Filter by search term if provided
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredSkills = filteredSkills.filter(skill => 
        skill.name.toLowerCase().includes(searchTerm) ||
        skill.category.toLowerCase().includes(searchTerm)
      );
    }
    
    logger.info('Skills retrieved successfully', { 
      total: filteredSkills.length,
      categoryId,
      search 
    });
    
    return successResponse({
      skills: filteredSkills,
      count: filteredSkills.length,
      filters: {
        categoryId: categoryId || null,
        search: search || null,
      }
    });
  } catch (error: any) {
    logger.error('List skills error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
        timestamp: new Date().toISOString(),
      }),
    };
  }
}