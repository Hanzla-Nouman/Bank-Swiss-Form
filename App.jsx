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
  Button,
} from 'react-native';
import { StripeProvider } from '@stripe/stripe-react-native';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import { useStripe } from '@stripe/stripe-react-native';

import { PermissionsAndroid, Platform } from 'react-native';
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
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [clientSecret, setClientSecret] = useState(null);
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
        await recognizeText(imagePath);  // Wait for text recognition to finish
      }
    });
  };
  
  // Only run when recognizedText is updated
  useEffect(() => {
    if (recognizedText) {
      enhanceTextWithOpenAI();
    }
  }, [recognizedText]);
  
  // Only run when enhancedText is updated
  useEffect(() => {
    if (enhancedText) {
      extractDetails(enhancedText);
      setShowform(false);
    }
  }, [enhancedText]);
  
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
  const testServer = async () => {
    try {
      const response = await fetch('http://10.54.5.240:3000/test');
      const data = await response.json();
      console.log("Test Server Response:", data);
    } catch (error) {
      console.error("Error testing server:", error);
    }
  };
  testServer()
  const fetchPaymentIntent = async () => {
    console.log("Fetching payment intent");
    try {
      const response = await fetch('http://10.0.2.2:3000/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log("Payment Intent Data:", data);
      setClientSecret(data.clientSecret);
    } catch (error) {
      console.error("Error fetching payment intent:", error);
      Alert.alert("Error", "Failed to fetch payment intent");
    }
  };
  const initializePaymentSheet = async () => {
    await fetchPaymentIntent();
    if (!clientSecret) return;

    const { error } = await initPaymentSheet({
      paymentIntentClientSecret: clientSecret,
    });

    if (!error) {
      openPaymentSheet();
    }
  };

  const openPaymentSheet = async () => {
    const { error } = await presentPaymentSheet();

    if (error) {
      Alert.alert(`Error: ${error.code}`, error.message);
    } else {
      Alert.alert("Success", "Payment successful!");
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
  const ExportPDF = () => {
    const requestStoragePermission = async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
              title: 'Storage Permission',
              message: 'This app needs access to your storage to save the PDF.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        } catch (err) {
          console.warn(err);
          return false;
        }
      }
      return true;
    }}
    const createPDF = async () => {
      console.log("Pressing")

  
      let options = {
        html: `
          <h1 style="text-align: center;">Tax Form</h1>
          <p>Code Declaration: <b>${declaration}</b></p>
          <p>Code Referenec: <b>${reference}</b></p>
          
        `,
        fileName: 'sample_pdf',
        directory: 'Download',
      };
  
      try {
        let file = await RNHTMLtoPDF.convert(options);
        Alert.alert('Success', `PDF saved to: ${file.filePath}`);
        console.log('PDF File Path:', file.filePath);
      } catch (error) {
        console.error('Error creating PDF:', error);
      }
    };
  return (
    <StripeProvider publishableKey="pk_test_51PCo4FSFzJ2llaTnYzjN7JzvhiAVEKHw1zTWij1GMEeU9FNsvQoQVTMEcl7N3LlRyAUaEPnHaq1AHf8sqcWsXGUD009EUdNudv">
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
                <Text style={styles.buttonText} onPress={createPDF}>Download Form</Text>
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
                <View>
                <TouchableOpacity
                  style={styles.button}
                  onPress={pickImageFromGallery}>
                  <Text style={styles.buttonText}>Pick Image</Text>
                </TouchableOpacity>
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Button title="Pay Now" onPress={initializePaymentSheet} />
    </View>
       
</View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
    </StripeProvider>
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

