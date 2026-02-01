# Установка Location Tracking Feature

## Шаг 1: Установка зависимостей

```bash
cd mobile
npm install react-native-maps react-native-chart-kit react-native-svg
```

## Шаг 2: Настройка react-native-maps

### Для Android

1. Добавьте Google Maps API ключ в `android/app/src/main/AndroidManifest.xml`:

```xml
<application>
  <meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="YOUR_GOOGLE_MAPS_API_KEY"/>
</application>
```

2. Обновите `android/build.gradle`:

```gradle
buildscript {
    ext {
        googlePlayServicesVersion = "18.0.0"
    }
}
```

### Для iOS

1. Добавьте в `ios/Podfile`:

```ruby
# Uncomment the next line to define a global platform for your project
platform :ios, '13.0'

target 'YourApp' do
  # Add this line
  rn_maps_path = '../node_modules/react-native-maps'
  pod 'react-native-google-maps', :path => rn_maps_path
end
```

2. Установите pods:

```bash
cd ios
pod install
cd ..
```

3. Добавьте Google Maps API ключ в `ios/YourApp/AppDelegate.mm`:

```objc
#import <GoogleMaps/GoogleMaps.h>

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [GMSServices provideAPIKey:@"YOUR_GOOGLE_MAPS_API_KEY"];
  // ... rest of the code
}
```

## Шаг 3: Настройка разрешений

### app.json

Добавьте или обновите конфигурацию в `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Приложению необходим доступ к вашему местоположению для отслеживания маршрута.",
          "locationWhenInUsePermission": "Приложению необходим доступ к вашему местоположению для отслеживания маршрута."
        }
      ]
    ],
    "android": {
      "permissions": [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "FOREGROUND_SERVICE",
        "ACCESS_BACKGROUND_LOCATION"
      ],
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_GOOGLE_MAPS_API_KEY"
        }
      }
    },
    "ios": {
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "Приложению необходим доступ к вашему местоположению для отслеживания маршрута.",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "Приложению необходим доступ к вашему местоположению для отслеживания маршрута в фоновом режиме.",
        "NSLocationAlwaysUsageDescription": "Приложению необходим доступ к вашему местоположению для отслеживания маршрута в фоновом режиме."
      },
      "config": {
        "googleMapsApiKey": "YOUR_GOOGLE_MAPS_API_KEY"
      }
    }
  }
}
```

## Шаг 4: Получение Google Maps API ключа

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите следующие API:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Geocoding API (опционально)
4. Создайте API ключ в разделе "Credentials"
5. Ограничьте ключ для безопасности:
   - Для Android: добавьте SHA-1 отпечаток вашего приложения
   - Для iOS: добавьте Bundle ID вашего приложения

## Шаг 5: Пересборка приложения

После установки зависимостей и настройки необходимо пересобрать приложение:

### Android

```bash
npx expo run:android
```

### iOS

```bash
npx expo run:ios
```

## Шаг 6: Проверка установки

Запустите приложение и перейдите на экран отслеживания:

```typescript
import { useRouter } from 'expo-router';

const router = useRouter();
router.push('/location-tracking');
```

Если карта отображается корректно, установка прошла успешно!

## Troubleshooting

### Карта не отображается на Android

1. Проверьте, что API ключ добавлен в `AndroidManifest.xml`
2. Убедитесь, что Maps SDK for Android включен в Google Cloud Console
3. Проверьте, что SHA-1 отпечаток добавлен в ограничения API ключа

### Карта не отображается на iOS

1. Проверьте, что pods установлены (`cd ios && pod install`)
2. Убедитесь, что API ключ добавлен в `AppDelegate.mm`
3. Проверьте, что Bundle ID добавлен в ограничения API ключа

### Ошибка разрешений

1. Убедитесь, что разрешения добавлены в `app.json`
2. Переустановите приложение после изменения разрешений
3. Проверьте настройки разрешений в системных настройках устройства

### Графики не отображаются

1. Убедитесь, что `react-native-svg` установлен
2. Проверьте, что данные для графиков корректны
3. Попробуйте пересобрать приложение

## Дополнительные настройки

### Фоновое отслеживание (опционально)

Для отслеживания в фоновом режиме добавьте:

```json
{
  "expo": {
    "android": {
      "permissions": [
        "ACCESS_BACKGROUND_LOCATION"
      ]
    },
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": [
          "location"
        ]
      }
    }
  }
}
```

### Оптимизация производительности

1. Используйте `PROVIDER_GOOGLE` для лучшей производительности на Android
2. Настройте интервал обновления в зависимости от требований
3. Используйте `distanceInterval` для экономии батареи

## Поддержка

Если у вас возникли проблемы:

1. Проверьте [документацию react-native-maps](https://github.com/react-native-maps/react-native-maps)
2. Проверьте [документацию expo-location](https://docs.expo.dev/versions/latest/sdk/location/)
3. Создайте issue в репозитории проекта
