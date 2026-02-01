// Utility to seed categories and skills data

import { CategoryRepository } from '../shared/repositories/category.repository';
import { logger } from '../shared/utils/logger';

const categoryRepo = new CategoryRepository();

// Sample skills data for each category
const skillsData = {
  'Ремонт и строительство': [
    'Электрика', 'Сантехника', 'Плитка', 'Покраска', 'Гипсокартон', 
    'Ламинат', 'Обои', 'Кровля', 'Фундамент', 'Окна и двери'
  ],
  'Красота и здоровье': [
    'Стрижка', 'Окрашивание волос', 'Маникюр', 'Педикюр', 'Массаж',
    'Косметология', 'Наращивание ресниц', 'Брови', 'Депиляция', 'Татуаж'
  ],
  'Уборка и клининг': [
    'Генеральная уборка', 'Поддерживающая уборка', 'Мытье окон', 
    'Химчистка мебели', 'Уборка после ремонта', 'Клининг офисов'
  ],
  'Грузоперевозки': [
    'Квартирный переезд', 'Офисный переезд', 'Грузчики', 
    'Доставка мебели', 'Вывоз мусора', 'Межгородские перевозки'
  ],
  'IT и технологии': [
    'Веб-разработка', 'Мобильные приложения', 'Дизайн', 'SEO', 
    'Настройка компьютеров', 'Ремонт техники', 'Системное администрирование'
  ],
  'Репетиторство': [
    'Математика', 'Русский язык', 'Английский язык', 'Физика', 
    'Химия', 'История', 'Подготовка к ОРТ', 'Начальные классы'
  ],
  'Фото и видео': [
    'Свадебная съемка', 'Портретная съемка', 'Видеосъемка', 
    'Обработка фото', 'Монтаж видео', 'Корпоративная съемка'
  ],
  'Авто услуги': [
    'Автомойка', 'Шиномонтаж', 'Ремонт двигателя', 'Кузовной ремонт',
    'Диагностика авто', 'Замена масла', 'Тонировка'
  ],
  'Юридические услуги': [
    'Консультации', 'Составление договоров', 'Представительство в суде',
    'Регистрация бизнеса', 'Семейное право', 'Трудовое право'
  ],
  'Другое': [
    'Домашние животные', 'Садоводство', 'Кулинария', 'Организация мероприятий',
    'Переводы', 'Консультации'
  ]
};

export async function seedCategoriesAndSkills(): Promise<void> {
  try {
    logger.info('Starting categories and skills seeding');

    // Seed categories first
    await categoryRepo.seedCategories();

    // Get all categories
    const categories = await categoryRepo.listCategories({ isActive: true });
    
    // Seed skills for each category
    for (const category of categories) {
      const categorySkills = skillsData[category.name as keyof typeof skillsData];
      
      if (categorySkills) {
        // Check if skills already exist for this category
        const existingSkills = await categoryRepo.getCategorySkills(category.id, { limit: 1 });
        
        if (existingSkills.length === 0) {
          // Create skills for this category
          for (const skillName of categorySkills) {
            await categoryRepo.createSkill({
              name: skillName,
              categoryId: category.id,
              isActive: true
            });
          }
          
          logger.info(`Seeded ${categorySkills.length} skills for category: ${category.name}`);
        }
      }
    }

    logger.info('Categories and skills seeding completed');

  } catch (error) {
    logger.error('Error seeding categories and skills:', error);
    throw error;
  }
}

// Lambda handler for manual seeding (can be called via API or scheduled)
export const handler = async (): Promise<any> => {
  try {
    await seedCategoriesAndSkills();
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Categories and skills seeded successfully'
      })
    };
  } catch (error) {
    logger.error('Seeding failed:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to seed categories and skills'
      })
    };
  }
};