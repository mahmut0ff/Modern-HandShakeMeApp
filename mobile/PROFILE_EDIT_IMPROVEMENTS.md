# Profile Edit Screen Improvements

## Проблемы

1. **Отсутствовали поля для мастеров**
   - Не отображались: companyName, bio, experienceYears, rates
   - Не было возможности редактировать профессиональную информацию

2. **Ошибка "Failed" при сохранении**
   - Для мастеров требуется обновление двух профилей: User и MasterProfile
   - Обновлялся только User profile
   - MasterProfile не обновлялся

3. **Нет разделения полей**
   - Все поля в одной куче
   - Непонятно какие обязательные

## Решение

### 1. Добавлены все поля для мастеров

**Basic Information:**
- First Name * (обязательное)
- Last Name * (обязательное)
- City * (обязательное для мастеров)
- Phone (только чтение)

**Professional Information (только для мастеров):**
- Company Name
- Bio (многострочное поле)
- Experience Years

**Pricing (только для мастеров):**
- Hourly Rate
- Daily Rate
- Min Order Amount
- Max Order Amount

### 2. Исправлено сохранение

```typescript
const handleSave = async () => {
    // Валидация
    if (!firstName.trim() || !lastName.trim()) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
    }

    if (isMaster && !city.trim()) {
        Alert.alert('Error', 'City is required for masters');
        return;
    }

    setIsSaving(true);
    try {
        // 1. Обновить базовый профиль пользователя
        const userData: UpdateUserRequest = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            city: city.trim() || undefined,
        };
        await profileApi.updateCurrentUser(userData);

        // 2. Обновить профиль мастера (если мастер)
        if (isMaster) {
            const masterData: UpdateMasterProfileRequest = {
                companyName: companyName.trim() || undefined,
                bio: bio.trim() || undefined,
                experienceYears: experienceYears ? parseInt(experienceYears) : undefined,
                hourlyRate: hourlyRate.trim() || undefined,
                dailyRate: dailyRate.trim() || undefined,
                minOrderAmount: minOrderAmount.trim() || undefined,
                maxOrderAmount: maxOrderAmount.trim() || undefined,
                city: city.trim(),
            };
            await profileApi.updateMasterProfile(masterData);
        }

        Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
        const errorMessage = error?.response?.data?.message || 'Failed to update profile';
        Alert.alert('Error', errorMessage);
    }
};
```

### 3. Загрузка данных мастера

```typescript
useEffect(() => {
    if (isMaster) {
        loadMasterProfile();
    }
}, [isMaster]);

const loadMasterProfile = async () => {
    try {
        const response = await profileApi.getMasterProfile();
        const profile = response.data;
        setMasterProfile(profile);
        
        // Заполнить поля
        setCompanyName(profile.companyName || '');
        setBio(profile.bio || '');
        setExperienceYears(profile.experienceYears?.toString() || '');
        setHourlyRate(profile.hourlyRate || '');
        setDailyRate(profile.dailyRate || '');
        setMinOrderAmount(profile.minOrderAmount || '');
        setMaxOrderAmount(profile.maxOrderAmount || '');
    } catch (error) {
        console.error('Failed to load master profile', error);
    }
};
```

### 4. Улучшен UI

**Секции с заголовками:**
- Basic Information
- Professional Information (только мастера)
- Pricing (только мастера)

**Типы полей:**
- Обычные input для текста
- TextArea для bio (многострочное)
- Numeric keyboard для чисел (experience, rates)

**Информационный блок:**
```typescript
<View style={styles.infoBox}>
    <Ionicons name="information-circle-outline" />
    <Text>
        To edit your skills and categories, please go to Portfolio section
    </Text>
</View>
```

**Loading state:**
- Показывается индикатор при загрузке профиля мастера
- Предотвращает показ пустых полей

## Структура данных

### User Profile (базовый)
```typescript
{
    firstName: string,
    lastName: string,
    city?: string,
    phone: string (readonly),
    avatar?: string
}
```

### Master Profile (дополнительный)
```typescript
{
    companyName?: string,
    bio?: string,
    experienceYears?: number,
    hourlyRate?: string,
    dailyRate?: string,
    minOrderAmount?: string,
    maxOrderAmount?: string,
    city: string,
    categories: number[],  // Редактируется в Portfolio
    skills: number[],      // Редактируется в Portfolio
    // ... другие поля
}
```

## API Endpoints

### Обновление базового профиля
```
PATCH /profile/me
Body: { firstName, lastName, city }
```

### Обновление профиля мастера
```
PATCH /profile/master
Body: { companyName, bio, experienceYears, hourlyRate, ... }
```

### Загрузка профиля мастера
```
GET /profile/master
Response: MasterProfile
```

## Валидация

### Обязательные поля для всех:
- First Name
- Last Name

### Обязательные поля для мастеров:
- City

### Опциональные поля:
- Все остальные

### Числовые поля:
- Experience Years (целое число)
- Hourly Rate (строка, но numeric keyboard)
- Daily Rate (строка, но numeric keyboard)
- Min/Max Order Amount (строка, но numeric keyboard)

## Обработка ошибок

```typescript
try {
    await profileApi.updateCurrentUser(userData);
    if (isMaster) {
        await profileApi.updateMasterProfile(masterData);
    }
    Alert.alert('Success', 'Profile updated successfully');
} catch (error: any) {
    const errorMessage = error?.response?.data?.message || 'Failed to update profile';
    Alert.alert('Error', errorMessage);
}
```

Показывает:
- Конкретное сообщение об ошибке от сервера
- Fallback сообщение если сервер не вернул детали

## Результат

### Для клиентов:
✅ Могут редактировать: имя, фамилию, город
✅ Видят свой телефон (readonly)
✅ Могут загружать аватар

### Для мастеров:
✅ Все что могут клиенты +
✅ Company Name
✅ Bio (описание)
✅ Experience Years
✅ Hourly Rate
✅ Daily Rate
✅ Min/Max Order Amount
✅ Информация о редактировании skills/categories в Portfolio

### Сохранение:
✅ Обновляется User profile
✅ Обновляется Master profile (если мастер)
✅ Показывается конкретная ошибка при неудаче
✅ Возврат на предыдущий экран при успехе

## Будущие улучшения

1. **Skills & Categories**
   - Добавить редактирование в Portfolio section
   - Или добавить отдельный экран для выбора

2. **Валидация на клиенте**
   - Проверка формата rates (только цифры)
   - Проверка min < max для order amounts

3. **Автосохранение**
   - Сохранять черновик локально
   - Предупреждать о несохраненных изменениях

4. **Превью**
   - Показывать как профиль выглядит для других

5. **Локализация**
   - Перевести все тексты
   - Поддержка нескольких языков
