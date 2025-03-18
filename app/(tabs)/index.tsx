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

import { HelloWave } from "@/components/HelloWave";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
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
      const { username } = await getCurrentUser();

      // TODO: APIを実装して最新の検出アイテムを取得
      // 現在はモックデータを使用
      const mockItems: DetectedItem[] = [
        { item_name: "apple", confidence: 0.95, image_url: "" },
        { item_name: "milk", confidence: 0.88, image_url: "" },
        { item_name: "bread", confidence: 0.92, image_url: "" },
      ];

      setDetectedItems(mockItems);
    } catch (error) {
      console.error("Error loading items:", error);
      Alert.alert("Error", "Failed to load detected items");
    } finally {
      setIsLoadingItems(false);
    }
  };

  const getUploadPath = async (username: string) => {
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0].replace(/-/g, "");

    try {
      // Get existing images for the day
      const { items } = await list({
        prefix: `public/fridge-contents/${username}/${dateStr}`,
      });

      // Calculate next index
      const nextIndex = items.length + 1;

      return `public/fridge-contents/${username}/${dateStr}_${nextIndex}`;
    } catch (error) {
      console.error("Error getting upload count:", error);
      return `public/fridge-contents/${username}/${dateStr}_1`;
    }
  };

  const handleUploadFridgeImage = async () => {
    try {
      setIsUploading(true);
      const { username } = await getCurrentUser();

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        const response = await fetch(uri);
        const blob = await response.blob();

        const path = await getUploadPath(username);
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

        console.log("Uploaded fridge image:", uploadResult);
        setLastUploadTime(new Date().toLocaleString());
        Alert.alert("Success", "Fridge photo has been uploaded successfully.");

        // Reload detected items after upload
        await loadLatestItems();
      }
    } catch (error) {
      console.error("Error uploading fridge image:", error);
      Alert.alert("Error", "Failed to upload the photo.");
    } finally {
      setIsUploading(false);
    }
  };

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
