import { BlurView } from 'expo-blur';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Image,
  Linking,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/auth';

const { width, height } = Dimensions.get('window');
const ITEM_SIZE = 150;

export default function RecentScreen() {
  const { accessToken }: any = useAuth();
  const [tracks, setTracks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const scrollY = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<any>(null);

  // Animation xoay đĩa CD cho bài active
  const cdSpinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchRecentTracks(false);
    const interval = setInterval(() => fetchRecentTracks(true), 30000);
    return () => clearInterval(interval);
  }, [accessToken]);

  // Vòng lặp xoay đĩa CD khi focus
  useEffect(() => {
    cdSpinAnim.setValue(0);
    const spinLoop = Animated.loop(
      Animated.timing(cdSpinAnim, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spinLoop.start();
    return () => spinLoop.stop();
  }, [activeIndex]);

  const fetchRecentTracks = async (isBackground = false) => {
    if (!accessToken) {
      setTracks(
        Array(15).fill({
          played_at: new Date().toISOString(),
          track: {
            id: 'sample',
            name: 'Daylight',
            artists: [{ name: 'Kernin Joki' }],
            album: { images: [{ url: 'https://picsum.photos/200' }] },
            external_urls: { spotify: 'https://spotify.com' },
          },
        })
      );
      if (!isBackground) setIsLoading(false);
      return;
    }

    if (!isBackground) setIsLoading(true);

    try {
      const res = await fetch(
        'https://api.spotify.com/v1/me/player/recently-played?limit=30',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const data = await res.json();
      if (data?.items) setTracks(data.items);
    } catch (e) {
      console.error(e);
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  };

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_SIZE);
    if (index >= 0 && index < tracks.length && index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  const cdSpinInterpolate = cdSpinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const renderItem = ({ item, index }: any) => {
    const inputRange = [
      (index - 1) * ITEM_SIZE,
      index * ITEM_SIZE,
      (index + 1) * ITEM_SIZE,
    ];

    // Thu phóng tổng thể hộp CD
    const scale = scrollY.interpolate({
      inputRange,
      outputRange: [0.86, 1, 0.86],
      extrapolate: 'clamp',
    });

    // Độ mờ
    const opacity = scrollY.interpolate({
      inputRange,
      outputRange: [0.45, 1, 0.45],
      extrapolate: 'clamp',
    });

    // Độ đùn ra của đĩa CD: Khi chạm tâm, đĩa CD trượt vươn hẳn sang phải
    const cdTranslateX = scrollY.interpolate({
      inputRange,
      outputRange: [0, 48, 0],
      extrapolate: 'clamp',
    });

    const isCurrent = index === activeIndex;

    return (
      <Animated.View
        style={[
          styles.itemWrapper,
          {
            transform: [{ scale }],
            opacity,
            zIndex: isCurrent ? 50 : 1,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.jewelCaseWrapper}
          activeOpacity={0.9}
          onPress={() => {
            if (isCurrent) {
              Linking.openURL(item.track.external_urls.spotify);
            } else {
              flatListRef.current?.scrollToOffset({
                offset: index * ITEM_SIZE,
                animated: true,
              });
            }
          }}
        >
          {/* ĐĨA CD BÊN DƯỚI (Trượt thò ra ngoài khi active) */}
          <Animated.View
            style={[
              styles.cdDisc,
              {
                transform: [
                  { translateX: cdTranslateX },
                  { rotate: isCurrent ? cdSpinInterpolate : '0deg' },
                ],
              },
            ]}
          >
            {/* Rãnh đĩa quang kim loại */}
            <View style={styles.cdGrooveOuter} />
            <Image
              source={{
                uri:
                  item.track?.album?.images?.[0]?.url ||
                  'https://via.placeholder.com/150',
              }}
              style={styles.cdArtwork}
            />
            {/* Lỗ trục đĩa trong suốt có vành nhựa */}
            <View style={styles.cdHoleRing}>
              <View style={styles.cdHoleCenter} />
            </View>
          </Animated.View>

          {/* VỎ HỘP JEWEL CASE TRONG SUỐT (Nằm đè lên trên) */}
          <View style={styles.jewelCaseFront}>
            <BlurView intensity={35} tint="light" style={StyleSheet.absoluteFill} />

            {/* Gáy bản lề nhựa bên trái */}
            <View style={styles.caseSpine}>
              <View style={styles.spineGroove} />
              <View style={styles.spineGroove} />
            </View>

            {/* Ảnh bìa album vuông nằm trong vỏ */}
            <View style={styles.albumArtContainer}>
              <Image
                source={{
                  uri:
                    item.track?.album?.images?.[0]?.url ||
                    'https://via.placeholder.com/150',
                }}
                style={styles.caseArt}
              />
              {/* Tem dán Hologram Y2K */}
              <View style={styles.holoBadge}>
                <Text style={styles.holoText}>COMPACT DISC</Text>
              </View>
            </View>

            {/* Thông tin bài hát bên trong booklet */}
            <View style={styles.trackInfo}>
              <Text style={styles.trackIndex}>
                TRACK // {String(index + 1).padStart(2, '0')}
              </Text>
              <Text style={styles.trackTitle} numberOfLines={1}>
                {item.track?.name}
              </Text>
              <Text style={styles.trackArtist} numberOfLines={1}>
                {item.track?.artists?.map((a: any) => a.name).join(', ')}
              </Text>
            </View>

            {/* Vết bóng lóa phản chiếu chéo mặt kính */}
            <View style={styles.caseSheen} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const activeTrack = tracks[activeIndex]?.track;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {activeTrack?.album?.images?.[0]?.url && (
        <>
          <Image
            source={{ uri: activeTrack.album.images[0].url }}
            style={styles.backgroundAlbum}
            blurRadius={3}
          />
          <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
        </>
      )}
      <View style={styles.backgroundOverlay} />

      {/* Header chỉ báo */}
      <View style={styles.topIndicator}>
        <Text style={styles.topIndicatorText}>
          JEWEL ARCHIVE // DISC {String(activeIndex + 1).padStart(2, '0')}
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#000" style={{ flex: 1 }} />
      ) : (
        <Animated.FlatList
          ref={flatListRef}
          data={tracks}
          keyExtractor={(item, index) =>
            `${item.played_at}-${item.track?.id || index}`
          }
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false, listener: handleScroll }
          )}
          scrollEventThrottle={16}
          snapToInterval={ITEM_SIZE}
          decelerationRate="fast"
          contentContainerStyle={{
            paddingTop: height / 2 - ITEM_SIZE / 2 - 20,
            paddingBottom: height / 2 - ITEM_SIZE / 2,
            alignItems: 'center',
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  backgroundAlbum: {
    position: 'absolute',
    width: '160%',
    height: '160%',
    left: '-30%',
    top: '-20%',
    opacity: 0.7,
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(246, 244, 239, 0.52)',
  },

  topIndicator: {
    paddingHorizontal: 25,
    marginTop: 15,
  },
  topIndicatorText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 10,
    fontWeight: '800',
    color: '#6E6759',
    letterSpacing: 1.2,
  },

  itemWrapper: {
    height: ITEM_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    width: width,
  },

  jewelCaseWrapper: {
    width: width * 0.86,
    height: 122,
    position: 'relative',
    justifyContent: 'center',
  },

  // ĐĨA CD
  cdDisc: {
    position: 'absolute',
    right: 25,
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: '#D6D8DC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C0C2C8',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1,
  },
  cdGrooveOuter: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  cdArtwork: {
    width: 50,
    height: 50,
    borderRadius: 25,
    opacity: 0.9,
  },
  cdHoleRing: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#B0B2B8',
  },
  cdHoleCenter: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EBE8DE',
  },

  // VỎ HỘP MẶT TRƯỚC
  jewelCaseFront: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '88%',
    height: 122,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    paddingLeft: 4,
    paddingRight: 12,
    shadowColor: '#1A1815',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 6,
    position: 'relative',
    overflow: 'hidden',
    zIndex: 2,
  },

  // Gáy bản lề nhựa bên trái
  caseSpine: {
    width: 8,
    height: '90%',
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 6,
  },
  spineGroove: {
    width: 3,
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 1.5,
  },

  // Bìa Album
  albumArtContainer: {
    position: 'relative',
  },
  caseArt: {
    width: 86,
    height: 86,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  holoBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  holoText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 6.5,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 0.5,
  },

  // Text thông tin bài hát
  trackInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  trackIndex: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 9,
    fontWeight: '800',
    color: '#706B61',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  trackTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace',
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1815',
    letterSpacing: -0.3,
  },
  trackArtist: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    fontWeight: '600',
    color: '#5C564C',
    marginTop: 3,
  },

  // Vết bóng chéo giả lập mặt kính
  caseSheen: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 100,
    height: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    transform: [{ rotate: '30deg' }],
    pointerEvents: 'none',
  },
});