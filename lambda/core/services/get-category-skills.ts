// Get skills for a specific category Lambda function

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ServiceCategoryRepository } from '../shared/repositories/service.repository';
import { successResponse, notFoundResponse, badRequestResponse } from '../shared/utils/unified-response';
import { logger } from '../shared/utils/logger';

// Static skills mapping for categories
const CATEGORY_SKILLS = {
  'cat-1': [ // Ремонт и строительство
    'Кладка кирпича',
    'Штукатурка',
    'Стяжка пола',
    'Монтаж гипсокартона',
    'Кровельные работы',
    'Фундаментные работы'
  ],
  'cat-2': [ // Электрика
    'Монтаж проводки',
    'Установка розеток',
    'Подключение люстр',
    'Электрощиты',
    'Заземление',
    'Диагностика электросетей'
  ],
  'cat-3': [ // Сантехника
    'Установка смесителей',
    'Замена труб',
    'Монтаж сантехники',
    'Прочистка канализации',
    'Установка счетчиков',
    'Ремонт водонагревателей'
  ],
  'cat-4': [ // Отделочные работы
    'Поклейка обоев',
    'Покраска стен',
    'Укладка плитки',
    'Ламинат',
    'Натяжные потолки',
    'Декоративная штукатурка'
  ],
  'cat-5': [ // Уборка
    'Генеральная уборка',
    'Мытье окон',
    'Химчистка мебели',
    'Уборка после ремонта',
    'Клининг офисов',
    'Дезинфекция'
  ],
  'cat-6': [ // Грузоперевозки
    'Квартирный переезд',
    'Офисный переезд',
    'Грузчики',
    'Доставка мебели',
    'Вывоз мусора',
    'Междугородние перевозки'
  ],
  'cat-7': [ // Мебель
    'Сборка мебели',
    'Ремонт мебели',
    'Перетяжка мебели',
    'Изготовление на заказ',
    'Реставрация',
    'Установка кухни'
  ],
  'cat-8': [ // Техника
    'Ремонт холодильников',
    'Ремонт стиральных машин',
    'Ремонт телевизоров',
    'Ремонт микроволновок',
    'Установка техники',
    'Диагностика'
  ],
  'cat-9': [ // Компьютеры
    'Ремонт компьютеров',
    'Установка ПО',
    'Настройка сетей',
    'Восстановление данных',
    'Сборка ПК',
    'IT консультации'
  ],
  'cat-10': [ // Автомобили
    'Диагностика авто',
    'Замена масла',
    'Ремонт двигателя',
    'Кузовной ремонт',
    'Шиномонтаж',
    'Автоэлектрика'
  ]
};

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const categoryId = event.pathParameters?.id;
    
    if (!categoryId) {
      return badRequestResponse('Category ID is required');
    }
    
    logger.info('Get category skills request', { categoryId });
    
    // Check if category exists
    const categoryRepository = new ServiceCategoryRepository();
    const category = await categoryRepository.findById(categoryId);
    
    if (!category) {
      return notFoundResponse('Category not found');
    }
    
    // Get skills for this category
    const skills = CATEGORY_SKILLS[categoryId as keyof typeof CATEGORY_SKILLS] || [];
    
    logger.info('Category skills retrieved successfully', { 
      categoryId, 
      skillsCount: skills.length 
    });
    
    return successResponse({
      category: {
        id: category.id,
        name: category.name,
        nameKy: category.nameKy,
      },
      skills: skills.map((skill, index) => ({
        id: `${categoryId}-skill-${index + 1}`,
        name: skill,
        categoryId: categoryId,
      })),
      count: skills.length,
    });
  } catch (error: any) {
    logger.error('Get category skills error:', error);
    
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