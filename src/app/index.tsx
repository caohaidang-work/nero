import { BlurView } from 'expo-blur';
import { useNavigation } from 'expo-router/react-navigation';
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
  const navigation = useNavigation<any>();

  const [tracks, setTracks] = useState<any[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const rotation = useSharedValue(0);

  // bg move
  const bgScale = useSharedValue(1);
  const bgOffset = useSharedValue(0);

  useEffect(() => {
    fetchHomeData(false);

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

  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: bgScale.value },
      { translateX: bgOffset.value },
      { translateY: bgOffset.value * 0.4 },
    ],
  }));

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
              <Text style={styles.recentTitle}>recently played</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigation.navigate('recent')}
              >
                <Text style={styles.moreTextSmall}>history</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.trackList}>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent', paddingHorizontal: 20 },
  logo: { width: 140, height: 45, resizeMode: 'contain', marginTop: 10, marginBottom: 20, marginLeft: -50 },
  heroSection: { flex: 1, position: 'relative', marginTop:-25 },
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
  
  // Recent Played Styles
  recentBox: { marginTop: 20, paddingHorizontal: 5 },
  recentHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  recentTitle: { fontSize: 18, fontWeight: '800', color: '#222' },
  moreTextSmall: { fontSize: 13, fontWeight: '700', color: '#555' },
  trackList: { gap: 10 },
  trackItemRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 8,
  },
  miniAlbumArt: { width: 42, height: 42, borderRadius: 6, marginRight: 12 },
  trackTextCont: { flex: 1 },
  trackName: { fontSize: 14, fontWeight: '700', color: '#222', marginBottom: 2 },
  trackArtist: { fontSize: 12, fontWeight: '500', color: '#666' },
});