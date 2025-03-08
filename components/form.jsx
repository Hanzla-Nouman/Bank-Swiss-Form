import { View, Text } from 'react-native'
import React from 'react'

const form = () => {
  return (
    <View>
      <TextInput
  style={styles.input}
  value={formData.name}
  onChangeText={(text) => setFormData({ ...formData, name: text })}
/>
<TextInput
  style={styles.input}
  value={formData.email}
  onChangeText={(text) => setFormData({ ...formData, email: text })}
/>
<TextInput
  style={styles.input}
  value={formData.phone}
  onChangeText={(text) => setFormData({ ...formData, phone: text })}
/>

    </View>
  )
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
export default form
