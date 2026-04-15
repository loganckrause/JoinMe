import React from "react";
import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import { IconSymbol } from "./icon-symbol.ios";
import { ThemedView } from "../themed-view";
import { router } from "expo-router";

type Event = {
  id: number;
  title: string;
  number: string;
  location: string;
  image: string;
  description: string;
};

type Props = {
  events: Event[];
};

export default function EventList({ events }: Props) {
  return (
    
    <View style={styles.container}>
      {events.map((event) => (
          <Pressable
              key={event.id}
              onPress={() => router.push({ pathname: '/event', params: { event: JSON.stringify(event) } })}
              style={({ pressed }) => [
                styles.eventCard,
                pressed && { opacity: 0.7 }
              ]}
          >
            <View style={styles.left}>
              <Text style={styles.eventTitle} numberOfLines={1}>
                {event.title}
              </Text>

              <Text style={styles.eventText} numberOfLines={1}>
                {event.location}
              </Text>

              <ThemedView style={styles.row}>
                <Text style={styles.eventPeople}>{event.number}</Text>
                <IconSymbol size={25} name="person.2" color="#fff" />
              </ThemedView>
            </View>
            
            <Image source={{ uri: event.image }} style={styles.eventImage} />
          </Pressable>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
    toggle: {
        backgroundColor: "#6b2424",
    },
   
  container: {
    gap: 15,
  },

  eventCard: {
    flexDirection: "row",            
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderWidth: 1,
    borderColor: "#868585",
    borderRadius: 12,
    backgroundColor: "#0f0f0f",
  },

  left: {
    flex: 1,                       
    gap: 6,
    paddingRight: 10,              
  },

  eventTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },

  eventText: {
    fontSize: 14,
    color: "#aaa",
  },

  eventImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
    eventPeople: {
    fontSize: 18,
    color: "#aaa",
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'transparent',
  },
  
  
});