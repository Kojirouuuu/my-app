import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { getCurrentUser } from "aws-amplify/auth";
import { list, getUrl } from "aws-amplify/storage";
import { format } from "date-fns";
import {
  Calendar,
  Image as ImageIcon,
  Search,
  User,
} from "lucide-react-native";

interface FridgeImage {
  key: string;
  uploadedAt: string;
  url: string;
  detectedItems?: string[];
  username?: string;
}

interface UserProfile {
  username: string;
  name?: string;
  bio?: string;
  avatar?: string;
}

export default function ExploreScreen() {
  const [images, setImages] = useState<FridgeImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadFridgeImages();
  }, []);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      // S3からユーザーリストを取得
      const { items } = await list({
        prefix: "fridge-contents/",
      });

      // ユーザー名の一覧を取得（重複を除去）
      const uniqueUsernames = Array.from(
        new Set(items.map((item) => item.key.split("/")[1]))
      );

      // 検索クエリに一致するユーザーをフィルタリング
      const matchingUsernames = uniqueUsernames.filter((username) =>
        username.toLowerCase().includes(query.toLowerCase())
      );

      // ユーザーごとの投稿数を取得
      const userPostCounts = matchingUsernames.map((username) => {
        const userPosts = items.filter(
          (item) => item.key.split("/")[1] === username
        );
        return {
          username,
          postCount: userPosts.length,
        };
      });

      // ユーザープロフィール情報を生成
      const userProfiles = userPostCounts.map(({ username, postCount }) => ({
        username,
        name: username,
        bio: `${postCount}件の投稿があります`,
      }));

      setSearchResults(userProfiles);
    } catch (error) {
      console.error("Error searching users:", error);
      Alert.alert("Error", "Failed to search users");
    } finally {
      setIsSearching(false);
    }
  };

  const loadFridgeImages = async () => {
    try {
      setIsLoading(true);
      const { username } = await getCurrentUser();

      // S3から画像リストを取得
      const { items } = await list({
        prefix: "fridge-contents/",
      });

      // 画像URLと日付情報を取得
      const imagePromises = items.map(async (item) => {
        const { url } = await getUrl({
          key: item.key,
          options: {
            accessLevel: "guest",
            validateObjectExistence: true,
            expiresIn: 3600,
          },
        });

        // ファイル名から日付とユーザー名を抽出
        const parts = item.key.split("/");
        const username = parts[1];
        const dateStr = parts[2].split("_")[0];
        const formattedDate = format(
          new Date(
            parseInt(dateStr.substring(0, 4)),
            parseInt(dateStr.substring(4, 6)) - 1,
            parseInt(dateStr.substring(6, 8))
          ),
          "yyyy/MM/dd"
        );

        return {
          key: item.key,
          uploadedAt: formattedDate,
          url: url.toString(),
          username,
          // TODO: 検出アイテムをAPIから取得
          detectedItems: ["apple", "milk", "bread"],
        };
      });

      const imageList = await Promise.all(imagePromises);
      // 日付の新しい順にソート
      setImages(
        imageList.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
      );
    } catch (error) {
      console.error("Error loading fridge images:", error);
      Alert.alert("Error", "Failed to load fridge images");
    } finally {
      setIsLoading(false);
    }
  };

  const renderUserItem = ({ item }: { item: UserProfile }) => (
    <TouchableOpacity style={styles.userCard}>
      <View style={styles.userAvatarContainer}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.userAvatar} />
        ) : (
          <View style={styles.userAvatarPlaceholder}>
            <User size={24} color="#666" />
          </View>
        )}
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name || item.username}</Text>
        <Text style={styles.userUsername}>@{item.username}</Text>
        {item.bio && <Text style={styles.userBio}>{item.bio}</Text>}
      </View>
    </TouchableOpacity>
  );

  const renderImageItem = ({ item }: { item: FridgeImage }) => (
    <TouchableOpacity style={styles.imageCard}>
      <Image source={{ uri: item.url }} style={styles.thumbnail} />
      <View style={styles.imageInfo}>
        <View style={styles.dateContainer}>
          <Calendar size={16} color="#666" />
          <Text style={styles.dateText}>{item.uploadedAt}</Text>
        </View>
        <Text style={styles.usernameText}>@{item.username}</Text>
        <Text style={styles.itemsText} numberOfLines={2}>
          {item.detectedItems?.join(", ") || "No items detected"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading explore feed...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="ユーザーを検索"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              handleSearch(text);
            }}
          />
        </View>
      </View>

      {searchQuery ? (
        <FlatList
          data={searchResults}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.username}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            isSearching ? (
              <View style={styles.emptyContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.emptyText}>検索中...</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Search size={48} color="#666" />
                <Text style={styles.emptyText}>ユーザーが見つかりません</Text>
              </View>
            )
          }
        />
      ) : (
        <FlatList
          data={images}
          renderItem={renderImageItem}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ImageIcon size={48} color="#666" />
              <Text style={styles.emptyText}>投稿がありません</Text>
            </View>
          }
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  searchContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  listContainer: {
    padding: 16,
  },
  imageCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    overflow: "hidden",
    marginBottom: 16,
  },
  thumbnail: {
    width: "100%",
    height: 300,
    backgroundColor: "#f5f5f5",
  },
  imageInfo: {
    padding: 12,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  dateText: {
    marginLeft: 4,
    fontSize: 12,
    color: "#666",
  },
  usernameText: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "600",
    marginBottom: 4,
  },
  itemsText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  userAvatarContainer: {
    marginRight: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  userUsername: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  userBio: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
});
