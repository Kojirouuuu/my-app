import { useState, useEffect, useRef } from "react";
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
  Animated,
  PanResponder,
  Dimensions,
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

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH;

export default function HistoryScreen() {
  const [images, setImages] = useState<FridgeImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<FridgeImage | null>(null);
  const position = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: 0 });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          Animated.timing(position, {
            toValue: { x: SCREEN_WIDTH, y: 0 },
            duration: 250,
            useNativeDriver: false,
          }).start(() => {
            position.setValue({ x: 0, y: 0 });
          });
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          Animated.timing(position, {
            toValue: { x: -SCREEN_WIDTH, y: 0 },
            duration: 250,
            useNativeDriver: false,
          }).start(() => {
            position.setValue({ x: 0, y: 0 });
          });
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

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

  const renderImageItem = ({ item }: { item: FridgeImage }) => {
    const cardStyle = position.getLayout();
    const rotateCard = position.x.interpolate({
      inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
      outputRange: ["-120deg", "0deg", "120deg"],
    });

    return (
      <Animated.View
        style={[
          styles.imageCard,
          cardStyle,
          {
            transform: [{ translateX: position.x }, { rotate: rotateCard }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity onPress={() => setSelectedImage(item)}>
          <Image source={{ uri: item.url }} style={styles.thumbnail} />
          <View style={styles.imageInfo}>
            <View style={styles.dateContainer}>
              <Calendar size={16} color="#666" />
              <Text style={styles.dateText}>{item.uploadedAt}</Text>
            </View>
            <Text style={styles.itemsText} numberOfLines={2}>
              {item.detectedItems?.join(", ") || "No items detected"}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

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
            <X size={24} color="#fff" />
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
          numColumns={1}
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
    position: "relative",
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
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    padding: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    zIndex: 1,
  },
  modalInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalDate: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 8,
  },
  modalItems: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 24,
  },
});
