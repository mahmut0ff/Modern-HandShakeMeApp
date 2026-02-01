import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ServiceCategoryRepository } from '../shared/repositories/service.repository';
import { successResponse } from '../shared/utils/unified-response';
import { logger } from '../shared/utils/logger';

// Fallback static categories if database is empty
const FALLBACK_CATEGORIES = [
  { 
    id: 'cat-1', 
    name: 'Ремонт и строительство', 
    nameKy: 'Оңдоо жана курулуш',
    description: 'Строительные и ремонтные работы',
    icon: 'hammer',
    isActive: true,
    orderIndex: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  { 
    id: 'cat-2', 
    name: 'Электрика', 
    nameKy: 'Электрика',
    description: 'Электромонтажные работы',
    icon: 'bolt',
    isActive: true,
    orderIndex: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  { 
    id: 'cat-3', 
    name: 'Сантехника', 
    nameKy: 'Сантехника',
    description: 'Сантехнические работы',
    icon: 'water',
    isActive: true,
    orderIndex: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  { 
    id: 'cat-4', 
    name: 'Отделочные работы', 
    nameKy: 'Бүтүрүү иштери',
    description: 'Отделка и декор',
    icon: 'paint',
    isActive: true,
    orderIndex: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  { 
    id: 'cat-5', 
    name: 'Уборка', 
    nameKy: 'Тазалоо',
    description: 'Клининговые услуги',
    icon: 'broom',
    isActive: true,
    orderIndex: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  { 
    id: 'cat-6', 
    name: 'Грузоперевозки', 
    nameKy: 'Жүк ташуу',
    description: 'Транспортные услуги',
    icon: 'truck',
    isActive: true,
    orderIndex: 6,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  { 
    id: 'cat-7', 
    name: 'Мебель', 
    nameKy: 'Эмерек',
    description: 'Мебельные работы',
    icon: 'chair',
    isActive: true,
    orderIndex: 7,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  { 
    id: 'cat-8', 
    name: 'Техника', 
    nameKy: 'Техника',
    description: 'Ремонт техники',
    icon: 'tv',
    isActive: true,
    orderIndex: 8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  { 
    id: 'cat-9', 
    name: 'Компьютеры', 
    nameKy: 'Компьютерлер',
    description: 'IT услуги',
    icon: 'laptop',
    isActive: true,
    orderIndex: 9,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  { 
    id: 'cat-10', 
    name: 'Автомобили', 
    nameKy: 'Автомобилдер',
    description: 'Автосервис',
    icon: 'car',
    isActive: true,
    orderIndex: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('List service categories request');
    
    const categoryRepository = new ServiceCategoryRepository();
    
    try {
      // Try to get categories from database
      const categories = await categoryRepository.findAll();
      
      if (categories.length > 0) {
        logger.info('Categories retrieved from database', { count: categories.length });
        return successResponse({
          categories: categories.sort((a, b) => a.orderIndex - b.orderIndex),
          count: categories.length,
          source: 'database'
        });
      }
    } catch (error) {
      logger.warn('Failed to retrieve categories from database, using fallback', { error });
    }
    
    // Use fallback categories
    logger.info('Using fallback categories', { count: FALLBACK_CATEGORIES.length });
    
    return successResponse({
      categories: FALLBACK_CATEGORIES,
      count: FALLBACK_CATEGORIES.length,
      source: 'fallback'
    });
  } catch (error: any) {
    logger.error('List service categories error:', error);
    
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
};
