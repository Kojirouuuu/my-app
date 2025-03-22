import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { getCurrentUser } from "aws-amplify/auth";
import { useToast } from "@/contexts/ToastContext";

interface FollowingUser {
  following_id: string;
  display_name: string;
  bio: string;
  refrigerator_brand: string;
  latest_fridge_image: string;
}

export default function FollowingScreen() {
  const [following, setFollowing] = useState<FollowingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    loadFollowing();
  }, []);

  const loadFollowing = async () => {
    try {
      setIsLoading(true);
      const { username } = await getCurrentUser();

      const response = await fetch(
        process.env.EXPO_PUBLIC_API_URL + "/follow",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            follower_id: username,
            action: "getFollowing",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch following users");
      }

      const data = await response.json();
      setFollowing(data.following);
    } catch (error) {
      console.error("Error loading following:", error);
      toast.show("フォローしているユーザーの取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const renderItem = ({ item }: { item: FollowingUser }) => (
    <TouchableOpacity style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.display_name}</Text>
        <Text style={styles.userBio}>{item.bio}</Text>
        <Text style={styles.refrigeratorBrand}>
          冷蔵庫: {item.refrigerator_brand}
        </Text>
      </View>
      {item.latest_fridge_image && (
        <Image
          source={{ uri: item.latest_fridge_image }}
          style={styles.fridgeImage}
          resizeMode="cover"
        />
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>フォローしているユーザー</Text>
      <FlatList
        data={following}
        renderItem={renderItem}
        keyExtractor={(item) => item.following_id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  listContainer: {
    padding: 20,
  },
  userCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    marginBottom: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  userBio: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  refrigeratorBrand: {
    fontSize: 14,
    color: "#888",
  },
  fridgeImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
  },
});
