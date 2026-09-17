import { BlurView } from 'expo-blur';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Modal,
  Platform,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/auth';

const { width } = Dimensions.get('window');

type TimeRangeType = 'short_term' | 'medium_term';

export default function TopTab() {
  const { accessToken } = useAuth();
  
  // Dữ liệu riêng biệt cho cả 2 mục để làm preview trên Card
  const [shortTracks, setShortTracks] = useState<any[]>([]);
  const [mediumTracks, setMediumTracks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Quản lý cửa sổ mở danh sách riêng biệt
  const [selectedRange, setSelectedRange] = useState<TimeRangeType | null>(null);

  useEffect(() => {
    fetchAllTopTracks();
  }, [accessToken]);

  const fetchAllTopTracks = async () => {
    if (!accessToken) return;
    setIsLoading(true);

    try {
      // Tải song song cả 2 mục
      const [resShort, resMedium] = await Promise.all([
        fetch('https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=20', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch('https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=20', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      if (resShort.ok) {
        const dataShort = await resShort.json();
        if (dataShort.items) {
          setShortTracks(
            dataShort.items.map((i: any) => ({
              id: i.id,
              name: i.name,
              artist: i.artists[0].name,
              albumUrl: i.album.images[0]?.url,
              spotifyUrl: i.external_urls.spotify,
            }))
          );
        }
      }

      if (resMedium.ok) {
        const dataMedium = await resMedium.json();
        if (dataMedium.items) {
          setMediumTracks(
            dataMedium.items.map((i: any) => ({
              id: i.id,
              name: i.name,
              artist: i.artists[0].name,
              albumUrl: i.album.images[0]?.url,
              spotifyUrl: i.external_urls.spotify,
            }))
          );
        }
      }
    } catch (error) {
      console.error('Lỗi lấy dữ liệu Top Tracks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onShare = async () => {
    if (!selectedRange) return;
    const activeList = selectedRange === 'short_term' ? shortTracks : mediumTracks;
    const timeText = selectedRange === 'short_term' ? 'Recent Faves' : 'All Time Feels';

    try {
      let message = `🎵 My Top Tracks - ${timeText} 🎵\n\n`;
      activeList.slice(0, 5).forEach((track, index) => {
        message += `${index + 1}. ${track.name} - ${track.artist}\n`;
      });
      message += `\nShared via Spotify Tracker`;

      await Share.share({ message });
    } catch (error) {
      console.error('Lỗi chia sẻ:', error);
    }
  };

  const renderTrackItem = ({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity
      style={styles.detailTrackItem}
      activeOpacity={0.8}
      onPress={() => Linking.openURL(item.spotifyUrl)}
    >
      <View style={styles.miniCdCase}>
        <Image source={{ uri: item.albumUrl }} style={styles.miniCdImage} />
        <View style={styles.miniCdCenterRing}>
          <View style={styles.miniCdHole} />
        </View>
      </View>

      <View style={styles.trackDetails}>
        <View style={styles.trackTitleRow}>
          <Text style={styles.rankNum}>#{String(index + 1).padStart(2, '0')}</Text>
          <Text style={styles.trackTitleText} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
        <Text style={styles.trackArtistText} numberOfLines={1}>
          {item.artist}
        </Text>
      </View>

      <Text style={styles.playArrow}>↗</Text>
    </TouchableOpacity>
  );

  const activeModalTracks = selectedRange === 'short_term' ? shortTracks : mediumTracks;
  const backgroundAlbum = shortTracks[0]?.albumUrl || mediumTracks[0]?.albumUrl;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* LỚP NỀN BLUR TỔNG THỂ */}
      {backgroundAlbum && (
        <>
          <Image
            source={{ uri: backgroundAlbum }}
            style={styles.backgroundAlbum}
            blurRadius={5}
          />
          <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
        </>
      )}
      <View style={styles.backgroundOverlay} />

      {/* HEADER CHÍNH */}
      <View style={styles.headerContainer}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
        />
        <View style={styles.vaultTag}>
          <Text style={styles.vaultTagText}>INSIGHTS HUB</Text>
        </View>
      </View>

      <Text style={styles.sectionHeader}>TASTE ARCHIVE</Text>
      <Text style={styles.sectionSubHeader}>Select an era to explore your listening stats</Text>

      {/* KHU VỰC 2 CỤC SUMMARY LỰA CHỌN */}
      {isLoading ? (
        <ActivityIndicator size="large" color="#1A1815" style={{ marginTop: 80 }} />
      ) : (
        <View style={styles.hubWrapper}>
          {/* CỤC 1: RECENT FAVES */}
          <TouchableOpacity
            style={styles.hubCard}
            activeOpacity={0.9}
            onPress={() => setSelectedRange('short_term')}
          >
            <BlurView intensity={35} tint="light" style={StyleSheet.absoluteFill} />
            <View style={styles.cardHeader}>
              <Text style={styles.cardIndex}>VOL. 01</Text>
              <View style={styles.timeBadge}>
                <Text style={styles.timeBadgeText}>LAST 4 WEEKS</Text>
              </View>
            </View>

            <View style={styles.cardVisualRow}>
              <View style={styles.cardDiscBox}>
                <Image
                  source={{ uri: shortTracks[0]?.albumUrl || 'https://via.placeholder.com/200' }}
                  style={styles.cardDiscImg}
                />
                <View style={styles.discSpindleRing} />
              </View>
              <View style={styles.cardTextContent}>
                <Text style={styles.cardMainTitle}>RECENT FAVES</Text>
                <Text style={styles.cardTopArtist} numberOfLines={1}>
                  Top: {shortTracks[0]?.name || 'Loading...'}
                </Text>
                <Text style={styles.cardCountText}>{shortTracks.length} TRACKS ARCHIVED</Text>
              </View>
            </View>

            <View style={styles.cardActionRow}>
              <Text style={styles.cardExploreText}>EXPLORE TRACKLIST</Text>
              <Text style={styles.arrowRight}>→</Text>
            </View>
          </TouchableOpacity>

          {/* CỤC 2: ALL TIME FEELS */}
          <TouchableOpacity
            style={[styles.hubCard, styles.hubCardSecondary]}
            activeOpacity={0.9}
            onPress={() => setSelectedRange('medium_term')}
          >
            <BlurView intensity={35} tint="light" style={StyleSheet.absoluteFill} />
            <View style={styles.cardHeader}>
              <Text style={styles.cardIndex}>VOL. 02</Text>
              <View style={[styles.timeBadge, styles.timeBadgeAlt]}>
                <Text style={styles.timeBadgeText}>LAST 6 MONTHS</Text>
              </View>
            </View>

            <View style={styles.cardVisualRow}>
              <View style={styles.cardDiscBox}>
                <Image
                  source={{ uri: mediumTracks[0]?.albumUrl || 'https://via.placeholder.com/200' }}
                  style={styles.cardDiscImg}
                />
                <View style={styles.discSpindleRing} />
              </View>
              <View style={styles.cardTextContent}>
                <Text style={styles.cardMainTitle}>ALL TIME FEELS</Text>
                <Text style={styles.cardTopArtist} numberOfLines={1}>
                  Top: {mediumTracks[0]?.name || 'Loading...'}
                </Text>
                <Text style={styles.cardCountText}>{mediumTracks.length} TRACKS ARCHIVED</Text>
              </View>
            </View>

            <View style={styles.cardActionRow}>
              <Text style={styles.cardExploreText}>EXPLORE TRACKLIST</Text>
              <Text style={styles.arrowRight}>→</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* CỬA SỔ RIÊNG BIỆT (MODAL CHI TIẾT) */}
      <Modal
        visible={selectedRange !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedRange(null)}
      >
        <SafeAreaView style={styles.detailContainer}>
          <StatusBar barStyle="dark-content" />

          {/* Header Cửa Sổ Riêng */}
          <View style={styles.detailHeaderRow}>
            <TouchableOpacity
              style={styles.closeRoundBtn}
              onPress={() => setSelectedRange(null)}
              activeOpacity={0.7}
            >
              <Text style={styles.closeBtnText}>✕ CLOSE</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.detailShareBtn} onPress={onShare} activeOpacity={0.7}>
              <Text style={styles.detailShareText}>SHARE ↗</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.detailTitleBox}>
            <Text style={styles.detailSuperText}>
              {selectedRange === 'short_term' ? 'ERA // LAST 4 WEEKS' : 'ERA // LAST 6 MONTHS'}
            </Text>
            <Text style={styles.detailHeaderTitle}>
              {selectedRange === 'short_term' ? 'RECENT FAVES' : 'ALL TIME FEELS'}
            </Text>
          </View>

          {/* Danh Sách Bài Hát Riêng Biệt */}
          <FlatList
            data={activeModalTracks}
            keyExtractor={(item) => item.id}
            renderItem={renderTrackItem}
            contentContainerStyle={styles.detailListContent}
            showsVerticalScrollIndicator={false}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent', paddingHorizontal: 16 },

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

  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 6,
  },
  logo: { width: 140, height: 45, resizeMode: 'contain', marginLeft: -50 },
  vaultTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  vaultTagText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace',
    fontSize: 9.5,
    fontWeight: '800',
    color: '#3A3630',
  },

  sectionHeader: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace',
    fontSize: 18,
    fontWeight: '900',
    color: '#1A1815',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  sectionSubHeader: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 10.5,
    color: '#6B665E',
    marginBottom: 16,
    marginTop: 2,
  },

  // KHU VỰC 2 CỤC SUMMARY (HUB CARDS)
  hubWrapper: {
    gap: 16,
    paddingBottom: 110,
  },
  hubCard: {
    width: '100%',
    height: 168,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    padding: 14,
    justifyContent: 'space-between',
    overflow: 'hidden',
    shadowColor: '#2B261D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  hubCardSecondary: {
    backgroundColor: 'rgba(250, 247, 240, 0.45)',
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardIndex: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace',
    fontSize: 11,
    fontWeight: '800',
    color: '#8A8275',
  },
  timeBadge: {
    backgroundColor: '#1A1815',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  timeBadgeAlt: {
    backgroundColor: '#3E3B36',
  },
  timeBadgeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace',
    fontSize: 8.5,
    color: '#FFF',
  },

  cardVisualRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardDiscBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#D1D3D8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    marginRight: 14,
  },
  cardDiscImg: {
    width: '100%',
    height: '100%',
    borderRadius: 34,
  },
  discSpindleRing: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: '#BBBEC4',
  },

  cardTextContent: {
    flex: 1,
  },
  cardMainTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace',
    fontSize: 17,
    fontWeight: '900',
    color: '#1A1815',
    letterSpacing: -0.4,
  },
  cardTopArtist: {
    fontSize: 12,
    fontWeight: '600',
    color: '#656056',
    marginTop: 2,
  },
  cardCountText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 9.5,
    color: '#8A8275',
    marginTop: 4,
  },

  cardActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.8,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
    paddingTop: 8,
  },
  cardExploreText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace',
    fontSize: 10,
    fontWeight: '800',
    color: '#1A1815',
    letterSpacing: 0.5,
  },
  arrowRight: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A1815',
  },

  // CỬA SỔ CHI TIẾT (DETAIL VIEW MODAL)
  detailContainer: {
    flex: 1,
    backgroundColor: '#F7F5F0',
    paddingHorizontal: 16,
  },
  detailHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  closeRoundBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: 'rgba(0, 0, 0, 0.07)',
    borderRadius: 20,
  },
  closeBtnText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace',
    fontSize: 11,
    fontWeight: '800',
    color: '#333',
  },
  detailShareBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#1A1815',
    borderRadius: 20,
  },
  detailShareText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace',
    fontSize: 11,
    fontWeight: '800',
    color: '#FFF',
  },

  detailTitleBox: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  detailSuperText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 10,
    color: '#8A8275',
    letterSpacing: 0.8,
  },
  detailHeaderTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace',
    fontSize: 22,
    fontWeight: '900',
    color: '#1A1815',
    letterSpacing: -0.5,
    marginTop: 2,
  },

  detailListContent: {
    paddingBottom: 40,
  },
  detailTrackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  miniCdCase: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0E2E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  miniCdImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  miniCdCenterRing: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniCdHole: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#444',
  },
  trackDetails: {
    flex: 1,
  },
  trackTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankNum: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace',
    fontSize: 12,
    fontWeight: '800',
    color: '#8A8275',
    marginRight: 6,
  },
  trackTitleText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1815',
  },
  trackArtistText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#6F6A60',
    marginTop: 2,
  },
  playArrow: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8A8275',
    marginLeft: 8,
  },
});