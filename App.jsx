import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';

import {launchImageLibrary} from 'react-native-image-picker';
import TextRecognition from '@react-native-ml-kit/text-recognition';
export default function App() {
  const [showform, setShowform] = useState(true);
  const [imageUri, setImageUri] = useState(null);
  const [recognizedText, setRecognizedText] = useState('');
  const [enhancedText, setEnhancedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [declaration, setDeclaration] = useState('');
  const [reference, setReference] = useState('');

  const pickImageFromGallery = async () => {
    const options = {mediaType: 'photo', quality: 1};
    launchImageLibrary(options, async response => {
      if (response.didCancel) {
        Alert.alert('Cancelled', 'Image selection was cancelled.');
      } else if (response.errorMessage) {
        Alert.alert('Error', response.errorMessage);
      } else {
        const imagePath = response.assets[0].uri;
        setImageUri(imagePath);
        setRecognizedText('');
        setEnhancedText('');
        recognizeText(imagePath);
      }
    });
   await enhanceTextWithOpenAI();
  }; 
  useEffect(() => {
    if (recognizedText) {
      enhanceTextWithOpenAI();
      setShowform(!showform);
      extractDetails(enhancedText);
      console.log('Enhanced Text', enhancedText);
    }
  }, [recognizedText]);
  const recognizeText = async imagePath => {
    try {
      setIsLoading(true);
      const result = await TextRecognition.recognize(imagePath);
      setRecognizedText(result.text);
    } catch (error) {
      Alert.alert('Error', 'Failed to recognize text.');
    } finally {
      setIsLoading(false);
    }
  };
  const extractDetails = text => {
    console.log("Here is text",text)
    const texte = text;
    const parts = texte
      .split(/Code déclaration: |Référence numéro: /)
      .slice(1)
      .map(part => part.trim());

    const declarationMatch = parts[0];
    const referenceMatch = parts[1];


    if (declarationMatch) setDeclaration(declarationMatch);
    if (referenceMatch) setReference(referenceMatch);
  };

  const enhanceTextWithOpenAI = async () => {
    try {
      console.log("Tryign")
      if (!recognizedText) {
        Alert.alert('Error', 'No text to enhance.');
        return;
      }

      setIsEnhancing(true);
      const apiKey =
        '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'; // Replace with your OpenAI API Key

      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {  
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'return the code declaration and refernec number',
              },
              {role: 'user', content: recognizedText},
            ],
          }),
        },
      );

      const data = await response.json();
      setEnhancedText(
        data.choices?.[0]?.message?.content || 'Enhancement failed.',
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to enhance text.');
    } finally { 
      setIsEnhancing(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll}>
        <Text style={styles.heading}>GeTax</Text>
        <View style={styles.contentBox}>
          {!showform && (
            <View>
              <Text style={styles.label}>Reference Number:</Text>
              <TextInput
                value={reference}
                style={styles.input}
                placeholder="Reference Number..."
                placeholderTextColor="gray"
              />
              <Text style={styles.label}>Code Declaration:</Text>
              <TextInput
                value={declaration}
                style={styles.input}
                placeholder="Code Declaration..."
                placeholderTextColor="gray"
              />

              <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Download Form</Text>
              </TouchableOpacity>
            </View>
          )}
          {showform && (
            <View>
              {imageUri ? (
                <>
                  <Image source={{uri: imageUri}} style={styles.image} />

                  {isLoading ? (
                    <ActivityIndicator size="large" color="white" />
                  ) : (
                    <>
                      <Text style={styles.textRecognized}>
                        Recognized Text:{' '}
                      </Text>
                      <Text style={styles.text}>
                        {' '}
                        {recognizedText || 'No text recognized'}
                      </Text>
                    </>
                  )}

                  {recognizedText ? (
                    <>
                      <TouchableOpacity
                        style={styles.button}
                        onPress={enhanceTextWithOpenAI}
                        disabled={isEnhancing}>
                        {isEnhancing ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <Text style={styles.buttonText}>
                            Extraction Information
                          </Text>
                        )}
                      </TouchableOpacity>

                      {enhancedText ? (
                        <Text style={styles.text}>
                          Enhanced Text:
                          {enhancedText}
                        </Text>
                      ) : null}
                    </>
                  ) : null}

                  <TouchableOpacity
                    style={styles.button}
                    onPress={() => setImageUri(null)}>
                    <Text style={styles.buttonText}>Choose Another Image</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.button}
                  onPress={pickImageFromGallery}>
                  <Text style={styles.buttonText}>Pick Image from Gallery</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E293B', paddingTop: 40 },
  heading: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#F8FAFC',
    marginBottom: 20,
  },
  contentBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
  },
  image: {
    width: 300,
    height: 300,
    marginBottom: 20,
    alignSelf: 'center',
    borderRadius: 10,
  },
  textRecognized: {
    fontSize: 20,
    textAlign: 'left',
    color: '#F8FAFC',
    fontWeight: 'bold',
  },
  text: {
    fontSize: 12,
    textAlign: 'left',
    color: '#E2E8F0',
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  button: {
    backgroundColor: '#2563EB',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: { color: '#F8FAFC', fontSize: 18, fontWeight: 'bold' },
  scroll: { paddingHorizontal: 20, paddingBottom: 30 },
  input: {
    height: 50,
    borderColor: '#64748B',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    color: '#F8FAFC',
    fontSize: 16,
    marginBottom: 10,
    backgroundColor: '#334155',
  },
  label: {
    fontSize: 15,
    color: '#CBD5E1',
    fontWeight: '600',
    marginBottom: 3,
    paddingLeft: 5,
  },
});

