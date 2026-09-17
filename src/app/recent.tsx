import { BlurView } from 'expo-blur';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
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

const { width } = Dimensions.get('window');

const COLUMN_GAP = 14;
const CONTAINER_PADDING = 16;
const CASE_SIZE = (width - CONTAINER_PADDING * 2 - COLUMN_GAP) / 2;

const getTimeAgo = (dateString: string) => {
  if (!dateString) return '';

  const past = new Date(dateString).getTime();
  if (isNaN(past)) return '';

  const now = Date.now();
  const diffSec = Math.floor((now - past) / 1000);

  if (diffSec < 60) return 'JUST NOW';

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}M AGO`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}H AGO`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}D AGO`;

  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 4) return `${diffWeek}W AGO`;

  const d = new Date(past);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export default function RecentScreen() {
  const { accessToken }: any = useAuth();
  const [tracks, setTracks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    fetchRecentTracks(false);
    fetchUserProfile();

    const interval = setInterval(() => fetchRecentTracks(true), 30000);
    return () => clearInterval(interval);
  }, [accessToken]);

  const fetchUserProfile = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUserName(data?.display_name || data?.id || '');
      }
    } catch (e) {
      console.error('Lỗi khi tải thông tin user:', e);
    }
  };

  const fetchRecentTracks = async (isBackground = false) => {
    if (!accessToken) {
      setTracks(
        Array(16).fill({
          played_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
          track: {
            id: 'sample',
            name: 'Riding on Rhythm',
            artists: [{ name: 'Y2K Mixtape' }],
            album: { images: [{ url: 'https://picsum.photos/400' }] },
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

  const renderItem = ({ item }: any) => {
    const imageUrl =
      item.track?.album?.images?.[0]?.url || 'https://via.placeholder.com/300';

    return (
      <TouchableOpacity
        style={styles.itemContainer}
        activeOpacity={0.88}
        onPress={() => Linking.openURL(item.track?.external_urls?.spotify)}
      >
        {/* 1. VỎ HỘP ACRYLIC JEWEL CASE THỰC TẾ */}
        <View style={styles.jewelCaseOuter}>
          <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />

          {/* Bản lề tròn xoay góc trái trên & dưới */}
          <View style={[styles.hingePin, styles.hingePinTop]} />
          <View style={[styles.hingePin, styles.hingePinBottom]} />

          {/* Ngàm giữ khay nhựa (Tray Clips) hai bên cạnh */}
          <View style={[styles.plasticLockClip, styles.clipLeftTop]} />
          <View style={[styles.plasticLockClip, styles.clipLeftBottom]} />
          <View style={[styles.plasticLockClip, styles.clipRightTop]} />
          <View style={[styles.plasticLockClip, styles.clipRightBottom]} />

          {/* Khung khay lồng bên trong (Tray Inset Frame) */}
          <View style={styles.trayInnerFrame}>
            {/* Gờ tròn dập chìm nơi đặt đĩa CD */}
            <View style={styles.cdDepressionWell}>
              {/* ĐĨA CD CHÍNH */}
              <View style={styles.cdDisc}>
                <Image source={{ uri: imageUrl }} style={styles.cdArtwork} />

                {/* Vệt phản quang đa sắc trên mặt đĩa */}
                <View style={styles.cdLightSheenOne} />
                <View style={styles.cdLightSheenTwo} />

                {/* Rãnh quang học ngoài cùng */}
                <View style={styles.cdMirrorRingOuter} />
                <View style={styles.cdMirrorRingInner} />

                {/* Vành kẹp trong suốt trung tâm */}
                <View style={styles.spindleClampRing}>
                  <View style={styles.innerClearRing} />

                  {/* Lỗ trục trung tâm */}
                  <View style={styles.spindleCenterHole} />

                  {/* 6 răng cưa hoa cúc kẹp đĩa (Rosette Teeth) */}
                  {[0, 60, 120, 180, 240, 300].map((deg) => (
                    <View
                      key={deg}
                      style={[
                        styles.rosetteTooth,
                        { transform: [{ rotate: `${deg}deg` }, { translateY: -11 }] },
                      ]}
                    />
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* Tem Barcode dán chéo ở mặt trước kính */}
          <View style={styles.barcodeSticker}>
            <View style={styles.barcodeLines}>
              {[2, 1, 3, 1, 2, 4, 1, 3, 1, 2, 1, 3].map((w, i) => (
                <View
                  key={i}
                  style={[
                    styles.barcodeBar,
                    { width: w * 0.7, marginRight: 0.6 },
                  ]}
                />
              ))}
            </View>
            <Text style={styles.barcodeNumber}>2 112345 678900</Text>
          </View>

          {/* Vệt bóng phản chiếu sắc cạnh trên mặt kính Acrylic */}
          <View style={styles.specularShine} />
          <View style={styles.specularEdgeHighlight} />
        </View>

        {/* 2. THÔNG TIN BÀI HÁT TỐI GIẢN PHÍA DƯỚI */}
        <View style={styles.infoContainer}>
          <Text style={styles.trackTitle} numberOfLines={1}>
            {item.track?.name}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.timeAgoText}>
              {getTimeAgo(item.played_at)}
            </Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.trackArtist} numberOfLines={1}>
              {item.track?.artists?.map((a: any) => a.name).join(', ')}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const activeTrack = tracks[0]?.track;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {activeTrack?.album?.images?.[0]?.url && (
        <>
          <Image
            source={{ uri: activeTrack.album.images[0].url }}
            style={styles.backgroundAlbum}
            blurRadius={4}
          />
          <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
        </>
      )}
      <View style={styles.backgroundOverlay} />

      <View style={styles.topHeader}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {userName ? `${userName.toUpperCase()}'S RECENTLY PLAYED` : 'RECENTLY PLAYED'}
        </Text>
        <Text style={styles.headerSubtitle}>COMPACT DISC COLLECTION</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#000" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={tracks}
          numColumns={2}
          keyExtractor={(item, index) =>
            `${item.played_at}-${item.track?.id || index}`
          }
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
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
    backgroundColor: 'rgba(246, 244, 239, 0.23)',
  },

  topHeader: {
    paddingHorizontal: CONTAINER_PADDING,
    marginTop: 8,
    marginBottom: 14,
  },
  headerTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace',
    fontSize: 13.5,
    fontWeight: '900',
    color: '#1A1815',
    letterSpacing: 0.8,
  },
  headerSubtitle: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 9,
    color: '#6F6A60',
    letterSpacing: 0.6,
    marginTop: 2,
  },

  listContent: {
    paddingHorizontal: CONTAINER_PADDING,
    paddingBottom: 110,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 18,
  },

  itemContainer: {
    width: CASE_SIZE,
  },

  jewelCaseOuter: {
    width: CASE_SIZE,
    height: CASE_SIZE,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    borderBottomColor: 'rgba(180, 180, 180, 0.4)',
    borderRightColor: 'rgba(180, 180, 180, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    position: 'relative',
    overflow: 'hidden',
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },

  hingePin: {
    position: 'absolute',
    left: 2,
    width: 5,
    height: 9,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 0.8,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    zIndex: 10,
  },
  hingePinTop: { top: 6 },
  hingePinBottom: { bottom: 6 },

  plasticLockClip: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.15)',
    zIndex: 10,
  },
  clipLeftTop: { left: 1, top: 34, width: 3, height: 10, borderRadius: 1 },
  clipLeftBottom: { left: 1, bottom: 34, width: 3, height: 10, borderRadius: 1 },
  clipRightTop: { right: 1, top: 34, width: 3, height: 10, borderRadius: 1 },
  clipRightBottom: { right: 1, bottom: 34, width: 3, height: 10, borderRadius: 1 },

  trayInnerFrame: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
    backgroundColor: 'rgba(245, 245, 245, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.65)',
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
    borderLeftColor: 'rgba(0, 0, 0, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  cdDepressionWell: {
    width: CASE_SIZE * 0.88,
    height: CASE_SIZE * 0.88,
    borderRadius: (CASE_SIZE * 0.88) / 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.12)',
    borderBottomColor: 'rgba(255, 255, 255, 0.8)',
    borderRightColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  cdDisc: {
    width: CASE_SIZE * 0.84,
    height: CASE_SIZE * 0.84,
    borderRadius: (CASE_SIZE * 0.84) / 2,
    backgroundColor: '#C5C7CC',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 0.8,
    borderColor: '#9E9FA4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  cdArtwork: {
    width: '100%',
    height: '100%',
    borderRadius: (CASE_SIZE * 0.84) / 2,
  },

  cdLightSheenOne: {
    position: 'absolute',
    width: '120%',
    height: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    transform: [{ rotate: '35deg' }],
  },
  cdLightSheenTwo: {
    position: 'absolute',
    width: '120%',
    height: '30%',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    transform: [{ rotate: '-55deg' }],
  },

  cdMirrorRingOuter: {
    position: 'absolute',
    width: '90%',
    height: '90%',
    borderRadius: 100,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  cdMirrorRingInner: {
    position: 'absolute',
    width: '74%',
    height: '74%',
    borderRadius: 100,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  spindleClampRing: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderWidth: 1.2,
    borderColor: '#A8ABB2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerClearRing: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderWidth: 0.8,
    borderColor: 'rgba(0, 0, 0, 0.15)',
  },
  spindleCenterHole: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(240, 238, 233, 0.95)',
    borderWidth: 1,
    borderColor: '#787A80',
    zIndex: 5,
  },

  rosetteTooth: {
    position: 'absolute',
    width: 2.2,
    height: 4,
    backgroundColor: '#52545A',
    borderRadius: 1,
    zIndex: 6,
  },

  barcodeSticker: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
    borderWidth: 0.5,
    borderColor: '#B8B5AE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    zIndex: 15,
  },
  barcodeLines: {
    flexDirection: 'row',
    height: 10,
    alignItems: 'stretch',
  },
  barcodeBar: {
    backgroundColor: '#111',
  },
  barcodeNumber: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 4.8,
    fontWeight: '700',
    color: '#111',
    letterSpacing: 0.3,
    marginTop: 1,
  },

  specularShine: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 35,
    height: CASE_SIZE * 1.6,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    transform: [{ rotate: '25deg' }],
    pointerEvents: 'none',
  },
  specularEdgeHighlight: {
    position: 'absolute',
    top: 2,
    left: 10,
    right: 10,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    pointerEvents: 'none',
  },

  infoContainer: {
    marginTop: 8,
    paddingHorizontal: 2,
  },
  trackTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A1815',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeAgoText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace',
    fontSize: 9,
    fontWeight: '700',
    color: '#373434',
    letterSpacing: 0.4,
  },
  metaDot: {
    marginHorizontal: 5,
    fontSize: 8,
    color: '#000000',
  },
  trackArtist: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: '#101010',
  },
});