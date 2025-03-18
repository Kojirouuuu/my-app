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
  Modal,
} from "react-native";
import { getCurrentUser } from "aws-amplify/auth";
import { list, getUrl } from "aws-amplify/storage";
import { format } from "date-fns";
import { Calendar, Image as ImageIcon, X } from "lucide-react-native";

import React from "react";

interface FridgeImage {
  key: string;
  uploadedAt: string;
  url: string;
  detectedItems?: string[];
}

export default function HistoryScreen() {
  const [images, setImages] = useState<FridgeImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<FridgeImage | null>(null);

  useEffect(() => {
    loadFridgeImages();
  }, []);

  const loadFridgeImages = async () => {
    try {
      setIsLoading(true);
      const { username } = await getCurrentUser();

      // S3から画像リストを取得
      const { items } = await list({
        prefix: `fridge-contents/${username}/`,
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

        // ファイル名から日付を抽出（YYYYMMDD_N.jpg形式）
        const dateStr = item.key.split("/")[2].split("_")[0];
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

  const renderImageItem = ({ item }: { item: FridgeImage }) => (
    <TouchableOpacity
      style={styles.imageCard}
      onPress={() => setSelectedImage(item)}
    >
      <Image source={{ uri: item.url }} style={styles.thumbnail} />
      <View style={styles.imageInfo}>
        <View style={styles.dateContainer}>
          <Calendar size={16} color="#666" />
          <Text style={styles.dateText}>{item.uploadedAt}</Text>
        </View>
        <Text style={styles.itemsText}>
          {item.detectedItems?.join(", ") || "No items detected"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const ImageDetailModal = () => (
    <Modal
      visible={!!selectedImage}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setSelectedImage(null)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedImage(null)}
          >
            <X size={24} color="#000" />
          </TouchableOpacity>

          {selectedImage && (
            <>
              <Image
                source={{ uri: selectedImage.url }}
                style={styles.modalImage}
                resizeMode="contain"
              />
              <View style={styles.modalInfo}>
                <Text style={styles.modalDate}>{selectedImage.uploadedAt}</Text>
                <Text style={styles.modalItems}>
                  Detected Items: {selectedImage.detectedItems?.join(", ")}
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading fridge history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* <Text style={styles.title}>Fridge History</Text> */}

      {images.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ImageIcon size={48} color="#666" />
          <Text style={styles.emptyText}>No fridge photos yet</Text>
        </View>
      ) : (
        <FlatList
          data={images}
          renderItem={renderImageItem}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      <ImageDetailModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  title: {
    fontFamily: "Inter-Bold",
    fontSize: 24,
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 12,
    fontFamily: "Inter-Regular",
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    fontFamily: "Inter-Regular",
    fontSize: 16,
    color: "#666",
  },
  listContainer: {
    gap: 16,
  },
  imageCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbnail: {
    width: "100%",
    height: 200,
    backgroundColor: "#f5f5f5",
  },
  imageInfo: {
    padding: 16,
    gap: 8,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateText: {
    fontFamily: "Inter-Regular",
    fontSize: 14,
    color: "#666",
  },
  itemsText: {
    fontFamily: "Inter-Regular",
    fontSize: 14,
    color: "#333",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 8,
  },
  modalImage: {
    width: "100%",
    height: 400,
    backgroundColor: "#f5f5f5",
  },
  modalInfo: {
    padding: 16,
    gap: 8,
  },
  modalDate: {
    fontFamily: "Inter-Bold",
    fontSize: 16,
  },
  modalItems: {
    fontFamily: "Inter-Regular",
    fontSize: 14,
    color: "#666",
  },
});
