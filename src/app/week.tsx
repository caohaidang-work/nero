import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/auth';

export default function TopTab() {
  const { accessToken } = useAuth();
  const [tracks, setTracks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // State chuyển đổi giữa 1 tháng và 6 tháng
  const [currentTab, setCurrentTab] = useState<'short_term' | 'medium_term'>('short_term');
  
  // State quản lý việc hiển thị Form Mẫu (Modal) để Share
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);

  useEffect(() => {
    fetchTopTracks(currentTab);
  }, [currentTab]);

  const fetchTopTracks = async (timeRange: 'short_term' | 'medium_term') => {
    if (!accessToken) return;
    setIsLoading(true);
    
    try {
      // Sử dụng API chính thức của Spotify để tránh lỗi 404/JSON Parse
      const apiUrl = `https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=20`;
      
      const res = await fetch(apiUrl, {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      
      // 1. Kiểm tra nếu API trả về lỗi (không phải status 200 OK)
      if (!res.ok) {
        const errorText = await res.text(); 
        console.error(`Lỗi API (${res.status}):`, errorText);
        setIsLoading(false);
        return; 
      }

      // 2. Phân tích dữ liệu JSON khi đã chắc chắn gọi thành công
      const data = await res.json();
      
      if (data.items) {
        const normalized = data.items.map((i: any) => ({
          id: i.id,
          name: i.name,
          artist: i.artists[0].name,
          albumUrl: i.album.images[0].url,
          spotifyUrl: i.external_urls.spotify,
        }));
        setTracks(normalized);
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách Top Tracks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm xử lý việc Share sang nền tảng khác
  const onShare = async () => {
    try {
      const timeText = currentTab === 'short_term' ? 'Recent Faves' : 'All Time Feels';
      
      // Khởi tạo nội dung văn bản để chia sẻ
      let message = `🎵 My Top Tracks - ${timeText} 🎵\n\n`;
      
      // Lấy top 5 bài đầu tiên để share
      tracks.slice(0, 5).forEach((track, index) => {
        message += `${index + 1}. ${track.name} - ${track.artist}\n`;
      });
      
      message += `\nCheck out my music taste!`;

      // Kích hoạt bảng share native của điện thoại (iOS/Android)
      await Share.share({
        message: message,
      });
      
      // Đóng modal preview sau khi gọi Share xong
      setIsShareModalVisible(false);
    } catch (error) {
      console.error('Lỗi khi chia sẻ:', error);
    }
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => (
    <TouchableOpacity style={styles.trackItem} onPress={() => Linking.openURL(item.spotifyUrl)}>
      <Text style={styles.rankText}>#{index + 1}</Text>
      <Image source={{ uri: item.albumUrl }} style={styles.albumArt} />
      <View style={styles.trackInfo}>
        <Text style={styles.trackName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.artistName} numberOfLines={1}>{item.artist}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER: LOGO & NÚT SHARE */}
      <View style={styles.headerContainer}>
        <Image source={require('../../assets/images/logo.png')} style={styles.logo} /> 
        <TouchableOpacity 
          style={[styles.headerShareButton, tracks.length === 0 && { opacity: 0.5 }]} 
          onPress={() => setIsShareModalVisible(true)}
          disabled={tracks.length === 0} // Vô hiệu hóa nếu chưa có bài hát nào
        >
          <Text style={styles.headerShareText}>Share</Text>
        </TouchableOpacity>
      </View>
      
      {/* THANH CHUYỂN ĐỔI TAB */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, currentTab === 'short_term' && styles.activeTab]}
          onPress={() => setCurrentTab('short_term')}
        >
          <Text style={[styles.tabText, currentTab === 'short_term' && styles.activeTabText]}>recent faves</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, currentTab === 'medium_term' && styles.activeTab]}
          onPress={() => setCurrentTab('medium_term')}
        >
          <Text style={[styles.tabText, currentTab === 'medium_term' && styles.activeTabText]}>all time feels</Text>
        </TouchableOpacity>
      </View>

      {/* DANH SÁCH BÀI HÁT */}
      {isLoading ? (
        <ActivityIndicator size="large" color="#1DB954" style={{ marginTop: 50 }} />
      ) : (
        <FlatList 
          data={tracks} 
          keyExtractor={(item) => item.id} 
          renderItem={renderItem} 
          contentContainerStyle={styles.list} 
          showsVerticalScrollIndicator={false} 
        />
      )}

      {/* MODAL (FORM PREVIEW) TRƯỚC KHI SHARE */}
      <Modal
        visible={isShareModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsShareModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Share Your Taste</Text>
            
            {/* Box hiển thị trước nội dung */}
            <View style={styles.previewBox}>
              <Text style={styles.previewTitle}>
                {currentTab === 'short_term' ? 'Recent Faves' : 'All Time Feels'}
              </Text>
              <ScrollView>
                {tracks.slice(0, 5).map((item, index) => (
                  <Text key={item.id} style={styles.previewTrackText} numberOfLines={1}>
                    {index + 1}. {item.name} - <Text style={{color: '#b3b3b3'}}>{item.artist}</Text>
                  </Text>
                ))}
              </ScrollView>
            </View>

            {/* Các nút hành động trong Modal */}
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => setIsShareModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.confirmShareBtn} 
                onPress={onShare}
              >
                <Text style={styles.confirmShareBtnText}>Share Ngay</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FB', paddingHorizontal: 20 },
  
  // Header styles
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, marginBottom: 15 },
  logo: { width: 140, height: 45, resizeMode: 'contain', marginLeft: -50 },
  headerShareButton: { backgroundColor: '#1DB954', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  headerShareText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  
  // Tab styles
  tabContainer: { flexDirection: 'row', backgroundColor: '#282828', borderRadius: 8, padding: 4, marginBottom: 20 },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  activeTab: { backgroundColor: '#404040' },
  tabText: { color: '#b3b3b3', fontSize: 14, fontWeight: 'bold' },
  activeTabText: { color: 'white' },
  
  // List styles
  list: { paddingBottom: 100 },
  trackItem: { backgroundColor: '#282828', padding: 10, borderRadius: 8, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  rankText: { color: '#1DB954', fontSize: 16, fontWeight: 'bold', marginRight: 15, width: 30, textAlign: 'center' },
  albumArt: { width: 50, height: 50, borderRadius: 6, marginRight: 15 },
  trackInfo: { flex: 1 },
  trackName: { color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  artistName: { color: '#b3b3b3', fontSize: 14 },

  // Modal Styles (Form Preview)
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#282828', borderRadius: 12, padding: 20, alignItems: 'center' },
  modalTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  previewBox: { width: '100%', backgroundColor: '#404040', padding: 15, borderRadius: 8, marginBottom: 20, maxHeight: 200 },
  previewTitle: { color: '#1DB954', fontSize: 16, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  previewTrackText: { color: 'white', fontSize: 14, marginBottom: 8 },
  modalActions: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 20, backgroundColor: 'transparent', borderRadius: 8 },
  cancelBtnText: { color: '#b3b3b3', fontSize: 16, fontWeight: 'bold' },
  confirmShareBtn: { paddingVertical: 12, paddingHorizontal: 20, backgroundColor: '#1DB954', borderRadius: 8 },
  confirmShareBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});