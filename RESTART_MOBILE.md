# 🔄 Restart Mobile App

## Проблема
```
Unable to resolve "@/src/api/auth"
```

## Решение

### 1. Остановите текущий процесс
Нажмите `Ctrl+C` в терминале где запущен `npm start`

### 2. Очистите кэш
```bash
cd mobile
npx expo start -c
```

Или:
```bash
cd mobile
npm start -- --clear
```

### 3. Если не помогло, полная очистка:
```bash
cd mobile
rm -rf node_modules/.cache
rm -rf .expo
npx expo start -c
```

### 4. Для Windows PowerShell:
```powershell
cd mobile
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue
npx expo start -c
```

## Что было исправлено

Обновлен `tsconfig.json` для поддержки алиасов `@/`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

## После перезапуска

Приложение должно запуститься без ошибок импорта.
