import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  FlatList,
  ViewToken,
  Animated,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useThemeContext } from '../../hooks/useTheme';
import { useHapticFeedback } from '../../services/hapticFeedback';
import {
  getButtonAccessibility,
  getHeaderAccessibility,
  accessibilityManager
} from '../../utils/accessibility';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  description: string;
  gradient: string[];
  accentColor: string;
  features?: string[];
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    icon: 'hand-right-outline',
    title: 'Добро пожаловать в',
    subtitle: 'HandShakeMe',
    description: 'Платформа №1 для поиска мастеров и специалистов в Кыргызстане',
    gradient: ['#667eea', '#764ba2'],
    accentColor: '#667eea',
    features: ['1000+ мастеров', 'Все категории', 'Проверенные отзывы'],
  },
  {
    id: '2',
    icon: 'search-circle-outline',
    title: 'Умный поиск',
    subtitle: 'мастеров',
    description: 'Найдите идеального специалиста по рейтингу, цене и местоположению',
    gradient: ['#f093fb', '#f5576c'],
    accentColor: '#f093fb',
    features: ['Фильтры по рейтингу', 'Геолокация', 'Сравнение цен'],
  },
  {
    id: '3',
    icon: 'chatbubble-ellipses-outline',
    title: 'Безопасное',
    subtitle: 'общение',
    description: 'Встроенный чат с обменом файлами и видеозвонками',
    gradient: ['#4facfe', '#00f2fe'],
    accentColor: '#4facfe',
    features: ['Защищенный чат', 'Обмен файлами', 'Видеозвонки'],
  },
  {
    id: '4',
    icon: 'shield-checkmark-outline',
    title: 'Гарантия',
    subtitle: 'качества',
    description: 'Безопасные платежи и защита ваших интересов',
    gradient: ['#43e97b', '#38f9d7'],
    accentColor: '#43e97b',
    features: ['Эскроу платежи', 'Страхование', 'Поддержка 24/7'],
  }
];

interface ModernOnboardingScreenProps {
  onComplete: () => void;
}

