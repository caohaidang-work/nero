import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { ActivityIndicator, Image, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../context/auth';

const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  return (
    <View style={styles.tabBarContainer}>
      {/* MẸO: Giảm intensity xuống 45 để lớp kính trong hơn, bớt đục */}
      <BlurView intensity={45} tint="dark" style={styles.blurView}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          let iconName: any = 'home';
          if (route.name === 'index') iconName = 'home';
          else if (route.name == 'recent') iconName = 'time';
          else if (route.name === 'week') iconName = 'calendar';
          else if (route.name === 'profile') iconName = 'person';

          return (
            <TouchableOpacity
              key={index}
              onPress={onPress}
              style={[styles.tabItem, isFocused && styles.tabItemFocused]}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={isFocused ? iconName : `${iconName}-outline`} 
                size={22} 
                color={isFocused ? '#FFFFFF' : '#888888'} 
              />
            </TouchableOpacity>
          );
        })}
      </BlurView>
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
            style={[styles.loginButton, isAuthenticating && styles.loginButtonDisabled]} 
            disabled={isAuthenticating} 
            onPress={login}
            activeOpacity={0.8}
          >
            {isAuthenticating ? (
              <ActivityIndicator color="white" />
            ) : (
              <View style={styles.buttonContent}>
                <FontAwesome5 name="spotify" size={24} color="white" style={styles.spotifyIcon} />
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
    <Tabs tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: '#121212' } }}>
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

  tabBarContainer: { 
    position: 'absolute', 
    bottom: 12, 
    alignSelf: 'center', 
    zIndex: 10 
  },
  blurView: { 
    flexDirection: 'row', 
    // MẸO: Hạ alpha xuống 0.15 để gần như trong suốt hoàn toàn, ánh sáng xuyên qua rất mạnh
    backgroundColor: 'rgba(20, 20, 20, 0.15)', 
    borderRadius: 50, 
    paddingHorizontal: 6, 
    paddingVertical: 6,   
    borderWidth: 1, 
    // Tăng nhẹ viền sáng lên 0.2 để giữ form dáng của kính khi nền đã quá trong
    borderColor: 'rgba(255, 255, 255, 0.2)', 
    overflow: 'hidden' 
  },
  tabItem: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingHorizontal: 22, 
    paddingVertical: 10,   
    borderRadius: 40,      
    marginHorizontal: 4,   
  },
  tabItemFocused: {
    // Lớp oval active cũng được làm trong suốt hơn một chút để tệp với tổng thể
    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
  }
});