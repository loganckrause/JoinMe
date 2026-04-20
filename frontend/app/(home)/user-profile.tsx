import { IconSymbol } from "@/components/ui/icon-symbol.ios";
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { BackButton } from "@/components/back-button";
import Sidebar from "@/components/ui/sidebar";
import { useAuthStore } from "@/store/auth";
import { fetchProfileData, fetchUserById, fetchUserInterestsById } from "@/services/profile";
import { AppUser, toSidebarUser } from "@/services/user";
export default function UserProfile() {
  const router = useRouter();
  const { userId, source } = useLocalSearchParams<{ userId?: string | string[]; source?: string | string[] }>();
  const rawUserId = Array.isArray(userId) ? userId[0] : userId;
  const rawSource = Array.isArray(source) ? source[0] : source;
  const isFromEvent = rawSource === 'event';
  const parsedUserId = useMemo(() => {
    if (typeof rawUserId === 'undefined') {
      return undefined;
    }
    if (rawUserId === 'me') {
    return undefined;
  }

    const id = Number(rawUserId);
    return Number.isFinite(id) ? id : null;
  }, [rawUserId]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileUser, setProfileUser] = useState<AppUser | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore((state) => state.token);
  const authUser = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      if (parsedUserId === null) {
        if (mounted) {
          setLoading(false);
          setError('Invalid profile id.');
        }
        return;
      }

      if (typeof parsedUserId === 'number') {
        try {
          setLoading(true);
          setError(null);
          const [userProfile, userInterests] = await Promise.all([
            fetchUserById(parsedUserId),
            fetchUserInterestsById(parsedUserId),
          ]);
          if (mounted) {
            setProfileUser(userProfile);
            setInterests(userInterests);
          }
        } catch (loadError) {
          if (mounted) {
            setError(loadError instanceof Error ? loadError.message : 'Failed to load profile');
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
        return;
      }

      if (!token) {
        if (mounted) {
          setLoading(false);
          setError('No active session. Please log in again.');
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const profile = await fetchProfileData(token);
        if (mounted) {
          setUser(profile.user);
          setProfileUser(profile.user);
          setInterests(profile.interests);
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load profile');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [parsedUserId, setUser, token]);

  return (
    <ScrollView style={{ flex: 1 , paddingHorizontal: 20}}>
      <View style={styles.topBar}>
          {isFromEvent ? <BackButton /> : (
            <TouchableOpacity onPress={() => setSidebarOpen(true)}>
                <IconSymbol name="line.3.horizontal" color="#fff" size={30} />
            </TouchableOpacity>
          )}
      </View>
      {!loading && error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Text style={styles.name}>{profileUser?.name}</Text>

      <Image source={{ uri: profileUser?.photoUri ?? undefined }} style={styles.avatar} />


      <View style={styles.statsContainer}>
        <View style={[styles.statItem, styles.cityItem]}>
          <Text style={[styles.statNumber, styles.statNumber]}>
          {profileUser?.city ?? "-"}
          </Text>
          <Text style={styles.statLabel}>
            City
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {profileUser?.age ?? "-"}
          </Text>
          <Text style={styles.statLabel}>Age</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {profileUser?.rating_score.toFixed(1) ?? "-"}
          </Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>
      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>Interests</Text>
      <View style={styles.interestsContainer}>
        {interests.length === 0 ? (
          <Text style={styles.about}>No interests selected yet.</Text>
        ) : null}
        {interests.map((item, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{item}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>About me</Text>
      <Text style={styles.about}>{profileUser?.bio || 'No bio added yet.'}</Text>

      <View style={styles.buttonRow}>
        {authUser?.id === profileUser?.id ? (
          <TouchableOpacity 
            style={styles.outlineBtn}
            onPress={() => router.push('/(home)/edit-profile')}
          >
            <Text style={styles.outlineText}>Edit Profile</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity style={styles.outlineBtn}>
          <Text style={styles.outlineText}>See events</Text>
        </TouchableOpacity>
      </View>
      <Sidebar
          visible={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          user={toSidebarUser(authUser)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 60,
    backgroundColor: 'transparent',
  },
  backButton: {
        padding: 4,
  },
  infoText: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  errorText: {
    color: '#f26d6d',
    fontSize: 14,
    textAlign: 'center',
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
  backIcon: {
        transform: [{ scaleX: -1 }],
    },
 statsContainer: {
  flexDirection: "row",
  justifyContent: "space-around",
  alignItems: "center",
  gap: 60, // controls space BETWEEN 28 and 2.0
  marginTop: 20,
},

statItem: {
  alignItems: "center", // centers label under number
},

statNumber: {
  color: "#fff",
  fontSize: 20,
  fontWeight: "600",
},

statLabel: {
  color: "#aaa",
  fontSize: 12,
  marginTop: 2,
},

locationCentered: {
  textAlign: "center",
  color: "#ddd",
},
cityItem: {
  alignItems: "flex-start",
  maxWidth: 160,
},
});
