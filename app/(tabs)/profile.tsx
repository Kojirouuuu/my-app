import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { Camera, X } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { uploadData, downloadData, getUrl } from "aws-amplify/storage";
import { getCurrentUser } from "aws-amplify/auth";
import { router } from "expo-router";
import { useAuth } from "@/../contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/api";
import { updateProfile } from "../../src/graphql/mutations";
import { getProfile } from "../../src/graphql/queries";
import { GraphQLResult } from "@aws-amplify/api";

const client = generateClient();

export default function ProfileScreen() {
  const { signOut: useAuthSignOut } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editedUsername, setEditedUsername] = useState("");
  const [editedBio, setEditedBio] = useState("");
  const [bio, setBio] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [favoriteIngredients, setFavoriteIngredients] = useState<string[]>([]);
  const [favoriteIngredientsText, setFavoriteIngredientsText] = useState("");
  const [refrigeratorBrand, setRefrigeratorBrand] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const user = await getCurrentUser();
      setUsername(user.username);
      setEmail(user.username);
      setCurrentUserId(user.username);
      await loadProfileImage(user.username);
      await loadProfileData(user.username);
      await checkFollowStatus(user.username);
    } catch (error) {
      console.error("Error loading user info:", error);
    }
  };

  const checkFollowStatus = async (userId: string) => {
    try {
      const response = await fetch(
        process.env.EXPO_PUBLIC_API_URL + "/follow",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            follower_id: currentUserId,
            following_id: userId,
            action: "checkFollow",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to check follow status");
      }

      const data = await response.json();
      setIsFollowing(data.isFollowing);
    } catch (error) {
      console.error("Error checking follow status:", error);
    }
  };

  const handleFollowToggle = async () => {
    try {
      const action = isFollowing ? "unfollow" : "follow";
      const response = await fetch(
        process.env.EXPO_PUBLIC_API_URL + "/follow",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            follower_id: currentUserId,
            following_id: username,
            action,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to toggle follow status");
      }

      setIsFollowing(!isFollowing);
      toast.show(isFollowing ? "フォローを解除しました" : "フォローしました");
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast.show("フォロー状態の更新に失敗しました");
    }
  };

  const loadProfileData = async (userId: string) => {
    try {
      const path = `profile/${userId}/data.json`;
      const { url } = await getUrl({
        key: path,
        options: {
          accessLevel: "guest",
          validateObjectExistence: true,
          expiresIn: 3600,
        },
      });

      const response = await fetch(url.toString());
      if (response.ok) {
        const data = await response.json();
        setDisplayName(data.display_name || "");
        setBio(data.bio || "");
        setFavoriteIngredients(data.favorite_ingredients || []);
        setFavoriteIngredientsText(
          (data.favorite_ingredients || []).join(", ")
        );
        setRefrigeratorBrand(data.refrigerator_brand || "");

        setEditedUsername(data.display_name || "");
        setEditedBio(data.bio || "");
      }
    } catch (error: any) {
      if (error.name === "ResourceNotFoundException") {
        console.log("No profile data found");
      } else {
        console.error("Error loading profile data:", error);
      }
    }
  };

  const loadProfileImage = async (username: string) => {
    try {
      const path = `profile/${username}`;
      const { url } = await getUrl({
        key: path,
        options: {
          accessLevel: "guest",
          validateObjectExistence: true,
          expiresIn: 3600,
        },
      });
      console.log("Profile image URL:", url.toString());
      setProfileImageUri(url.toString());
    } catch (error: any) {
      if (error.name === "ResourceNotFoundException") {
        console.log("No profile image found");
        setProfileImageUri(null);
      } else {
        console.error("Error loading profile image:", error);
        setProfileImageUri(null);
      }
    }
  };

  const handleUpload = async (path: string, data: Blob) => {
    try {
      const uploadResult = await uploadData({
        key: path,
        data,
        options: {
          accessLevel: "guest",
          contentType: "image/jpeg",
          metadata: {
            uploadedBy: username || "",
            uploadedAt: new Date().toISOString(),
          },
        },
      }).result;

      console.log("Uploaded image:", uploadResult);

      if (username) {
        await loadProfileImage(username);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const handleImagePick = async () => {
    try {
      const { username } = await getCurrentUser();

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        const response = await fetch(uri);
        const blob = await response.blob();
        const path = `profile/${username}`;

        await handleUpload(path, blob);
      }
    } catch (error) {
      console.error("Error picking image:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await useAuthSignOut();
      router.replace("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleEditProfile = () => {
    setEditedUsername(displayName);
    setEditedBio(bio);
    setIsEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);
      const user = await getCurrentUser();
      const newFavoriteIngredients = favoriteIngredientsText
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      const profileData = {
        display_name: editedUsername,
        bio: editedBio,
        favorite_ingredients: newFavoriteIngredients,
        refrigerator_brand: refrigeratorBrand,
      };

      const path = `profile/${user.username}/data.json`;
      const data = new Blob([JSON.stringify(profileData)], {
        type: "application/json",
      });

      await uploadData({
        key: path,
        data,
        options: {
          accessLevel: "guest",
          contentType: "application/json",
          metadata: {
            updatedAt: new Date().toISOString(),
          },
        },
      }).result;

      setDisplayName(editedUsername);
      setBio(editedBio);
      setFavoriteIngredients(newFavoriteIngredients);
      setIsEditModalVisible(false);
      await loadProfileData(user.username);
    } catch (error) {
      console.error("Error saving profile:", error);
      Alert.alert("Error", "Failed to save profile changes");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={handleImagePick}
        >
          <View style={styles.avatarWrapper}>
            {profileImageUri ? (
              <Image
                source={{ uri: profileImageUri }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Camera size={32} color="#666" />
              </View>
            )}
          </View>
          <Text style={styles.avatarText}>Change Photo</Text>
        </TouchableOpacity>

        <Text style={styles.username}>{displayName || username || "User"}</Text>
        {currentUserId !== username && (
          <TouchableOpacity
            style={[styles.followButton, isFollowing && styles.followingButton]}
            onPress={handleFollowToggle}
          >
            <Text
              style={[
                styles.followButtonText,
                isFollowing && styles.followingButtonText,
              ]}
            >
              {isFollowing ? "フォロー中" : "フォローする"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.bio}>{bio || "Add your bio"}</Text>

        <View style={styles.infoSection}>
          <Text style={styles.infoLabel}>Favorite Ingredients:</Text>
          <Text style={styles.infoText}>
            {favoriteIngredients.length > 0
              ? favoriteIngredients.join(", ")
              : "Not set"}
          </Text>

          <Text style={styles.infoLabel}>Refrigerator Brand:</Text>
          <Text style={styles.infoText}>{refrigeratorBrand || "Not set"}</Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleEditProfile}>
          <Text style={styles.buttonText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonOutline]}
          onPress={handleSignOut}
        >
          <Text style={[styles.buttonText, styles.buttonTextOutline]}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditModalVisible}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity
                onPress={() => setIsEditModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.inputLabel}>Display Name</Text>
              <TextInput
                style={styles.input}
                value={editedUsername}
                onChangeText={setEditedUsername}
                placeholder="Enter display name"
                placeholderTextColor="#999"
              />

              <Text style={styles.inputLabel}>Bio</Text>
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={editedBio}
                onChangeText={setEditedBio}
                placeholder="Write something about yourself"
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
              />

              <Text style={styles.inputLabel}>
                Favorite Ingredients (comma-separated)
              </Text>
              <TextInput
                style={styles.input}
                value={favoriteIngredientsText}
                onChangeText={setFavoriteIngredientsText}
                placeholder="e.g., Tomato, Eggplant, Green Pepper"
                placeholderTextColor="#999"
              />

              <Text style={styles.inputLabel}>Refrigerator Brand</Text>
              <TextInput
                style={styles.input}
                value={refrigeratorBrand}
                onChangeText={setRefrigeratorBrand}
                placeholder="Enter refrigerator brand"
                placeholderTextColor="#999"
              />

              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSaveProfile}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  avatarContainer: {
    alignItems: "center",
  },
  avatarWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 2,
    borderColor: "#fff",
    overflow: "hidden",
    position: "relative",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontFamily: "Inter-Regular",
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
  username: {
    fontFamily: "Inter-Bold",
    fontSize: 24,
    marginTop: 8,
  },
  email: {
    fontFamily: "Inter-Regular",
    fontSize: 16,
    color: "#666",
    marginTop: 4,
  },
  content: {
    padding: 20,
  },
  bio: {
    fontFamily: "Inter-Regular",
    fontSize: 16,
    color: "#333",
    marginBottom: 24,
  },
  infoSection: {
    marginBottom: 24,
  },
  infoLabel: {
    fontFamily: "Inter-Bold",
    fontSize: 16,
    color: "#333",
    marginBottom: 4,
  },
  infoText: {
    fontFamily: "Inter-Regular",
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
  },
  button: {
    height: 50,
    backgroundColor: "#000",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  buttonOutline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#000",
  },
  buttonText: {
    fontFamily: "Inter-Bold",
    fontSize: 16,
    color: "#fff",
  },
  buttonTextOutline: {
    color: "#000",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: "Inter-Bold",
    fontSize: 20,
  },
  closeButton: {
    padding: 8,
  },
  modalForm: {
    maxHeight: "80%",
  },
  inputLabel: {
    fontFamily: "Inter-Bold",
    fontSize: 16,
    marginBottom: 4,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: "Inter-Regular",
    marginBottom: 16,
  },
  bioInput: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  saveButton: {
    marginTop: 20,
    marginBottom: 40,
  },
  followButton: {
    backgroundColor: "#000",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  followingButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#000",
  },
  followButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  followingButtonText: {
    color: "#000",
  },
});
