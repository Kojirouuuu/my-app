import { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { getUrl } from "aws-amplify/storage";
import { useToast } from "../contexts/ToastContext";

interface Profile {
  userId: string;
  displayName: string;
  bio: string;
  favoriteIngredients: string[];
  refrigeratorBrand: string;
}

export default function Home() {
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const { user } = useAuthenticator();
  const toast = useToast();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const userId = user.userId;

      // S3からプロフィールデータを取得
      try {
        const url = await getUrl({
          key: `profiles/${userId}.json`,
        });
        const response = await fetch(url.url);
        const profile = await response.json();
        setUserProfile(profile);
      } catch (error) {
        console.error("Error fetching profile:", error);
        setUserProfile(null);
      }
    } catch (error) {
      console.error("Error getting user:", error);
      setUserProfile(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ホーム</Text>
      {userProfile ? (
        <View>
          <Text style={styles.profileName}>{userProfile.displayName}</Text>
          <Text style={styles.bio}>{userProfile.bio}</Text>
        </View>
      ) : (
        <Text>プロフィールを設定してください</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  bio: {
    fontSize: 16,
    color: "#666",
  },
});