export const ModernOnboardingScreen: React.FC<ModernOnboardingScreenProps> = ({
  onComplete
}) => {
  const { theme } = useThemeContext();
  const { buttonPress, selection, success } = useHapticFeedback();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initial animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    accessibilityManager.announcePageChange('Современное введение в HandShakeMe');
  }, []);

  useEffect(() => {
    // Update progress
    Animated.timing(progressAnim, {
      toValue: (currentIndex + 1) / slides.length,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [currentIndex]);

  const handleNext = async () => {
    await buttonPress();

    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true
      });

      // Content transition animation
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      await success();
      await handleComplete();
    }
  };

  const handleSkip = async () => {
    await selection();
    await handleComplete();
  };

  const handleComplete = async () => {
    accessibilityManager.announce('Добро пожаловать в HandShakeMe! Начинаем регистрацию');

    // Exit animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete();
    });
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        const newIndex = viewableItems[0].index || 0;
        setCurrentIndex(newIndex);

        const slide = slides[newIndex];
        accessibilityManager.announce(
          `Слайд ${newIndex + 1} из ${slides.length}: ${slide.title} ${slide.subtitle}`
        );
      }
    }
  ).current;

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => (
    <View style={{ width, flex: 1 }}>
      <LinearGradient
        colors={item.gradient as any}
        style={{
          flex: 1,
          paddingHorizontal: 24,
          paddingTop: 100,
          paddingBottom: 40,
        }}
      >
        {/* Floating Background Elements */}
        <Animated.View
          style={{
            position: 'absolute',
            top: 80,
            right: -30,
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            transform: [
              {
                translateY: floatAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -20],
                }),
              },
            ],
          }}
        />

        <Animated.View
          style={{
            position: 'absolute',
            bottom: 150,
            left: -20,
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            transform: [
              {
                translateY: floatAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 15],
                }),
              },
            ],
          }}
        />

        {/* Main Icon */}
        <Animated.View
          style={{
            alignItems: 'center',
            marginBottom: 50,
            transform: [
              { scale: scaleAnim },
              { translateY: slideAnim }
            ],
            opacity: fadeAnim,
          }}
        >
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.25,
              shadowRadius: 20,
              elevation: 10,
              borderWidth: 2,
              borderColor: 'rgba(255, 255, 255, 0.4)',
            }}
          >
            <Ionicons name={item.icon} size={60} color="white" />
          </View>
        </Animated.View>

        {/* Content */}
        <Animated.View
          style={{
            flex: 1,
            justifyContent: 'center',
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Title */}
          <Text
            style={{
              fontSize: 24,
              fontWeight: '300',
              color: 'rgba(255, 255, 255, 0.9)',
              textAlign: 'center',
              marginBottom: 8,
            }}
            {...getHeaderAccessibility(`${item.title} ${item.subtitle}`, 1)}
          >
            {item.title}
          </Text>

          <Text
            style={{
              fontSize: 32,
              fontWeight: 'bold',
              color: 'white',
              textAlign: 'center',
              marginBottom: 24,
              textShadowColor: 'rgba(0, 0, 0, 0.2)',
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 4,
            }}
          >
            {item.subtitle}
          </Text>

          {/* Description */}
          <Text
            style={{
              fontSize: 16,
              color: 'rgba(255, 255, 255, 0.95)',
              textAlign: 'center',
              lineHeight: 24,
              marginBottom: 40,
              paddingHorizontal: 20,
              fontWeight: '400',
            }}
          >
            {item.description}
          </Text>

          {/* Features */}
          {item.features && (
            <View style={{ alignItems: 'center' }}>
              {item.features.map((feature, idx) => (
                <Animated.View
                  key={idx}
                  style={{
                    transform: [
                      {
                        translateX: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [30, 0],
                        }),
                      },
                    ],
                    opacity: fadeAnim,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: 12,
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 20,
                      minWidth: 200,
                      borderWidth: 1,
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    }}
                  >
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: 'white',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}
                    >
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color={item.accentColor}
                      />
                    </View>
                    <Text
                      style={{
                        color: 'white',
                        fontSize: 14,
                        fontWeight: '500',
                        flex: 1,
                      }}
                    >
                      {feature}
                    </Text>
                  </View>
                </Animated.View>
              ))}
            </View>
          )}
        </Animated.View>
      </LinearGradient>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar style="light" />

      {/* Skip Button */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 60,
          right: 24,
          zIndex: 100,
          opacity: fadeAnim,
        }}
      >
        <TouchableOpacity
          onPress={handleSkip}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.3)',
          }}
          {...getButtonAccessibility('Пропустить введение', 'Переход к регистрации')}
        >
          <Text
            style={{
              color: 'white',
              fontSize: 14,
              fontWeight: '600',
            }}
          >
            Пропустить
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Main Content */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        keyExtractor={(item) => item.id}
        scrollEventThrottle={16}
      />

      {/* Bottom Controls */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 24,
          paddingBottom: 50,
          paddingTop: 30,
          opacity: fadeAnim,
        }}
      >
        {/* Progress Bar */}
        <View
          style={{
            height: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            borderRadius: 1.5,
            marginBottom: 30,
            overflow: 'hidden',
          }}
        >
          <Animated.View
            style={{
              height: '100%',
              backgroundColor: 'white',
              borderRadius: 1.5,
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            }}
          />
        </View>

        {/* Navigation */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {/* Page Indicator */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {slides.map((_, index) => (
              <View
                key={index}
                style={{
                  width: index === currentIndex ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: index === currentIndex ? 'white' : 'rgba(255, 255, 255, 0.5)',
                  marginRight: 6,
                }}
              />
            ))}
            <Text
              style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: 12,
                marginLeft: 8,
                fontWeight: '500',
              }}
            >
              {currentIndex + 1} / {slides.length}
            </Text>
          </View>

          {/* Next Button */}
          <TouchableOpacity
            onPress={handleNext}
            style={{
              backgroundColor: 'white',
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 24,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 5,
            }}
            {...getButtonAccessibility(
              currentIndex === slides.length - 1 ? 'Начать использование' : 'Следующий слайд',
              currentIndex === slides.length - 1 ? 'Завершить введение и перейти к регистрации' : 'Перейти к следующему слайду'
            )}
          >
            <Text
              style={{
                color: slides[currentIndex].accentColor,
                fontSize: 16,
                fontWeight: 'bold',
                marginRight: 6,
              }}
            >
              {currentIndex === slides.length - 1 ? 'Начать' : 'Далее'}
            </Text>
            <Ionicons
              name={currentIndex === slides.length - 1 ? 'rocket' : 'arrow-forward'}
              size={18}
              color={slides[currentIndex].accentColor}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};