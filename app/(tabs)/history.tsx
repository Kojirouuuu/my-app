import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useEffect, useState } from "react";
import { list, getUrl } from "aws-amplify/storage";
import { getCurrentUser } from "aws-amplify/auth";
import { router } from "expo-router";

interface FridgeImage {
  key: string;
  url: string;
  lastModified: string | Date;
  detectionResult?: {
    items: {
      item_name: string;
      confidence: number;
    }[];
  };
}

export default function HistoryScreen() {
  const [images, setImages] = useState<FridgeImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const { username } = await getCurrentUser();

      // 冷蔵庫の画像を取得
      const { items } = await list({
        prefix: `fridge-contents/${username}/`,
      });

      // 最新順にソート
      const sortedItems = items.sort((a, b) => {
        const dateA = a.lastModified ? new Date(a.lastModified).getTime() : 0;
        const dateB = b.lastModified ? new Date(b.lastModified).getTime() : 0;
        return dateB - dateA;
      });

      // 画像URLを取得
      const imagesWithUrls = await Promise.all(
        sortedItems.map(async (item) => {
          const { url } = await getUrl({
            key: item.key,
            options: {
              accessLevel: "guest",
              validateObjectExistence: true,
              expiresIn: 3600,
            },
          });

          // 対応する検出結果のJSONファイルを取得
          const jsonKey = item.key.replace(".jpg", ".json");
          try {
            const { url: jsonUrl } = await getUrl({
              key: jsonKey,
              options: {
                accessLevel: "guest",
                validateObjectExistence: true,
                expiresIn: 3600,
              },
            });

            const response = await fetch(jsonUrl.toString());
            if (response.ok) {
              const data = await response.json();
              return {
                key: item.key,
                url: url.toString(),
                lastModified: item.lastModified || "",
                detectionResult: data,
              };
            }
          } catch (error) {
            console.log("No detection result found for:", jsonKey);
          }

          return {
            key: item.key,
            url: url.toString(),
            lastModified: item.lastModified || "",
          };
        })
      );

      setImages(imagesWithUrls);
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading history...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Fridge History</Text>
      {images.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No history available</Text>
        </View>
      ) : (
        <View style={styles.gridContainer}>
          {images.map((image, index) => (
            <View key={index} style={styles.gridItem}>
              <Image
                source={{ uri: image.url }}
                style={styles.fridgeImage}
                resizeMode="cover"
              />
              <View style={styles.itemInfo}>
                <Text style={styles.dateText} numberOfLines={1}>
                  {formatDate(image.lastModified.toString())}
                </Text>
                {image.detectionResult && (
                  <Text style={styles.itemCount}>
                    {image.detectionResult.items.length} items
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const { width } = Dimensions.get("window");
const itemWidth = width / 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 8,
  },
  title: {
    fontFamily: "Inter-Bold",
    fontSize: 24,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#ffffff",
  },
  loadingText: {
    fontFamily: "Inter-Regular",
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontFamily: "Inter-Regular",
    fontSize: 16,
    color: "#666",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 1,
  },
  gridItem: {
    width: itemWidth,
    aspectRatio: 1,
    backgroundColor: "#ffffff",
  },
  fridgeImage: {
    width: "100%",
    height: "100%",
  },
  itemInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 4,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  dateText: {
    fontFamily: "Inter-Regular",
    fontSize: 12,
    color: "#ffffff",
  },
  itemCount: {
    fontFamily: "Inter-Regular",
    fontSize: 10,
    color: "#ffffff",
    opacity: 0.8,
  },
});
