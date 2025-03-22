import { Amplify } from "aws-amplify";
import awsconfig from "../../src/aws-exports";
import {
  Image,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { View, Text } from "react-native";
import { Camera, CheckCircle2 } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { uploadData, getUrl, list } from "aws-amplify/storage";
import { getCurrentUser } from "aws-amplify/auth";
import { useEffect } from "react";

import ParallaxScrollView from "@/../components/layouts/ParallaxScrollView";
import { useState } from "react";

Amplify.configure(awsconfig);

interface DetectedItem {
  item_name: string;
  confidence: number;
  image_url: string;
}

export default function HomeScreen() {
  const [isUploading, setIsUploading] = useState(false);
  const [lastUploadTime, setLastUploadTime] = useState<string | null>(null);
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  useEffect(() => {
    loadLatestItems();
  }, []);

  const loadLatestItems = async () => {
    try {
      setIsLoadingItems(true);
      console.info("📥 Starting to load latest items");
      const { username } = await getCurrentUser();
      console.info("👤 Current user:", username);

      // ユーザーのingredientsディレクトリから最新のJSONファイルを取得
      const { items } = await list({
        prefix: `public/ingredients/${username}/`,
      });
      console.info("📁 Found items in directory:", items.length);

      if (items.length > 0) {
        // 最新のファイルを取得（lastModifiedでソート）
        const latestFile = items.sort((a, b) => {
          const dateA = a.lastModified ? new Date(a.lastModified).getTime() : 0;
          const dateB = b.lastModified ? new Date(b.lastModified).getTime() : 0;
          return dateB - dateA;
        })[0];
        console.info("📄 Latest file:", latestFile.key);

        const { url } = await getUrl({
          key: latestFile.key,
          options: {
            accessLevel: "guest",
            validateObjectExistence: true,
            expiresIn: 3600,
          },
        });
        console.info("🔗 Generated URL for file");

        const response = await fetch(url.toString());
        if (response.ok) {
          const data = await response.json();
          console.info("📦 Parsed JSON data:", data);
          if (data.items && data.items.length > 0) {
            console.info("✅ Found valid items in data");
            setDetectedItems(data.items);
            return true; // データが取得できたことを示す
          } else {
            console.warn("⚠️ No items found in parsed data");
            return false;
          }
        } else {
          console.error("❌ Failed to fetch JSON data:", response.status);
          return false;
        }
      } else {
        console.info("📭 No items found in directory");
        setDetectedItems([]);
        return false;
      }
    } catch (error) {
      console.error("❌ Error loading items:", error);
      Alert.alert("Error", "Failed to load detected items");
      setDetectedItems([]);
      return false;
    } finally {
      setIsLoadingItems(false);
      console.info("✅ Finished loading items");
    }
  };

  const getUploadPath = async (username: string) => {
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0].replace(/-/g, "");

    try {
      // Get existing images for the day
      const { items } = await list({
        prefix: `fridge-contents/${username}/${dateStr}`,
      });

      // Calculate next index
      const nextIndex = items.length + 1;

      return `fridge-contents/${username}/${dateStr}_${nextIndex}`;
    } catch (error) {
      console.error("Error getting upload count:", error);
      return `fridge-contents/${username}/${dateStr}_1`;
    }
  };

  const handleUploadFridgeImage = async () => {
    try {
      setIsUploading(true);
      console.info("🚀 Starting fridge image upload process");
      const { username } = await getCurrentUser();
      console.info("👤 Current user:", username);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        console.info("📸 Image selected from library");
        const uri = result.assets[0].uri;
        const response = await fetch(uri);
        const blob = await response.blob();
        console.info("🔄 Image converted to blob");

        const path = await getUploadPath(username);
        console.info("📁 Generated upload path:", path);
        const timestamp = new Date().toISOString();

        const uploadResult = await uploadData({
          key: `${path}.jpg`,
          data: blob,
          options: {
            contentType: "image/jpeg",
            metadata: {
              uploadedBy: username,
              uploadedAt: timestamp,
              type: "fridge-contents",
              dayIndex: path.split("_").pop() || "1",
            },
          },
        }).result;

        console.info("✅ Upload successful:", uploadResult);
        setLastUploadTime(new Date().toLocaleString());
        Alert.alert("Success", "Fridge photo has been uploaded successfully.");

        // Lambda関数の処理完了を待つ（リトライ機能付き）
        console.info("⏳ Waiting for Lambda function to process the image...");
        let retryCount = 0;
        const maxRetries = 12; // リトライ回数を増やす
        const retryInterval = 30000; // 待機時間を30秒に増やす

        while (retryCount < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, retryInterval));
          console.info(`🔄 Retry attempt ${retryCount + 1}/${maxRetries}`);

          const success = await loadLatestItems();
          if (success) {
            console.info("✅ Successfully retrieved processed data");
            break;
          }

          retryCount++;
          if (retryCount < maxRetries) {
            console.info(
              `⏳ Waiting ${retryInterval / 1000} seconds before next retry...`
            );
          }
        }

        if (retryCount === maxRetries) {
          console.warn(
            "⚠️ Maximum retry attempts reached. Data may not be available yet."
          );
          Alert.alert(
            "Processing",
            "The image is still being processed. The results will appear automatically when ready."
          );
        }
      } else {
        console.info("❌ Image selection cancelled");
      }
    } catch (error) {
      console.error("❌ Error uploading fridge image:", error);
      Alert.alert("Error", "Failed to upload the photo.");
    } finally {
      setIsUploading(false);
      console.info("🏁 Upload process completed");
    }
  };

  // 定期的な更新を追加
  useEffect(() => {
    const interval = setInterval(() => {
      console.info("⏰ Periodic refresh of detected items (every 3 minutes)");
      loadLatestItems();
    }, 180000); // 3分ごとに更新

    return () => {
      console.info("🧹 Cleaning up periodic refresh");
      clearInterval(interval);
    };
  }, []);

  const renderDetectedItems = () => {
    if (isLoadingItems) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading detected items...</Text>
        </View>
      );
    }

    if (detectedItems.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No items detected yet</Text>
        </View>
      );
    }

    return (
      <View style={styles.detectedItemsContainer}>
        <Text style={styles.sectionTitle}>Detected Items</Text>
        {detectedItems.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <CheckCircle2 size={20} color="#4CAF50" />
            <Text style={styles.itemName}>{item.item_name}</Text>
            <Text style={styles.confidence}>
              {(item.confidence * 100).toFixed(0)}%
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/DALL·E 2025-03-18 16.52.01 - A high-contrast black and white stylized illustration of delicious food ingredients arranged on a kitchen countertop, viewed from a top-down perspecti.webp")}
          style={styles.backgroundImage}
        />
      }
    >
      <View style={styles.container}>
        <Text style={styles.title}>Manage Your Fridge Contents!</Text>
        <Text style={styles.subtitle}>
          Upload photos to track your ingredients
        </Text>

        <TouchableOpacity
          style={styles.uploadButton}
          onPress={handleUploadFridgeImage}
          disabled={isUploading}
        >
          <Camera size={32} color="#fff" />
          <Text style={styles.uploadButtonText}>
            {isUploading ? "Uploading..." : "Upload Fridge Photo"}
          </Text>
        </TouchableOpacity>

        {lastUploadTime && (
          <Text style={styles.lastUploadText}>
            Last upload: {lastUploadTime}
          </Text>
        )}

        {renderDetectedItems()}
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontFamily: "Inter-Bold",
    fontSize: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Inter-Regular",
    fontSize: 16,
    color: "#666",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4CAF50",
    padding: 20,
    borderRadius: 12,
    marginTop: 24,
    gap: 12,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Inter-Bold",
  },
  lastUploadText: {
    marginTop: 16,
    color: "#666",
    fontSize: 14,
    fontFamily: "Inter-Regular",
  },
  detectedItemsContainer: {
    width: "100%",
    marginTop: 24,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontFamily: "Inter-Bold",
    fontSize: 18,
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    gap: 12,
  },
  itemName: {
    fontFamily: "Inter-Regular",
    fontSize: 16,
    flex: 1,
    textTransform: "capitalize",
  },
  confidence: {
    fontFamily: "Inter-Regular",
    fontSize: 14,
    color: "#666",
  },
  loadingContainer: {
    width: "100%",
    marginTop: 24,
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    fontFamily: "Inter-Regular",
    fontSize: 14,
    color: "#666",
  },
  emptyContainer: {
    width: "100%",
    marginTop: 24,
    alignItems: "center",
    padding: 24,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
  },
  emptyText: {
    fontFamily: "Inter-Regular",
    fontSize: 16,
    color: "#666",
  },
});
