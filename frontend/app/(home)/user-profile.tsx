import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";

import { useAuthStore } from '@/store/auth';
import { router } from "expo-router";

export default function UserProfile() {
  const logout = useAuthStore(state => state.logout);

  const handleLogout = () => {
        logout();                        // sets isAuthenticated = false
        router.replace('/(auth)');       
  };
    // Placeholder user data - later will connect to database
  const user = {
    name: "John Doe",
    age: 26,
    city: "Philadelphia",
    interests: ["Exercise", "Sport", "Indoor"],
    about:
      "Hey, I'm John! I’m looking for a partner (or a small group) to go climbing with this Saturday. Whether you're a pro or just getting started, come hang out!",
    avatar: "https://randomuser.me/api/portraits/lego/1.jpg", 
  };

  return (
    <ScrollView style={styles.container}>
      {/* Back Button
      <TouchableOpacity onPress={() => navigator.goBack()}>
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity> */}

      <Text style={styles.name}>{user.name}</Text>

      <Image source={{ uri: user.avatar }} style={styles.avatar} />

      <View style={styles.divider} />

      <View style={styles.row}>
        <Text style={styles.location}>📍 {user.city}</Text>
        <Text style={styles.age}>{user.age}</Text>
      </View>

      <Text style={styles.sectionTitle}>Interests</Text>
      <View style={styles.interestsContainer}>
        {user.interests.map((item, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{item}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>About me</Text>
      <Text style={styles.about}>{user.about}</Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.outlineBtn}>
          <Text style={styles.outlineText}>Message</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.outlineBtn}>
          <Text style={styles.outlineText}>See events</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.logOutBtn} onPress={handleLogout}>
          <Text style={styles.outlineText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0b0b",
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  backArrow: {
    color: "#fff",
    fontSize: 28,
    marginBottom: 10,
  },
  name: {
    color: "#fff",
    fontSize: 32,
    textAlign: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignSelf: "center"
  },
  divider: {
    height: 1,
    backgroundColor: "#444",
    marginVertical: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  location: {
    color: "#fff",
    fontSize: 18,
  },
  age: {
    color: "#fff",
    fontSize: 28,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 18,
    marginBottom: 10,
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  tag: {
    borderWidth: 1,
    borderColor: "#aaa",
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  tagText: {
    color: "#fff",
  },
  about: {
    color: "#ddd",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 60,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 40
  },
  outlineBtn: {
    borderWidth: 1,
    borderColor: "#fff",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 25,
  },
  logOutBtn:{
    borderWidth: 1,
    borderColor: "#da1414",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 25,
    marginTop: 30
  },
  outlineText: {
    color: "#fff",
  },
});