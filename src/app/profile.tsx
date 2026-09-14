import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/auth';

export default function ProfileTab() {
  const { accessToken } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      // Gọi API lấy thông tin Profile User
      const profRes = await fetch('https://api.spotify.com/v1/me', { headers: { Authorization: `Bearer ${accessToken}` } });
      const profData = await profRes.json();
      setProfile(profData);

      // Gọi API lấy danh sách Playlists
      const plRes = await fetch('https://api.spotify.com/v1/me/playlists?limit=20', { headers: { Authorization: `Bearer ${accessToken}` } });
      const plData = await plRes.json();
      if (plData?.items) setPlaylists(plData.items);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  // ĐÂY LÀ HÀM RENDER CHUẨN ĐÃ ĐƯỢC BỌC KỸ LƯỠNG (KÈM DẤU ? VÀ || 0)
const renderPlaylist = ({ item }: { item: any }) => {
    // ĐÃ SỬA: Tìm số lượng bài hát trong 'tracks' HOẶC trong 'items'
    const trackCount = item.tracks?.total ?? item.items?.total ?? 0;

    return (
      <TouchableOpacity style={styles.playlistItem} onPress={() => Linking.openURL(item.external_urls?.spotify || '')}>
        <Image source={{ uri: item.images?.[0]?.url || 'https://via.placeholder.com/100' }} style={styles.playlistArt} />
        <View style={styles.playlistInfo}>
          <Text style={styles.playlistName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.playlistMeta}>{trackCount} bài hát</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {isLoading || !profile ? <ActivityIndicator size="large" color="#1DB954" style={{ marginTop: 50 }} /> : (
        <>
          <View style={styles.profileHeader}>
            <Image source={{ uri: profile.images?.[1]?.url || profile.images?.[0]?.url || 'https://via.placeholder.com/150' }} style={styles.avatar} />
            <Text style={styles.userName}>{profile.display_name}</Text>
            <Text style={styles.followerCount}>{profile.followers?.total} Người theo dõi</Text>
          </View>

          <Text style={styles.sectionTitle}>ur masterpieces</Text>
          <FlatList 
            data={playlists} 
            keyExtractor={(item) => item.id} 
            renderItem={renderPlaylist} 
            contentContainerStyle={styles.list} 
            showsVerticalScrollIndicator={false} 
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#191414', paddingHorizontal: 20 },
  profileHeader: { alignItems: 'center', marginTop: 30, marginBottom: 30 },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 15 },
  userName: { color: 'white', fontSize: 26, fontWeight: 'bold' },
  followerCount: { color: '#1DB954', fontSize: 16, marginTop: 5 },
  sectionTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  list: { paddingBottom: 100 },
  playlistItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  playlistArt: { width: 65, height: 65, borderRadius: 8, marginRight: 15 },
  playlistInfo: { flex: 1, borderBottomWidth: 0.5, borderBottomColor: '#282828', paddingBottom: 10 },
  playlistName: { color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  playlistMeta: { color: '#b3b3b3', fontSize: 14 }
});