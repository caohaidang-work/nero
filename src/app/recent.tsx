import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Image,
    Linking,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/auth';

const { width, height } = Dimensions.get('window');

const ITEM_SIZE = 110; 

export default function RecentScreen() {
  const { accessToken }: any = useAuth();
  
  const [tracks, setTracks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const scrollY = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<any>(null);

  // --- THÊM LOGIC AUTO-REFRESH 30 GIÂY ---
  useEffect(() => {
    // 1. Tải dữ liệu lần đầu tiên (hiện vòng xoay)
    fetchRecentTracks(false);

    // 2. Thiết lập bộ đếm thời gian 30s (30000ms)
    const interval = setInterval(() => {
      fetchRecentTracks(true); // true = Tải ngầm, không hiện vòng xoay
    }, 30000);

    // 3. Dọn dẹp bộ đếm khi thoát khỏi màn hình này để tránh rò rỉ bộ nhớ
    return () => clearInterval(interval);
  }, [accessToken]); // Cập nhật lại interval nếu token đổi

  // Thêm tham số isBackground để biết đây là tải ngầm hay tải lần đầu
  const fetchRecentTracks = async (isBackground = false) => {
    if (!accessToken) {
      setTracks(Array(15).fill({
        played_at: new Date().toISOString(),
        track: {
          name: 'Day light',
          artists: [{ name: 'Kernin Joki' }],
          album: { images: [{ url: 'https://picsum.photos/200' }] },
          external_urls: { spotify: 'https://spotify.com' }
        }
      }));
      if (!isBackground) setIsLoading(false);
      return;
    }
    
    // Chỉ bật loading khi KHÔNG PHẢI đang tải ngầm
    if (!isBackground) {
      setIsLoading(true);
    }

    try {
      const res = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=30', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data?.items) {
        setTracks(data.items);
      }
    } catch (e) {
      console.error('Lỗi khi tải lịch sử:', e);
    } finally {
      if (!isBackground) {
        setIsLoading(false);
      }
    }
  };

  const handleScrollEnd = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_SIZE);
    setActiveIndex(index);
  };

  const renderItem = ({ item, index }: any) => {
    const inputRange = [
      (index - 2) * ITEM_SIZE,
      (index - 1) * ITEM_SIZE,
      index * ITEM_SIZE,
      (index + 1) * ITEM_SIZE,
      (index + 2) * ITEM_SIZE,
    ];
    const centerInputRange = [
      (index - 1) * ITEM_SIZE,
      index * ITEM_SIZE,
      (index + 1) * ITEM_SIZE,
    ];

    const translateX = scrollY.interpolate({ inputRange, outputRange: [60, 20, 0, 20, 60], extrapolate: 'clamp' });
    const scale = scrollY.interpolate({ inputRange, outputRange: [0.7, 0.85, 1, 0.85, 0.7], extrapolate: 'clamp' });
    const rotate = scrollY.interpolate({ inputRange, outputRange: ['-15deg', '-5deg', '0deg', '5deg', '15deg'], extrapolate: 'clamp' });
    const itemOpacity = scrollY.interpolate({ inputRange, outputRange: [0.2, 0.5, 1, 0.5, 0.2], extrapolate: 'clamp' });

    const activeFocusOpacity = scrollY.interpolate({ inputRange: centerInputRange, outputRange: [0, 1, 0], extrapolate: 'clamp' });
    const playButtonScale = scrollY.interpolate({ inputRange: centerInputRange, outputRange: [0.5, 1, 0.5], extrapolate: 'clamp' });

    return (
      <Animated.View 
        style={[
          styles.itemWrapper, 
          { transform: [{ translateX }, { scale }, { rotateZ: rotate }], opacity: itemOpacity }
        ]}
      >
        <TouchableOpacity 
          style={styles.trackItem} 
          activeOpacity={0.8}
          onPress={() => {
            if (index === activeIndex) {
              Linking.openURL(item.track.external_urls.spotify);
            } else {
              flatListRef.current?.scrollToOffset({ offset: index * ITEM_SIZE, animated: true });
            }
          }}
        >
          <Animated.View style={[styles.activeBackground, { opacity: activeFocusOpacity }]} />

          <Image 
            source={{ uri: item.track?.album?.images?.[0]?.url || 'https://via.placeholder.com/150' }} 
            style={styles.albumArt} 
          />
          
          <View style={styles.trackInfo}>
            <View>
              <Text style={styles.inactiveTitle} numberOfLines={1}>{item.track?.name || 'Unknown Track'}</Text>
              <Text style={styles.inactiveArtist} numberOfLines={1}>{item.track?.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist'}</Text>
            </View>

            <Animated.View style={[StyleSheet.absoluteFill, { opacity: activeFocusOpacity, justifyContent: 'center' }]}>
              <Text style={styles.activeTitle} numberOfLines={1}>{item.track?.name || 'Unknown Track'}</Text>
              <Text style={styles.activeArtist} numberOfLines={1}>{item.track?.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist'}</Text>
            </Animated.View>
          </View>

          <Animated.View 
            style={[
              styles.playButton, 
              { opacity: activeFocusOpacity, transform: [{ scale: playButtonScale }] }
            ]}
          >
            <Text style={styles.playButtonText}>Play</Text>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : (
        <Animated.FlatList
          ref={flatListRef}
          data={tracks}
          // Thêm id bài hát vào key để React không bị nhầm lẫn khi list được làm mới
          keyExtractor={(item, index) => `${item.played_at}-${item.track?.id || index}`} 
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          snapToInterval={ITEM_SIZE}
          decelerationRate="fast"
          onMomentumScrollEnd={handleScrollEnd}

          contentContainerStyle={{
            paddingTop: height / 2 - ITEM_SIZE / 2 - 40,
            paddingBottom: height / 2 - ITEM_SIZE / 2,
            alignItems: 'center',
          }}
        />
      )}
    </SafeAreaView>
  );
}

// ... (Giữ nguyên phần styles ở phía trên) ...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FB', justifyContent: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  itemWrapper: { height: ITEM_SIZE, justifyContent: 'center', alignItems: 'center', width: width },
  trackItem: { flexDirection: 'row', alignItems: 'center', padding: 10, width: width * 0.85, position: 'relative' },
  activeBackground: { ...StyleSheet.absoluteFill, backgroundColor: '#FFFFFF', borderRadius: 50, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 15, elevation: 8 },
  albumArt: { width: 75, height: 75, borderRadius: 37.5, backgroundColor: '#E0E0E0', zIndex: 1 },
  trackInfo: { flex: 1, marginLeft: 20, justifyContent: 'center', zIndex: 1 },
  inactiveTitle: { color: '#A0A0A0', fontSize: 22, fontWeight: '600', marginBottom: 4 },
  inactiveArtist: { color: '#D0D0D0', fontSize: 15, fontWeight: '500' },
  activeTitle: { color: '#1A1A1A', fontSize: 22, fontWeight: '800', marginBottom: 4 },
  activeArtist: { color: '#8A8A8A', fontSize: 15, fontWeight: '600' },
  playButton: { backgroundColor: '#F8F8F8', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1, borderColor: '#EEEEEE', marginRight: 5, zIndex: 1 },
  playButtonText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
});