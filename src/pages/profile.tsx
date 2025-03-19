import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { getUrl, uploadData } from "aws-amplify/storage";
import { useToast } from "../contexts/ToastContext";

interface Profile {
  userId: string;
  displayName: string;
  bio: string;
  favoriteIngredients: string[];
  refrigeratorBrand: string;
}

export default function Profile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const { user } = useAuthenticator();
  const toast = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const userId = user.userId;

      // S3からプロフィールデータを取得
      try {
        const url = await getUrl({
          key: `profiles/${userId}.json`,
        });
        const response = await fetch(url.url);
        const profile = await response.json();
        setProfile(profile);
      } catch (error) {
        // プロフィールが存在しない場合は新規作成
        const newProfile = {
          id: userId,
          cognito_user_id: userId,
          userId,
          displayName: "",
          bio: "",
          favoriteIngredients: [],
          refrigeratorBrand: "",
        };
        const result = await uploadData({
          key: `profiles/${userId}.json`,
          data: JSON.stringify(newProfile),
          options: {
            contentType: "application/json",
          },
        });
        console.log("New profile upload result:", result);

        // 保存後にデータを再取得して確認
        const url = await getUrl({
          key: `profiles/${userId}.json`,
        });
        const response = await fetch(url.url);
        const savedProfile = await response.json();
        console.log("New saved profile:", savedProfile);

        setProfile(savedProfile);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.show("プロフィールの取得に失敗しました", "error");
    }
  };

  const handleSubmit = async () => {
    try {
      const userId = user.userId;

      if (!profile) return;

      const updatedProfile = {
        id: userId,
        cognito_user_id: userId,
        userId,
        displayName: profile.displayName,
        bio: profile.bio,
        favoriteIngredients: profile.favoriteIngredients,
        refrigeratorBrand: profile.refrigeratorBrand,
      };

      // S3にプロフィールデータを保存
      const result = await uploadData({
        key: `profiles/${userId}.json`,
        data: JSON.stringify(updatedProfile),
        options: {
          contentType: "application/json",
        },
      });
      console.log("Upload result:", result);

      // 保存後にデータを再取得して確認
      const url = await getUrl({
        key: `profiles/${userId}.json`,
      });
      const response = await fetch(url.url);
      const savedProfile = await response.json();
      console.log("Saved profile:", savedProfile);

      setProfile(savedProfile);
      toast.show("プロフィールを更新しました", "success");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.show("プロフィールの更新に失敗しました", "error");
    }
  };

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text>読み込み中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>プロフィール</Text>
      <TextInput
        style={styles.input}
        value={profile.displayName}
        onChangeText={(text) => setProfile({ ...profile, displayName: text })}
        placeholder="表示名"
      />
      <TextInput
        style={styles.input}
        value={profile.bio}
        onChangeText={(text) => setProfile({ ...profile, bio: text })}
        placeholder="自己紹介"
        multiline
      />
      <TextInput
        style={styles.input}
        value={profile.refrigeratorBrand}
        onChangeText={(text) =>
          setProfile({ ...profile, refrigeratorBrand: text })
        }
        placeholder="冷蔵庫のメーカー"
      />
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>保存</Text>
      </TouchableOpacity>
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
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
