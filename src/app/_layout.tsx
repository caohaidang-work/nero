import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../context/auth';

const TAB_COUNT = 4;
const TAB_BAR_WIDTH = 290;
const TAB_PADDING = 6;
const TAB_ITEM_WIDTH = (TAB_BAR_WIDTH - TAB_PADDING * 2) / TAB_COUNT;

const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  // Animation trượt viên nang kính active
  const slideAnim = useRef(new Animated.Value(state.index * TAB_ITEM_WIDTH)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: state.index * TAB_ITEM_WIDTH,
      damping: 18,
      stiffness: 220,
      mass: 0.8,
      useNativeDriver: true,
    }).start();
  }, [state.index]);

  return (
    <View style={styles.tabBarWrapper}>
      <View style={styles.tabBarContainer}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 70 : 90}
          tint="systemMaterialLight"
          style={styles.blurView}
        >
          {/* Lớp phản chiếu ánh sáng bề mặt kính cong (Liquid Specular) */}
          <View style={styles.glassSheenHighlight} />

          {/* Viên nang Liquid trượt mượt mà */}
          <Animated.View
            style={[
              styles.activeIndicator,
              {
                width: TAB_ITEM_WIDTH,
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            <View style={styles.innerIndicatorGlow} />
          </Animated.View>

          {/* Danh sách các Tab Icons */}
          {state.routes.map((route: any, index: number) => {
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            let iconName: any = 'home';
            if (route.name === 'index') iconName = 'home';
            else if (route.name === 'recent') iconName = 'time';
            else if (route.name === 'week') iconName = 'calendar';
            else if (route.name === 'profile') iconName = 'person';

            return (
              <TouchableOpacity
                key={index}
                onPress={onPress}
                style={[styles.tabItem, { width: TAB_ITEM_WIDTH }]}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isFocused ? iconName : `${iconName}-outline`}
                  size={21}
                  color={isFocused ? '#1C1C1E' : '#8E8E93'}
                />
              </TouchableOpacity>
            );
          })}
        </BlurView>
      </View>
    </View>
  );
};

function AppNavigation() {
  const { accessToken, isAuthenticating, login }: any = useAuth();

  if (!accessToken) {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#121212" />

        <View style={styles.brandSection}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logoBig}
          />
          <Text style={styles.tagline}>stalking ur own playlists</Text>
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[
              styles.loginButton,
              isAuthenticating && styles.loginButtonDisabled,
            ]}
            disabled={isAuthenticating}
            onPress={login}
            activeOpacity={0.8}
          >
            {isAuthenticating ? (
              <ActivityIndicator color="white" />
            ) : (
              <View style={styles.buttonContent}>
                <FontAwesome5
                  name="spotify"
                  size={24}
                  color="white"
                  style={styles.spotifyIcon}
                />
                <Text style={styles.loginButtonText}>Connect with Spotify</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.disclaimerText}>
            by continuing, you agree to our terms & privacy.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: '#121212' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'home' }} />
      <Tabs.Screen name="recent" options={{ title: 'recent' }} />
      <Tabs.Screen name="week" options={{ title: 'insights' }} />
      <Tabs.Screen name="profile" options={{ title: 'me' }} />
    </Tabs>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppNavigation />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loginContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'space-between',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  brandSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBig: {
    width: 320,
    height: 240,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  tagline: {
    color: '#b3b3b3',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  actionSection: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 20,
  },
  loginButton: {
    backgroundColor: '#1DB954',
    paddingVertical: 16,
    paddingHorizontal: 35,
    borderRadius: 50,
    width: '100%',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#1DB954',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#127334',
    elevation: 0,
    shadowOpacity: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotifyIcon: {
    marginRight: 12,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  disclaimerText: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 25,
    lineHeight: 18,
    paddingHorizontal: 10,
  },

  // LIQUID GLASS TAB BAR
  tabBarWrapper: {
    position: 'absolute',
    bottom: 30,
    width: '100%',
    alignItems: 'center',
    zIndex: 99,
  },
  tabBarContainer: {
    width: TAB_BAR_WIDTH,
    borderRadius: 40,
    // Hiệu ứng bóng nổi đa tầng
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 10,
  },
  blurView: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: TAB_PADDING,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.45)', // Nền kính sáng
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.75)', // Viền phản chiếu ánh sáng
    overflow: 'hidden',
    position: 'relative',
  },
  glassSheenHighlight: {
    position: 'absolute',
    top: 0,
    left: '10%',
    right: '10%',
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Vệt sáng viền trên
    borderRadius: 1,
  },
  activeIndicator: {
    position: 'absolute',
    left: TAB_PADDING,
    top: TAB_PADDING,
    bottom: TAB_PADDING,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 3,
  },
  innerIndicatorGlow: {
    width: '92%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.85)', // Giọt chất lỏng lơ lửng
    borderRadius: 30,
    borderWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  tabItem: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
});