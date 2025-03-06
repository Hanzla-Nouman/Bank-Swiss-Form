import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { launchImageLibrary } from "react-native-image-picker";
import TextRecognition from "@react-native-ml-kit/text-recognition";

export default function App() {
  const [imageUri, setImageUri] = useState(null);
  const [recognizedText, setRecognizedText] = useState("");
  const [enhancedText, setEnhancedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);

  const pickImageFromGallery = async () => {
    const options = { mediaType: "photo", quality: 1 };
    launchImageLibrary(options, async (response) => {
      if (response.didCancel) {
        Alert.alert("Cancelled", "Image selection was cancelled.");
      } else if (response.errorMessage) {
        Alert.alert("Error", response.errorMessage);
      } else {
        const imagePath = response.assets[0].uri;
        setImageUri(imagePath);
        setRecognizedText("");
        setEnhancedText("");
        recognizeText(imagePath);
      }
    });
  };

  const recognizeText = async (imagePath) => {
    try {
      setIsLoading(true);
      const result = await TextRecognition.recognize(imagePath);
      setRecognizedText(result.text);
    } catch (error) {
      Alert.alert("Error", "Failed to recognize text.");
    } finally {
      setIsLoading(false);
    }
  };

  const enhanceTextWithOpenAI = async () => {
    try {
      if (!recognizedText) {
        Alert.alert("Error", "No text to enhance.");
        return;
      }

      setIsEnhancing(true);
      const apiKey = "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"; // Replace with your OpenAI API Key

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "return the code declaration and refernec number" },
            { role: "user", content: recognizedText },
          ],
        }),
      });

      const data = await response.json();
      setEnhancedText(data.choices?.[0]?.message?.content || "Enhancement failed.");
    } catch (error) {
      Alert.alert("Error", "Failed to enhance text.");
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll}>
        <Text style={styles.heading}>GeTax</Text>
        <View style={styles.contentBox}>
          {imageUri ? (
            <>
              <Image source={{ uri: imageUri }} style={styles.image} />

              {isLoading ? (
                <ActivityIndicator size="large" color="white" />
              ) : (
                <>
                <Text style={styles.textRecognized}>Recognized Text: </Text>
                <Text style={styles.text}> {recognizedText || "No text recognized"}</Text>
                </>
              )}

              {recognizedText ? (
                <>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={enhanceTextWithOpenAI}
                    disabled={isEnhancing}
                  >
                    {isEnhancing ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.buttonText}>Enhance Text</Text>
                    )}
                  </TouchableOpacity>

                  {enhancedText ? (
                    <Text style={styles.text}>Enhanced Text: {enhancedText}</Text>
                  ) : null}
                </>
              ) : null}

              <TouchableOpacity style={styles.button} onPress={() => setImageUri(null)}>
                <Text style={styles.buttonText}>Choose Another Image</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.button} onPress={pickImageFromGallery}>
              <Text style={styles.buttonText}>Pick Image from Gallery</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({

  container: { flex: 1, backgroundColor: "#192f6a", paddingTop: 40 },
  heading: { fontSize: 32, fontWeight: "bold", textAlign: "center", color: "white", marginBottom: 20 },
  contentBox: { backgroundColor: "rgba(255, 255, 255, 0.2)", borderRadius: 15, padding: 20, marginHorizontal: 20 },
  image: { width: 300, height: 300, marginBottom: 20, alignSelf: "center", borderRadius: 10 },
  textRecognized: { fontSize: 20, textAlign: "left", color: "white", fontWeight:"bold" },
  text: { fontSize: 16, textAlign: "left", color: "white", marginBottom: 20, paddingHorizontal: 5 },
  button: { backgroundColor: "#ff8c00", padding: 12, borderRadius: 10, alignItems: "center", marginVertical: 10 },
  buttonText: { color: "white", fontSize: 18, fontWeight: "bold" },
  scroll: { paddingHorizontal: 20, paddingBottom: 30 },
});
