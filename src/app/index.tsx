import { BlurView } from 'expo-blur';
import { useNavigation } from "expo-router/react-navigation";
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import TextTicker from 'react-native-text-ticker';
import { useAuth } from '../context/auth';

export default function HomeTab() {
  const { accessToken } = useAuth();
  
  // 1. KHỞI TẠO BIẾN ĐIỀU HƯỚNG Ở ĐÂY
  const navigation = useNavigation<any>();

  const [tracks, setTracks] = useState<any[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const rotation = useSharedValue(0);

  //bg move
  const bgScale = useSharedValue(1);
  const bgOffset = useSharedValue(0);

  useEffect(() => {
    // 2. Tải lần đầu (có hiện loading)
    fetchHomeData(false);

    // 3. Tải ngầm mỗi 30s (không hiện loading)
    const interval = setInterval(() => {
      fetchHomeData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    cancelAnimation(rotation);

    if (currentlyPlaying?.id) {
      rotation.value = 0;

      rotation.value = withRepeat(
        withTiming(360, {
          duration: 5000,
          easing: Easing.linear,
        }),
        -1
      );
    } else {
      rotation.value = 0;
    }
  }, [currentlyPlaying?.id]);

  //bg move
  useEffect(() => {
    bgScale.value = withRepeat(
      withTiming(1.15, {
        duration: 12000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );

    bgOffset.value = withRepeat(
      withTiming(20, {
        duration: 15000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${rotation.value}deg`,
      },
    ],
  }));

  //bg move
  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: bgScale.value },
      { translateX: bgOffset.value },
      { translateY: bgOffset.value * 0.4 },
    ],
  }));

  // 4. THÊM BIẾN isBackground ĐỂ TRÁNH GIẬT MÀN HÌNH MỖI 30 GIÂY
  const fetchHomeData = async (isBackground = false) => {
    if (!accessToken) return;

    if (!isBackground) {
      setIsLoading(true);
    }

    try {
      const cpRes = await fetch(
        'https://api.spotify.com/v1/me/player/currently-playing',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (cpRes.status !== 204) {
        const cpData = await cpRes.json();

        if (cpData?.item) {
          setCurrentlyPlaying(cpData.item);
        }
      } else {
        setCurrentlyPlaying(null);
      }

      const rpRes = await fetch(
        'https://api.spotify.com/v1/me/player/recently-played?limit=20',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const rpData = await rpRes.json();

      if (rpData?.items) {
        setTracks(rpData.items);
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!isBackground) {
        setIsLoading(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {currentlyPlaying && (
        <>
          <Animated.Image
            source={{
              uri: currentlyPlaying.album.images[0]?.url,
            }}
            style={[styles.backgroundAlbum, backgroundAnimatedStyle]}
          />
          <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
        </>
      )}

      <View style={styles.backgroundOverlay} />

      <Image
        source={require('../../assets/images/logo.png')}
        style={styles.logo}
      />

      {isLoading ? (
        <ActivityIndicator
          size="large"
          color="#fff"
          style={{ marginTop: 100 }}
        />
      ) : currentlyPlaying ? (
        <View style={styles.heroSection}>
          {/* VINYL */}
          <View style={styles.vinylSide}>
            <View style={styles.vinylWrapper}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() =>
                  Linking.openURL(currentlyPlaying.external_urls.spotify)
                }
              >
                <Animated.View style={[styles.bigVinylContainer, animatedStyle]}>
                  {Array.from({ length: 16 }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.groove,
                        {
                          width: 350 - i * 14,
                          height: 350 - i * 14,
                          borderRadius: (350 - i * 16) / 2,
                        },
                      ]}
                    />
                  ))}

                  <Image
                    source={{
                      uri: currentlyPlaying.album.images[0]?.url,
                    }}
                    style={styles.bigVinylArt}
                  />

                  <View style={styles.centerHole} />
                </Animated.View>
              </TouchableOpacity>

              <Image
                source={require('../../assets/images/tonearm.png')}
                style={styles.tonearm}
              />
            </View>

            <TextTicker
              style={styles.songTitle}
              duration={10000}
              loop
              bounce={false}
              repeatSpacer={80}
              marqueeDelay={1200}
            >
              {currentlyPlaying.name}
            </TextTicker>

            <Text style={styles.songArtist} numberOfLines={1}>
              {currentlyPlaying.artists.map((a: any) => a.name).join(', ')}
            </Text>
            </View>

            {/* RECENTLY PLAYED SECTION */}
            <View style={styles.recentBox}>
              <View style={styles.recentHeaderRow}>
                <Text style={styles.recentTitle}>Recently Played</Text>
                
                {/* 5. NÚT CHUYỂN TRANG ĐÃ ĐƯỢC CHUẨN BỊ SẴN */}
                <TouchableOpacity 
                  activeOpacity={0.7} 
                  onPress={() => navigation.navigate('recent')} 
                >
                  <Text style={styles.moreTextSmall}>More →</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.cassetteBody}>
                <View style={styles.cassetteSticker}>
                  <View style={styles.stickerHeader}>
                    <Text style={styles.stickerSide}>SIDE A</Text>
                    <Text style={styles.stickerType}>MIXTAPE</Text>
                  </View>

                  {tracks.slice(0, 3).map((item) => (
                    <TouchableOpacity
                      key={item.played_at}
                      style={styles.trackItemRow}
                      activeOpacity={0.7}
                      onPress={() =>
                        Linking.openURL(item.track.external_urls.spotify)
                      }
                    >
                      <Image
                        source={{ uri: item.track.album.images?.[0]?.url }}
                        style={styles.miniAlbumArt}
                      />

                      <View style={styles.trackTextCont}>
                        <Text style={styles.trackName} numberOfLines={1}>
                          {item.track.name}
                        </Text>
                        <Text style={styles.trackArtist} numberOfLines={1}>
                          {item.track.artists[0].name}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.cassetteReelsContainer}>
                  <View style={styles.cassetteReel}>
                    <View style={styles.reelHole} />
                  </View>

                  <View style={styles.cassetteBottomIndentation}>
                    <View style={styles.cassetteScrews} />
                    <View style={styles.cassetteScrews} />
                  </View>

                  <View style={styles.cassetteReel}>
                    <View style={styles.reelHole} />
                  </View>
                </View>
              </View>
            </View>
            </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>waiting for spotify signals</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

// ... styles giữ nguyên không thay đổi
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent', paddingHorizontal: 20 },
  logo: { width: 140, height: 45, resizeMode: 'contain', marginTop: 10, marginBottom: 20, marginLeft: -50 },
  heroSection: { flex: 1, position: 'relative' },
  vinylSide: { marginLeft: -25 },
  vinylWrapper: { position: 'relative', width: 420, height: 360 },
  bigVinylContainer: { width: 330, height: 330, borderRadius: 165, backgroundColor: '#050505', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.3, shadowRadius: 25, elevation: 20 },
  groove: { position: 'absolute', borderWidth: 0.5, borderColor: '#161616' },
  bigVinylArt: { width: 130, height: 130, borderRadius: 65, borderWidth: 1, borderColor: '#FFF' },
  centerHole: { position: 'absolute', width: 14, height: 14, borderRadius: 7, backgroundColor: '#000', borderWidth: 2, borderColor: '#444' },
  tonearm: { position: 'absolute', top: 20, right: -30, width: 350, height: 350, resizeMode: 'contain', zIndex: 5 },
  songTitle: { marginLeft: 30, fontSize: 34, fontWeight: '800', color: '#222', width: 190 },
  songArtist: { marginTop: 4, marginLeft: 30, width: 180, color: '#777', fontSize: 16 },
  emptyCard: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#666', fontSize: 16 },
  backgroundAlbum: { position: 'absolute', width: '160%', height: '160%', left: '-30%', top: '-20%', opacity: 0.8 },
  backgroundOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(246, 244, 239, 0.49)' },
  recentBox: { marginTop: 15, marginLeft: 5, paddingRight: 5 },
  recentHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 },
  recentTitle: { fontSize: 16, fontWeight: '800', color: '#222' },
  moreTextSmall: { fontSize: 12, fontWeight: '700', color: '#444', marginBottom: 2 },
  cassetteBody: { width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.45)', borderWidth: 1.5, borderColor: 'rgba(0, 0, 0, 0.1)', borderRadius: 10, padding: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  cassetteSticker: { backgroundColor: '#FAF9F6', borderRadius: 6, padding: 8, borderWidth: 1, borderColor: '#E5E5E5' },
  stickerHeader: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1.5, borderBottomColor: '#222', paddingBottom: 2, marginBottom: 4 },
  stickerSide: { fontSize: 10, fontWeight: '900', color: '#222', letterSpacing: 1 },
  stickerType: { fontSize: 9, fontWeight: 'bold', color: '#666' },
  trackItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.1)' },
  miniAlbumArt: { width: 20, height: 20, borderRadius: 2, marginRight: 8 },
  trackTextCont: { flex: 1 },
  trackName: { fontSize: 12, fontWeight: '700', color: '#222' },
  trackArtist: { fontSize: 10, fontWeight: '500', color: '#777' },
  cassetteReelsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingHorizontal: 20 },
  cassetteReel: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#444' },
  reelHole: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#D1CFC7' },
  cassetteBottomIndentation: { width: 80, height: 14, borderTopWidth: 1.5, borderLeftWidth: 1.5, borderRightWidth: 1.5, borderColor: 'rgba(0, 0, 0, 0.1)', borderTopLeftRadius: 6, borderTopRightRadius: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10 },
  cassetteScrews: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(0,0,0,0.15)' },
});